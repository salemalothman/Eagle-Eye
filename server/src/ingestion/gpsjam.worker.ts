/**
 * GPSJam ingestion worker
 * Fetches GPS jamming data from gpsjam.org (publicly available grid data)
 * Falls back to curated seed data when unavailable.
 */
import axios from 'axios';
import { wsHub } from '../websocket/wsHub.js';
import { getRedis } from '../services/redis.js';

interface JammingCell {
  h3Index: string;
  lat: number;
  lon: number;
  intensity: number; // 0-1
}

// Known GPS jamming hotspots (seed data for when live API is unavailable)
const SEED_JAMMING: JammingCell[] = [
  // Eastern Mediterranean / Syria
  { h3Index: 'h3_aleppo_1', lat: 36.2, lon: 37.15, intensity: 0.9 },
  { h3Index: 'h3_aleppo_2', lat: 36.15, lon: 37.3, intensity: 0.85 },
  { h3Index: 'h3_aleppo_3', lat: 36.25, lon: 37.0, intensity: 0.7 },
  { h3Index: 'h3_aleppo_4', lat: 36.3, lon: 37.2, intensity: 0.75 },
  { h3Index: 'h3_damascus_1', lat: 33.5, lon: 36.3, intensity: 0.8 },
  { h3Index: 'h3_damascus_2', lat: 33.55, lon: 36.45, intensity: 0.6 },
  { h3Index: 'h3_latakia_1', lat: 35.53, lon: 35.79, intensity: 0.7 },
  // Iraq / Baghdad
  { h3Index: 'h3_baghdad_1', lat: 33.3, lon: 44.4, intensity: 0.5 },
  { h3Index: 'h3_baghdad_2', lat: 33.35, lon: 44.55, intensity: 0.4 },
  { h3Index: 'h3_mosul_1', lat: 36.34, lon: 43.13, intensity: 0.6 },
  // Eastern Ukraine / Donbas
  { h3Index: 'h3_donbas_1', lat: 48.0, lon: 38.0, intensity: 0.95 },
  { h3Index: 'h3_donbas_2', lat: 48.1, lon: 37.8, intensity: 0.85 },
  { h3Index: 'h3_donbas_3', lat: 47.9, lon: 38.2, intensity: 0.7 },
  { h3Index: 'h3_donbas_4', lat: 48.2, lon: 38.5, intensity: 0.65 },
  { h3Index: 'h3_donbas_5', lat: 47.8, lon: 37.5, intensity: 0.55 },
  { h3Index: 'h3_crimea_1', lat: 45.3, lon: 34.0, intensity: 0.8 },
  { h3Index: 'h3_crimea_2', lat: 45.2, lon: 33.8, intensity: 0.6 },
  { h3Index: 'h3_zaporizhzhia_1', lat: 47.84, lon: 35.14, intensity: 0.7 },
  // Kaliningrad / Baltic
  { h3Index: 'h3_kaliningrad_1', lat: 54.7, lon: 20.5, intensity: 0.7 },
  { h3Index: 'h3_kaliningrad_2', lat: 54.75, lon: 20.3, intensity: 0.5 },
  { h3Index: 'h3_gdansk_1', lat: 54.35, lon: 18.65, intensity: 0.3 },
  // Iran
  { h3Index: 'h3_tehran_1', lat: 35.7, lon: 51.4, intensity: 0.6 },
  { h3Index: 'h3_iran_gulf_1', lat: 27.0, lon: 56.0, intensity: 0.5 },
  { h3Index: 'h3_iran_gulf_2', lat: 26.8, lon: 56.3, intensity: 0.4 },
  // North Korea border
  { h3Index: 'h3_nkorea_1', lat: 38.0, lon: 125.7, intensity: 0.7 },
  { h3Index: 'h3_nkorea_2', lat: 38.3, lon: 126.5, intensity: 0.5 },
  // Gaza / Israel
  { h3Index: 'h3_gaza_1', lat: 31.5, lon: 34.47, intensity: 0.85 },
  { h3Index: 'h3_gaza_2', lat: 31.4, lon: 34.3, intensity: 0.75 },
  { h3Index: 'h3_telaviv_1', lat: 32.07, lon: 34.78, intensity: 0.4 },
  // Lebanon
  { h3Index: 'h3_beirut_1', lat: 33.89, lon: 35.5, intensity: 0.5 },
];

let lastFetchTime = 0;
const FETCH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours (GPSJam updates daily)

async function fetchGpsJamData(): Promise<JammingCell[]> {
  try {
    // GPSJam publishes daily CSV data. Attempt to fetch the latest grid summary.
    // The API endpoint returns JSON with hex grid cells when available.
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(
      `https://gpsjam.org/api/data?date=${today}&slat=-90&nlat=90&wlon=-180&elon=180`,
      { timeout: 15_000 }
    );

    if (!Array.isArray(res.data)) return SEED_JAMMING;

    const cells: JammingCell[] = res.data
      .filter((d: any) => d.lat && d.lon && d.level > 0)
      .map((d: any, i: number) => ({
        h3Index: `gpsjam_live_${i}`,
        lat: d.lat,
        lon: d.lon,
        intensity: Math.min(1, d.level / 3),
      }));

    return cells.length > 0 ? cells : SEED_JAMMING;
  } catch {
    // GPSJam API not available — use curated seed data
    return SEED_JAMMING;
  }
}

async function broadcastJammingData() {
  const now = Date.now();
  if (now - lastFetchTime < FETCH_INTERVAL_MS) return;
  lastFetchTime = now;

  const cells = await fetchGpsJamData();
  console.log(`[GPSJam] Broadcasting ${cells.length} jamming cells`);

  const redis = getRedis();
  try {
    if (redis.status === 'ready') {
      await redis.set('gpsjamming:latest', JSON.stringify(cells), 'EX', 6 * 3600);
    }
  } catch { /* Redis not available */ }

  wsHub.broadcast('gpsjamming', cells);
}

export function startGpsJamWorker() {
  console.log('[GPSJam] Worker started');
  // Broadcast immediately
  broadcastJammingData();
  // Re-fetch every 6 hours
  setInterval(broadcastJammingData, FETCH_INTERVAL_MS);
}
