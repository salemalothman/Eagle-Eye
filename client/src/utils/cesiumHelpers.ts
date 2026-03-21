import * as Cesium from 'cesium';

export interface LocationPreset {
  name: string;
  lat: number;
  lon: number;
  altitude: number;
  pitch: number;
  label: string;
  category: 'landmark' | 'city';
}

export const LOCATION_PRESETS: LocationPreset[] = [
  // Landmarks
  { name: 'us-capitol', lat: 38.8899, lon: -77.0091, altitude: 2000, pitch: -45, label: 'US Capitol', category: 'landmark' },
  { name: 'washington-monument', lat: 38.8895, lon: -77.0353, altitude: 1500, pitch: -50, label: 'Washington Monument', category: 'landmark' },
  { name: 'lincoln-memorial', lat: 38.8893, lon: -77.0502, altitude: 1200, pitch: -50, label: 'Lincoln Memorial', category: 'landmark' },
  { name: 'pentagon', lat: 38.8720, lon: -77.0563, altitude: 3000, pitch: -45, label: 'Pentagon', category: 'landmark' },
  { name: 'jefferson-memorial', lat: 38.8814, lon: -77.0365, altitude: 1200, pitch: -50, label: 'Jefferson Memorial', category: 'landmark' },
  // Cities
  { name: 'austin', lat: 30.2672, lon: -97.7431, altitude: 5000, pitch: -45, label: 'Austin', category: 'city' },
  { name: 'san-francisco', lat: 37.7749, lon: -122.4194, altitude: 8000, pitch: -45, label: 'San Francisco', category: 'city' },
  { name: 'new-york', lat: 40.7128, lon: -74.0060, altitude: 8000, pitch: -45, label: 'New York', category: 'city' },
  { name: 'tokyo', lat: 35.6762, lon: 139.6503, altitude: 10000, pitch: -40, label: 'Tokyo', category: 'city' },
  { name: 'london', lat: 51.5074, lon: -0.1278, altitude: 8000, pitch: -45, label: 'London', category: 'city' },
  { name: 'paris', lat: 48.8566, lon: 2.3522, altitude: 8000, pitch: -45, label: 'Paris', category: 'city' },
  { name: 'dubai', lat: 25.2048, lon: 55.2708, altitude: 8000, pitch: -45, label: 'Dubai', category: 'city' },
  { name: 'washington-dc', lat: 38.9072, lon: -77.0369, altitude: 15000, pitch: -35, label: 'Washington DC', category: 'city' },
];

export function flyToPreset(viewer: Cesium.Viewer, preset: LocationPreset) {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(preset.lon, preset.lat, preset.altitude),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(preset.pitch),
      roll: 0,
    },
    duration: 2.0,
  });
}

export function flyToGlobeView(viewer: Cesium.Viewer) {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(40, 25, 20_000_000),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    duration: 2.0,
  });
}
