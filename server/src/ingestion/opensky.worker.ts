import axios from 'axios';
import { config } from '../config.js';
import { wsHub } from '../websocket/wsHub.js';
import { getRedis } from '../services/redis.js';
import { updateOpenSkyCache } from './adsbexchange.worker.js';

interface FlightData {
  id: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  velocity: number;
  verticalRate: number;
  onGround: boolean;
  country: string;
  squawk: string;
  timestamp: number;
  isMilitary: boolean;
}

// ── OAuth2 token cache ─────────────────────────────────────────────────────
let oauthToken: string | null = null;
let tokenExpiry = 0;

async function getOAuthToken(): Promise<string | null> {
  if (!config.opensky.clientId || !config.opensky.clientSecret) return null;
  if (oauthToken && Date.now() < tokenExpiry - 30_000) return oauthToken;

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', config.opensky.clientId);
    params.append('client_secret', config.opensky.clientSecret);

    const res = await axios.post(
      'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10_000 }
    );

    oauthToken = res.data.access_token as string;
    tokenExpiry = Date.now() + (res.data.expires_in as number) * 1000;
    console.log('[OpenSky] OAuth2 token obtained, expires in', res.data.expires_in, 's');
    return oauthToken;
  } catch (err: any) {
    console.warn('[OpenSky] OAuth2 token fetch failed, falling back to anonymous:', err.message);
    return null;
  }
}

// ── Flight fetch ──────────────────────────────────────────────────────────
async function fetchFlights(): Promise<FlightData[]> {
  try {
    const headers: Record<string, string> = {};

    // Prefer OAuth2
    const token = await getOAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (config.opensky.username) {
      // Fallback to basic auth
      const creds = Buffer.from(
        `${config.opensky.username}:${config.opensky.password}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${creds}`;
    }

    const response = await axios.get('https://opensky-network.org/api/states/all', {
      headers,
      timeout: 15_000,
    });

    if (!response.data?.states) return [];

    const flights: FlightData[] = [];
    for (const state of response.data.states as any[][]) {
      const lon = state[5] as number | null;
      const lat = state[6] as number | null;
      if (lon == null || lat == null) continue;

      flights.push({
        id: state[0] as string,
        callsign: ((state[1] as string) || '').trim(),
        lat,
        lon,
        altitude: (state[7] as number) || (state[13] as number) || 0,
        heading: (state[10] as number) || 0,
        velocity: (state[9] as number) || 0,
        verticalRate: (state[11] as number) || 0,
        onGround: state[8] as boolean,
        country: state[2] as string,
        squawk: (state[14] as string) || '',
        timestamp: (state[3] as number) || Date.now() / 1000,
        isMilitary: false,
      });
    }

    return flights;
  } catch (err: any) {
    console.error('[OpenSky] Fetch error:', err.message);
    return [];
  }
}

// ── Polling loop ───────────────────────────────────────────────────────────
let isPolling = false;

async function poll() {
  if (isPolling) return;
  isPolling = true;

  try {
    const flights = await fetchFlights();

    if (flights.length > 0) {
      try {
        const redis = getRedis();
        if (redis.status === 'ready') {
          await redis.set('flights:commercial:latest', JSON.stringify(flights), 'EX', 30);
        }
      } catch {
        // Redis not available, continue
      }

      // Feed military extraction with fresh OpenSky data
      updateOpenSkyCache(flights);

      wsHub.broadcast('flights:commercial', flights);
      console.log(`[OpenSky] Broadcast ${flights.length} flights`);
    }
  } finally {
    isPolling = false;
  }
}

export function startOpenSkyWorker() {
  console.log('[OpenSky] Starting worker (OAuth2 enabled), polling every', config.opensky.pollInterval, 'ms');
  poll();
  setInterval(poll, config.opensky.pollInterval);
}
