import { Router } from 'express';
import { wsHub } from '../websocket/wsHub.js';
import { getRedis } from '../services/redis.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    wsClients: wsHub.getClientCount(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/config', (_req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    cesiumIonToken: process.env.CESIUM_ION_TOKEN || '',
  });
});

// Serve cached flight data for initial load (so client doesn't wait for first WS push)
router.get('/flights/commercial', async (_req, res) => {
  try {
    const redis = getRedis();
    if (redis.status === 'ready') {
      const cached = await redis.get('flights:commercial:latest');
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    }
  } catch {
    // Redis not available
  }
  res.json([]);
});

// Serve cached satellite TLE data for initial load
router.get('/satellites/tle', async (_req, res) => {
  try {
    const redis = getRedis();
    if (redis.status === 'ready') {
      const cached = await redis.get('satellites:tle:latest');
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    }
  } catch {
    // Redis not available
  }
  res.json([]);
});

export default router;
