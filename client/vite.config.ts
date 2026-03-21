import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import { resolve } from 'path';
import { createReadStream, existsSync } from 'fs';
import { lookup } from 'mimetypes';

const cesiumBuildPath = resolve(__dirname, '../node_modules/cesium/Build/Cesium');

/**
 * Serve Cesium static assets from node_modules in dev mode.
 * vite-plugin-cesium handles the build-time copy, but dev-mode serving
 * falls through to Vite's SPA fallback (returning index.html for tile
 * requests). This plugin intercepts /cesium/* and serves the real files.
 */
function serveCesiumAssets(): Plugin {
  return {
    name: 'serve-cesium-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/cesium/')) return next();
        const filePath = resolve(cesiumBuildPath, req.url.slice('/cesium/'.length));
        if (!existsSync(filePath)) return next();
        const ext = filePath.split('.').pop() || '';
        const mimeTypes: Record<string, string> = {
          js: 'application/javascript',
          json: 'application/json',
          xml: 'application/xml',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          png: 'image/png',
          gif: 'image/gif',
          css: 'text/css',
          wasm: 'application/wasm',
          glsl: 'text/plain',
          woff: 'font/woff',
          woff2: 'font/woff2',
          ttf: 'font/ttf',
          svg: 'image/svg+xml',
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    serveCesiumAssets(),
    cesium({
      cesiumBaseUrl: 'cesium',
      cesiumBuildPath,
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      cesium: resolve(__dirname, '../node_modules/cesium'),
    },
  },
});
