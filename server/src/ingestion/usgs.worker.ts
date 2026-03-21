import axios from 'axios';
import { wsHub } from '../websocket/wsHub.js';
import { getRedis } from '../services/redis.js';

interface EarthquakeData {
  id: string;
  magnitude: number;
  place: string;
  lat: number;
  lon: number;
  depth: number;
  timestamp: number;
}

let isPolling = false;

async function fetchEarthquakes(): Promise<EarthquakeData[]> {
  try {
    const response = await axios.get(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
      { timeout: 15_000 }
    );

    if (!response.data?.features) return [];

    return response.data.features.map((f: any) => ({
      id: f.id,
      magnitude: f.properties.mag || 0,
      place: f.properties.place || '',
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      depth: f.geometry.coordinates[2] || 0,
      timestamp: f.properties.time,
    }));
  } catch (err: any) {
    console.warn('[USGS] Fetch error:', err.message);
    return [];
  }
}

async function poll() {
  if (isPolling) return;
  isPolling = true;

  try {
    const quakes = await fetchEarthquakes();

    if (quakes.length > 0) {
      try {
        const redis = getRedis();
        if (redis.status === 'ready') {
          await redis.set('earthquakes:latest', JSON.stringify(quakes), 'EX', 120);
        }
      } catch {}

      wsHub.broadcast('earthquakes', quakes);
      console.log(`[USGS] Broadcast ${quakes.length} earthquakes`);
    }
  } finally {
    isPolling = false;
  }
}

export function startUsgsWorker() {
  const POLL_INTERVAL = 60_000; // 60 seconds
  console.log('[USGS] Starting worker, polling every 60s');
  poll();
  setInterval(poll, POLL_INTERVAL);
}
