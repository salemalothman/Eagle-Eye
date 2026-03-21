import axios from 'axios';
import { wsHub } from '../websocket/wsHub.js';
import { getRedis } from '../services/redis.js';

interface TleSatellite {
  noradId: number;
  name: string;
  tleLine1: string;
  tleLine2: string;
  category: 'military' | 'imaging' | 'comms' | 'weather' | 'navigation' | 'science' | 'other';
}

const TLE_SOURCES = [
  { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle', category: 'other' as const },
  { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle', category: 'other' as const },
];

// Well-known NORAD IDs for category tagging
const MILITARY_PREFIXES = ['USA ', 'NOSS ', 'SBIRS', 'DSP ', 'MILSTAR', 'AEHF', 'WGS', 'MUOS'];
const IMAGING_NAMES = ['WORLDVIEW', 'GEOEYE', 'PLEIADES', 'SPOT', 'SENTINEL', 'LANDSAT', 'PLANET'];
const COMMS_NAMES = ['STARLINK', 'IRIDIUM', 'GLOBALSTAR', 'INTELSAT', 'SES', 'EUTELSAT', 'ORBCOMM'];
const WEATHER_NAMES = ['NOAA', 'GOES', 'METEOSAT', 'HIMAWARI', 'METEOR-M', 'FENGYUN'];
const NAV_NAMES = ['NAVSTAR', 'GPS', 'GLONASS', 'GALILEO', 'BEIDOU'];

function classifySatellite(name: string): TleSatellite['category'] {
  const upper = name.toUpperCase();
  if (MILITARY_PREFIXES.some((p) => upper.includes(p))) return 'military';
  if (IMAGING_NAMES.some((p) => upper.includes(p))) return 'imaging';
  if (COMMS_NAMES.some((p) => upper.includes(p))) return 'comms';
  if (WEATHER_NAMES.some((p) => upper.includes(p))) return 'weather';
  if (NAV_NAMES.some((p) => upper.includes(p))) return 'navigation';
  return 'other';
}

function parseTleText(text: string, defaultCategory: TleSatellite['category']): TleSatellite[] {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  const satellites: TleSatellite[] = [];

  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];

    // Validate TLE format
    if (!line1?.startsWith('1 ') || !line2?.startsWith('2 ')) continue;

    const noradId = parseInt(line2.substring(2, 7).trim(), 10);
    if (isNaN(noradId)) continue;

    satellites.push({
      noradId,
      name: name.trim(),
      tleLine1: line1,
      tleLine2: line2,
      category: classifySatellite(name) !== 'other' ? classifySatellite(name) : defaultCategory,
    });
  }

  return satellites;
}

let isFetching = false;

async function fetchTles(): Promise<TleSatellite[]> {
  if (isFetching) return [];
  isFetching = true;

  try {
    const allSats = new Map<number, TleSatellite>();

    for (const source of TLE_SOURCES) {
      try {
        const response = await axios.get(source.url, { timeout: 30_000 });
        const sats = parseTleText(response.data, source.category);
        for (const sat of sats) {
          if (!allSats.has(sat.noradId)) {
            allSats.set(sat.noradId, sat);
          }
        }
        console.log(`[CelesTrak] Fetched ${sats.length} satellites from ${source.url.split('GROUP=')[1]?.split('&')[0]}`);
      } catch (err: any) {
        console.warn(`[CelesTrak] Failed to fetch ${source.url}:`, err.message);
      }
    }

    return Array.from(allSats.values());
  } finally {
    isFetching = false;
  }
}

async function poll() {
  const satellites = await fetchTles();

  if (satellites.length > 0) {
    // Cache in Redis
    try {
      const redis = getRedis();
      if (redis.status === 'ready') {
        await redis.set('satellites:tle:latest', JSON.stringify(satellites), 'EX', 7200); // 2hr cache
      }
    } catch {
      // Redis not available
    }

    // Broadcast TLE catalog to clients
    wsHub.broadcast('satellites:tle', satellites);
    console.log(`[CelesTrak] Broadcast ${satellites.length} satellite TLEs`);
  }
}

export function startCelestrakWorker() {
  const POLL_INTERVAL = 60 * 60 * 1000; // 1 hour
  console.log('[CelesTrak] Starting worker, polling every 60 min');
  poll();
  setInterval(poll, POLL_INTERVAL);
}
