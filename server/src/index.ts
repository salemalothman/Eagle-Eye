import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config.js';
import { wsHub } from './websocket/wsHub.js';
import { connectRedis } from './services/redis.js';
import { connectDb } from './services/db.js';
import { startOpenSkyWorker } from './ingestion/opensky.worker.js';
import { startCelestrakWorker } from './ingestion/celestrak.worker.js';
import { startAdsbxWorker } from './ingestion/adsbexchange.worker.js';
import { startUsgsWorker } from './ingestion/usgs.worker.js';
import { startAisStreamWorker } from './ingestion/aisstream.worker.js';
import { startGpsJamWorker } from './ingestion/gpsjam.worker.js';
import { startIodaWorker } from './ingestion/ioda.worker.js';
import routes from './api/routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

const server = createServer(app);

// Initialize WebSocket hub
wsHub.init(server);

async function start() {
  // Connect to services (non-blocking - app works without them)
  await Promise.allSettled([connectRedis(), connectDb()]);

  // Start data ingestion workers
  startOpenSkyWorker();
  startCelestrakWorker();
  startAdsbxWorker();
  startUsgsWorker();
  startAisStreamWorker();
  startGpsJamWorker();
  startIodaWorker();

  server.listen(config.port, () => {
    console.log(`[Eagle Eye] Server running on port ${config.port}`);
    console.log(`[Eagle Eye] WebSocket endpoint: ws://localhost:${config.port}/ws`);
  });
}

start().catch(console.error);
