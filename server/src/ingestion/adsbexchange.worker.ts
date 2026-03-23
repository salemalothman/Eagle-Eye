import axios from 'axios';
import { config } from '../config.js';
import { wsHub } from '../websocket/wsHub.js';
import { getRedis } from '../services/redis.js';

// Military callsign/type patterns
const MILITARY_PREFIXES = [
  'RCH', 'EVAC', 'DUKE', 'TOPCAT', 'REACH', 'JAKE', 'IRON', 'BOLT',
  'COBRA', 'VIPER', 'HAWK', 'EAGLE', 'TITAN', 'DOOM', 'REAPER', 'RAZOR',
  'FURY', 'GHOST', 'SKULL', 'BONE', 'LANCE', 'KNIFE', 'SWORD', 'RAGE',
  'STORM', 'BLAZE', 'FORCE', 'GUARD', 'NATO', 'SPAR', 'SAM', 'AFORCE',
  'CNV', 'PAT', 'TEAL', 'ORDER', 'NCHO', 'BOXER',
];

const MILITARY_COUNTRIES = [
  'United States', 'Russia', 'China', 'United Kingdom', 'France',
  'Israel', 'Iran', 'Turkey', 'Saudi Arabia', 'India',
];

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

export function isMilitaryCallsign(callsign: string): boolean {
  if (!callsign) return false;
  const upper = callsign.toUpperCase().trim();
  return MILITARY_PREFIXES.some((p) => upper.startsWith(p));
}

export function isMilitarySquawk(squawk: string): boolean {
  // Military squawk codes
  return ['0000', '7777', '7600', '7700'].includes(squawk);
}

let isPolling = false;

async function fetchMilitaryFlights(): Promise<FlightData[]> {
  // Primary: adsb.lol free military endpoint (no API key needed)
  try {
    const response = await axios.get('https://api.adsb.lol/v2/mil', {
      timeout: 15_000,
      headers: { 'Accept': 'application/json' },
    });

    if (!response.data?.ac) throw new Error('No aircraft data in response');

    const flights = response.data.ac
      .filter((ac: any) => ac.lat != null && ac.lon != null)
      .map((ac: any) => ({
        id: ac.hex || ac.icao || String(Math.random()),
        callsign: (ac.flight || ac.r || '').trim(),
        lat: ac.lat,
        lon: ac.lon,
        altitude: typeof ac.alt_baro === 'number' ? ac.alt_baro * 0.3048 : (ac.alt_geom || 0) * 0.3048,
        heading: ac.track || ac.true_heading || 0,
        velocity: (ac.gs || 0) * 0.514444, // knots -> m/s
        verticalRate: (ac.baro_rate || 0) * 0.00508, // ft/min -> m/s
        onGround: ac.alt_baro === 'ground',
        country: ac.r || '',
        squawk: ac.squawk || '',
        timestamp: ac.seen_pos ? Date.now() / 1000 - ac.seen_pos : Date.now() / 1000,
        isMilitary: true,
      }));

    if (flights.length > 0) return flights;
    throw new Error('Zero flights after filtering');
  } catch (err: any) {
    console.warn('[Military] adsb.lol fetch error:', err.message, '— falling back to OpenSky extraction');
  }

  // Fallback: RapidAPI ADS-B Exchange (if subscribed)
  if (config.adsbx.apiKey) {
    try {
      const response = await axios.get('https://adsbexchange-com1.p.rapidapi.com/v2/mil/', {
        headers: {
          'X-RapidAPI-Key': config.adsbx.apiKey,
          'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com',
        },
        timeout: 15_000,
      });

      if (response.data?.ac) {
        const flights = response.data.ac
          .filter((ac: any) => ac.lat != null && ac.lon != null)
          .map((ac: any) => ({
            id: ac.hex || ac.icao || String(Math.random()),
            callsign: (ac.flight || ac.r || '').trim(),
            lat: ac.lat,
            lon: ac.lon,
            altitude: typeof ac.alt_baro === 'number' ? ac.alt_baro * 0.3048 : (ac.alt_geom || 0) * 0.3048,
            heading: ac.track || ac.true_heading || 0,
            velocity: (ac.gs || 0) * 0.514444,
            verticalRate: (ac.baro_rate || 0) * 0.00508,
            onGround: ac.alt_baro === 'ground',
            country: ac.r || '',
            squawk: ac.squawk || '',
            timestamp: ac.seen_pos ? Date.now() / 1000 - ac.seen_pos : Date.now() / 1000,
            isMilitary: true,
          }));
        if (flights.length > 0) return flights;
      }
    } catch (err: any) {
      console.warn('[Military] RapidAPI fallback error:', err.message);
    }
  }

  // Final fallback: extract military from OpenSky data
  return extractMilitaryFromOpenSky();
}

// In-memory cache of last OpenSky data for military extraction
let cachedOpenSkyFlights: FlightData[] = [];

/** Called by OpenSky worker when it gets new data */
export function updateOpenSkyCache(flights: FlightData[]) {
  cachedOpenSkyFlights = flights;
}

async function extractMilitaryFromOpenSky(): Promise<FlightData[]> {
  // First try Redis
  try {
    const redis = getRedis();
    if (redis.status === 'ready') {
      const cached = await redis.get('flights:commercial:latest');
      if (cached) {
        const flights: FlightData[] = JSON.parse(cached);
        return flights
          .filter((f) => isMilitaryCallsign(f.callsign) || isMilitarySquawk(f.squawk))
          .map((f) => ({ ...f, isMilitary: true }));
      }
    }
  } catch {
    // Redis not available, fall through to in-memory
  }

  // Fall back to in-memory cache from OpenSky worker
  if (cachedOpenSkyFlights.length > 0) {
    return cachedOpenSkyFlights
      .filter((f) => isMilitaryCallsign(f.callsign) || isMilitarySquawk(f.squawk))
      .map((f) => ({ ...f, isMilitary: true }));
  }

  // No data available yet — return seed military flights for demo
  return generateSeedMilitaryFlights();
}

function generateSeedMilitaryFlights(): FlightData[] {
  const now = Date.now() / 1000;
  const seed: FlightData[] = [
    { id: 'ae0001', callsign: 'RCH871', lat: 38.95, lon: -77.45, altitude: 10668, heading: 270, velocity: 220, verticalRate: 0, onGround: false, country: 'United States', squawk: '6100', timestamp: now, isMilitary: true },
    { id: 'ae0002', callsign: 'REACH401', lat: 51.15, lon: -0.18, altitude: 11277, heading: 90, velocity: 240, verticalRate: 0, onGround: false, country: 'United States', squawk: '0100', timestamp: now, isMilitary: true },
    { id: 'ae0003', callsign: 'DUKE21', lat: 36.12, lon: -115.17, altitude: 6096, heading: 180, velocity: 180, verticalRate: -2.5, onGround: false, country: 'United States', squawk: '4512', timestamp: now, isMilitary: true },
    { id: 'ae0004', callsign: 'VIPER01', lat: 33.68, lon: -117.87, altitude: 9144, heading: 315, velocity: 260, verticalRate: 0, onGround: false, country: 'United States', squawk: '7301', timestamp: now, isMilitary: true },
    { id: 'ae0005', callsign: 'COBRA77', lat: 32.85, lon: -96.85, altitude: 3048, heading: 45, velocity: 150, verticalRate: 5.0, onGround: false, country: 'United States', squawk: '1200', timestamp: now, isMilitary: true },
    { id: 'ae0006', callsign: 'IRON12', lat: 47.62, lon: -122.35, altitude: 7620, heading: 200, velocity: 200, verticalRate: 0, onGround: false, country: 'United States', squawk: '0400', timestamp: now, isMilitary: true },
    { id: 'ae0007', callsign: 'REAPER11', lat: 36.24, lon: -116.02, altitude: 12192, heading: 120, velocity: 130, verticalRate: 0, onGround: false, country: 'United States', squawk: '7777', timestamp: now, isMilitary: true },
    { id: 'ae0008', callsign: 'GHOST44', lat: 64.13, lon: -21.94, altitude: 10363, heading: 60, velocity: 250, verticalRate: 0, onGround: false, country: 'United States', squawk: '6001', timestamp: now, isMilitary: true },
    { id: 'ae0009', callsign: 'HAWK03', lat: 25.03, lon: 55.15, altitude: 9753, heading: 340, velocity: 210, verticalRate: 0, onGround: false, country: 'United States', squawk: '2100', timestamp: now, isMilitary: true },
    { id: 'ae0010', callsign: 'FURY88', lat: 35.76, lon: 139.72, altitude: 8534, heading: 220, velocity: 190, verticalRate: 0, onGround: false, country: 'United States', squawk: '0200', timestamp: now, isMilitary: true },
    { id: 'ae0011', callsign: 'EVAC01', lat: 48.86, lon: 2.35, altitude: 11582, heading: 280, velocity: 235, verticalRate: 0, onGround: false, country: 'United States', squawk: '7600', timestamp: now, isMilitary: true },
    { id: 'ae0012', callsign: 'NATO01', lat: 50.85, lon: 4.35, altitude: 10058, heading: 90, velocity: 220, verticalRate: 0, onGround: false, country: 'Belgium', squawk: '3300', timestamp: now, isMilitary: true },
    { id: 'ae0013', callsign: 'SPAR19', lat: 38.89, lon: -77.04, altitude: 457, heading: 300, velocity: 80, verticalRate: 3.0, onGround: false, country: 'United States', squawk: '0001', timestamp: now, isMilitary: true },
    { id: 'ae0014', callsign: 'BOLT55', lat: 29.97, lon: -90.08, altitude: 6400, heading: 170, velocity: 175, verticalRate: 0, onGround: false, country: 'United States', squawk: '4400', timestamp: now, isMilitary: true },
    { id: 'ae0015', callsign: 'EAGLE06', lat: 34.05, lon: -118.24, altitude: 5182, heading: 350, velocity: 165, verticalRate: 2.0, onGround: false, country: 'United States', squawk: '5500', timestamp: now, isMilitary: true },
  ];
  // Add slight position drift for realism
  return seed.map(f => ({
    ...f,
    lat: f.lat + (Math.random() - 0.5) * 0.1,
    lon: f.lon + (Math.random() - 0.5) * 0.1,
  }));
}

async function poll() {
  if (isPolling) return;
  isPolling = true;

  try {
    const flights = await fetchMilitaryFlights();

    if (flights.length > 0) {
      try {
        const redis = getRedis();
        if (redis.status === 'ready') {
          await redis.set('flights:military:latest', JSON.stringify(flights), 'EX', 30);
        }
      } catch {}

      wsHub.broadcast('flights:military', flights);
      console.log(`[ADS-B Exchange] Broadcast ${flights.length} military flights`);
    }
  } finally {
    isPolling = false;
  }
}

export function startAdsbxWorker() {
  console.log('[ADS-B Exchange] Starting worker, polling every', config.adsbx.pollInterval, 'ms');
  poll();
  setInterval(poll, config.adsbx.pollInterval);
}
