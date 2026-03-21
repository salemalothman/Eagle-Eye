/**
 * AISStream WebSocket Worker
 * Connects to wss://stream.aisstream.io/v0/stream and broadcasts
 * real-time maritime AIS position reports to all Eagle Eye clients.
 *
 * API key: AISSTREAM_API_KEY in .env
 * Docs:    https://aisstream.io/documentation
 */

import WebSocket from 'ws';
import { config } from '../config.js';
import { wsHub } from '../websocket/wsHub.js';
import { getRedis } from '../services/redis.js';

interface VesselData {
  id: string;          // MMSI
  name: string;
  callsign: string;
  lat: number;
  lon: number;
  heading: number;
  cog: number;         // course over ground
  sog: number;         // speed over ground (knots)
  shipType: number;
  status: number;      // navigation status
  country: string;
  timestamp: number;
}

const AIS_URL = 'wss://stream.aisstream.io/v0/stream';
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isShuttingDown = false;

// Bounding boxes: worldwide coverage split into 3 regions
const BOUNDING_BOXES = [
  [[-90, -180], [90, 180]], // full world
];

function buildSubscribeMsg() {
  return JSON.stringify({
    APIKey: config.aisstream.apiKey,
    BoundingBoxes: BOUNDING_BOXES,
    FilterMessageTypes: ['PositionReport'],
  });
}

function parsePositionReport(msg: any): VesselData | null {
  const meta = msg.MetaData;
  const pos = msg.Message?.PositionReport;
  if (!meta || !pos) return null;

  const lat = pos.Latitude ?? meta.latitude;
  const lon = pos.Longitude ?? meta.longitude;
  if (lat == null || lon == null) return null;

  return {
    id: String(meta.MMSI || ''),
    name: (meta.ShipName || '').trim(),
    callsign: '',
    lat,
    lon,
    heading: pos.TrueHeading ?? pos.Cog ?? 0,
    cog: pos.Cog ?? 0,
    sog: pos.Sog ?? 0,
    shipType: 0,
    status: pos.NavigationalStatus ?? 0,
    country: '',
    timestamp: Date.now() / 1000,
  };
}

// Batch buffer – flush every 2 s to avoid hammering clients
const buffer: VesselData[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function startFlushTimer() {
  if (flushTimer) return;
  flushTimer = setInterval(async () => {
    if (buffer.length === 0) return;
    const batch = buffer.splice(0, buffer.length);

    try {
      const redis = getRedis();
      if (redis.status === 'ready') {
        await redis.set('vessels:latest', JSON.stringify(batch), 'EX', 30);
      }
    } catch {
      // Redis unavailable
    }

    wsHub.broadcast('vessels', batch);
    console.log(`[AISStream] Broadcast ${batch.length} vessel positions`);
  }, 2_000);
}

function connect() {
  if (!config.aisstream.apiKey) {
    console.warn('[AISStream] No API key set – maritime layer disabled');
    return;
  }

  console.log('[AISStream] Connecting to', AIS_URL);
  ws = new WebSocket(AIS_URL);

  ws.on('open', () => {
    console.log('[AISStream] Connected – sending subscription');
    ws!.send(buildSubscribeMsg());
    startFlushTimer();
  });

  ws.on('message', (raw: WebSocket.RawData) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.MessageType !== 'PositionReport') return;
      const vessel = parsePositionReport(msg);
      if (vessel) buffer.push(vessel);
    } catch {
      // malformed message
    }
  });

  ws.on('error', (err) => {
    console.error('[AISStream] WebSocket error:', err.message);
  });

  ws.on('close', (code, reason) => {
    console.warn(`[AISStream] Connection closed (${code}): ${reason} — reconnecting in 10 s`);
    ws = null;
    if (!isShuttingDown) {
      reconnectTimer = setTimeout(connect, 10_000);
    }
  });
}

export function startAisStreamWorker() {
  console.log('[AISStream] Starting maritime AIS worker');
  connect();
}

export function stopAisStreamWorker() {
  isShuttingDown = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (flushTimer) clearInterval(flushTimer);
  if (ws) ws.close();
}
