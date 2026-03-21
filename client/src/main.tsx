import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './styles/globals.css';
import App from './App';

// Load config from server (API keys) or fall back to env vars
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const config = await res.json();
      if (config.googleMapsApiKey) (window as any).__GOOGLE_MAPS_API_KEY__ = config.googleMapsApiKey;
      if (config.cesiumIonToken) {
        (window as any).__CESIUM_ION_TOKEN__ = config.cesiumIonToken;
        Cesium.Ion.defaultAccessToken = config.cesiumIonToken;
      }
      return;
    }
  } catch {
    // Server not available - use Vite env vars
  }

  // Fallback: Vite injects VITE_ prefixed env vars at build time
  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (googleKey) (window as any).__GOOGLE_MAPS_API_KEY__ = googleKey;

  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
  if (ionToken) {
    (window as any).__CESIUM_ION_TOKEN__ = ionToken;
    Cesium.Ion.defaultAccessToken = ionToken;
  }
}

loadConfig().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
