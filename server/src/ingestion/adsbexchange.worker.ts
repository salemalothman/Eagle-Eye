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
  if (!config.adsbx.apiKey) {
    // If no ADS-B Exchange key, extract military from OpenSky cached data
    return extractMilitaryFromOpenSky();
  }

  try {
    const response = await axios.get('https://adsbexchange-com1.p.rapidapi.com/v2/mil/', {
      headers: {
        'X-RapidAPI-Key': config.adsbx.apiKey,
        'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com',
      },
      timeout: 15_000,
    });

    if (!response.data?.ac) return [];

    return response.data.ac
      .filter((ac: any) => ac.lat != null && ac.lon != null)
      .map((ac: any) => ({
        id: ac.hex || ac.icao || String(Math.random()),
        callsign: (ac.flight || ac.r || '').trim(),
        lat: ac.lat,
        lon: ac.lon,
        altitude: (ac.alt_baro || ac.alt_geom || 0) * 0.3048, // feet -> meters
        heading: ac.track || ac.true_heading || 0,
        velocity: (ac.gs || 0) * 0.514444, // knots -> m/s
        verticalRate: (ac.baro_rate || 0) * 0.00508, // ft/min -> m/s
        onGround: ac.alt_baro === 'ground',
        country: ac.r || '',
        squawk: ac.squawk || '',
        timestamp: ac.seen_pos ? Date.now() / 1000 - ac.seen_pos : Date.now() / 1000,
        isMilitary: true,
      }));
  } catch (err: any) {
    console.warn('[ADS-B Exchange] Fetch error:', err.message);
    return extractMilitaryFromOpenSky();
  }
}

async function extractMilitaryFromOpenSky(): Promise<FlightData[]> {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') return [];
    const cached = await redis.get('flights:commercial:latest');
    if (!cached) return [];

    const flights: FlightData[] = JSON.parse(cached);
    return flights
      .filter((f) => isMilitaryCallsign(f.callsign) || isMilitarySquawk(f.squawk))
      .map((f) => ({ ...f, isMilitary: true }));
  } catch {
    return [];
  }
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
