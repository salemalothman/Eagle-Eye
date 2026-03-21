import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.SERVER_PORT || '3001', 10),
  database: process.env.DATABASE_URL || 'postgresql://eagle:eagle@localhost:5432/eagleeye',
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
  opensky: {
    // OAuth2 client credentials (new v2 API)
    clientId: process.env.OPENSKY_CLIENT_ID || '',
    clientSecret: process.env.OPENSKY_CLIENT_SECRET || '',
    // Legacy basic-auth fallback
    username: process.env.OPENSKY_USERNAME || '',
    password: process.env.OPENSKY_PASSWORD || '',
    pollInterval: 10_000,
  },
  adsbx: {
    apiKey: process.env.ADSBX_API_KEY || '',
    pollInterval: 15_000,
  },
  aisstream: {
    apiKey: process.env.AISSTREAM_API_KEY || '',
  },
  google: {
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },
  cesium: {
    ionToken: process.env.CESIUM_ION_TOKEN || '',
  },
};
