/**
 * IODA (Internet Outage Detection and Analysis) ingestion worker
 * Fetches internet outage data from CAIDA's IODA API.
 * Falls back to curated seed data when unavailable.
 */
import axios from 'axios';
import { wsHub } from '../websocket/wsHub.js';
import { getRedis } from '../services/redis.js';

interface OutageRegion {
  id: string;
  name: string;
  label: string;
  severity: number; // 0-1
  center: { lat: number; lon: number };
  boundary: Array<{ lat: number; lon: number }>;
}

// Curated seed outage regions — notable historical internet disruptions
const SEED_OUTAGES: OutageRegion[] = [
  {
    id: 'iran_tehran',
    name: 'Iran',
    label: 'TEHRAN INTERNET BLACKOUT',
    severity: 0.9,
    center: { lat: 35.7, lon: 51.4 },
    boundary: [
      { lat: 39.8, lon: 44.0 }, { lat: 39.8, lon: 53.0 },
      { lat: 37.5, lon: 57.0 }, { lat: 35.0, lon: 61.0 },
      { lat: 25.0, lon: 61.0 }, { lat: 25.0, lon: 44.0 },
    ],
  },
  {
    id: 'iraq_outage',
    name: 'Iraq',
    label: 'IRAQ CONNECTIVITY DISRUPTED',
    severity: 0.6,
    center: { lat: 33.3, lon: 44.4 },
    boundary: [
      { lat: 37.5, lon: 38.8 }, { lat: 37.5, lon: 48.6 },
      { lat: 33.0, lon: 48.6 }, { lat: 29.5, lon: 47.4 },
      { lat: 29.5, lon: 38.8 },
    ],
  },
  {
    id: 'myanmar_blackout',
    name: 'Myanmar',
    label: 'MYANMAR INTERNET BLACKOUT',
    severity: 0.75,
    center: { lat: 17.0, lon: 96.0 },
    boundary: [
      { lat: 28.5, lon: 92.0 }, { lat: 28.5, lon: 101.2 },
      { lat: 20.0, lon: 101.2 }, { lat: 10.0, lon: 98.6 },
      { lat: 10.0, lon: 92.0 },
    ],
  },
  {
    id: 'russia_throttling',
    name: 'Russia',
    label: 'RUSSIA NETWORK THROTTLING',
    severity: 0.4,
    center: { lat: 55.75, lon: 37.6 },
    boundary: [
      { lat: 71.5, lon: 30.0 }, { lat: 71.5, lon: 180.0 },
      { lat: 41.0, lon: 180.0 }, { lat: 41.0, lon: 30.0 },
    ],
  },
];

let lastFetchTime = 0;
const FETCH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function fetchIodaData(): Promise<OutageRegion[]> {
  try {
    // IODA API: fetch current alerts for countries
    const from = Math.floor(Date.now() / 1000) - 86400; // last 24h
    const until = Math.floor(Date.now() / 1000);

    const res = await axios.get(
      `https://api.ioda.caida.org/v2/alerts?from=${from}&until=${until}&limit=50&meta=1`,
      { timeout: 15_000 }
    );

    if (!res.data?.data || !Array.isArray(res.data.data)) return SEED_OUTAGES;

    // Parse IODA alerts and convert to outage regions
    const alerts = res.data.data;
    const regionMap = new Map<string, OutageRegion>();

    for (const alert of alerts) {
      if (!alert.entity?.attrs?.country) continue;
      const country = alert.entity.attrs.country;
      const severity = Math.min(1, (alert.level || 1) / 3);

      if (severity < 0.2) continue; // Skip minor blips

      const countryId = `ioda_${country.toLowerCase().replace(/\s+/g, '_')}`;

      if (!regionMap.has(countryId)) {
        // Use IODA-provided coordinates if available, else fallback
        const lat = alert.entity.attrs.lat || 0;
        const lon = alert.entity.attrs.lon || 0;

        regionMap.set(countryId, {
          id: countryId,
          name: country,
          label: `${country.toUpperCase()} INTERNET DISRUPTION`,
          severity,
          center: { lat, lon },
          // Simplified bounding box (real impl would use country polygons)
          boundary: [
            { lat: lat + 5, lon: lon - 5 },
            { lat: lat + 5, lon: lon + 5 },
            { lat: lat - 5, lon: lon + 5 },
            { lat: lat - 5, lon: lon - 5 },
          ],
        });
      }
    }

    const liveRegions = Array.from(regionMap.values());

    // Merge with seed data for regions not covered by live API
    const seedNotDuplicated = SEED_OUTAGES.filter(
      (seed) => !liveRegions.some((live) => live.id.includes(seed.name.toLowerCase()))
    );

    return [...liveRegions, ...seedNotDuplicated].slice(0, 20);
  } catch {
    // IODA API unavailable — use seed data
    return SEED_OUTAGES;
  }
}

async function broadcastOutageData() {
  const now = Date.now();
  if (now - lastFetchTime < FETCH_INTERVAL_MS) return;
  lastFetchTime = now;

  const regions = await fetchIodaData();
  console.log(`[IODA] Broadcasting ${regions.length} outage regions`);

  const redis = getRedis();
  try {
    if (redis.status === 'ready') {
      await redis.set('outages:latest', JSON.stringify(regions), 'EX', 3600);
    }
  } catch { /* Redis not available */ }

  wsHub.broadcast('outages', regions);
}

export function startIodaWorker() {
  console.log('[IODA] Worker started');
  broadcastOutageData();
  setInterval(broadcastOutageData, FETCH_INTERVAL_MS);
}
