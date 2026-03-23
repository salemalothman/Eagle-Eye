import { StateCreator } from 'zustand';
import type { LayerId, LayerConfig } from '../../types/layers';

const defaultLayers: Record<LayerId, LayerConfig> = {
  commercialFlights: { id: 'commercialFlights', label: 'Live Flights', visible: true, opacity: 1, entityCount: 0, color: '#00e5ff', icon: '✈️', source: 'OpenSky Network', lastUpdate: null },
  militaryFlights: { id: 'militaryFlights', label: 'Military Flights', visible: false, opacity: 1, entityCount: 0, color: '#ffb300', icon: '🎖', source: 'adsb.lol', lastUpdate: null },
  earthquakes: { id: 'earthquakes', label: 'Earthquakes (24h)', visible: false, opacity: 1, entityCount: 0, color: '#ff3d3d', icon: '🌋', source: 'USGS', lastUpdate: null },
  satellites: { id: 'satellites', label: 'Satellites', visible: false, opacity: 1, entityCount: 0, color: '#00e5ff', icon: '🛰', source: 'CelesTrak', lastUpdate: null },
  streetTraffic: { id: 'streetTraffic', label: 'Street Traffic', visible: false, opacity: 1, entityCount: 0, color: '#ff6b6b', icon: '🚗', source: 'OpenStreetMap', lastUpdate: null },
  weatherRadar: { id: 'weatherRadar', label: 'Weather Radar', visible: false, opacity: 1, entityCount: 0, color: '#81c784', icon: '☁️', source: 'NOAA NEXRAD (globe overlay)', lastUpdate: null },
  cctvMesh: { id: 'cctvMesh', label: 'CCTV Mesh', visible: false, opacity: 1, entityCount: 0, color: '#80cbc4', icon: '📹', source: 'CCTV Mesh + Street View fallback', lastUpdate: null },
  bikeshare: { id: 'bikeshare', label: 'Bikeshare', visible: false, opacity: 1, entityCount: 0, color: '#ab47bc', icon: '🚲', source: 'GBFS', lastUpdate: null },
  maritime: { id: 'maritime', label: 'Maritime Traffic', visible: false, opacity: 1, entityCount: 0, color: '#4fc3f7', icon: '⛴', source: 'AISStream', lastUpdate: null },
  gpsJamming: { id: 'gpsJamming', label: 'GPS Jamming', visible: false, opacity: 1, entityCount: 0, color: '#ff3d3d', icon: '⬡', source: 'GPSJam', lastUpdate: null },
  internetOutages: { id: 'internetOutages', label: 'Internet Outages', visible: false, opacity: 1, entityCount: 0, color: '#ce93d8', icon: '⊘', source: 'IODA/CAIDA', lastUpdate: null },
  airspaceClosures: { id: 'airspaceClosures', label: 'Airspace Closures', visible: false, opacity: 1, entityCount: 0, color: '#f48fb1', icon: '⊗', source: 'FAA NOTAM', lastUpdate: null },
  events: { id: 'events', label: 'Events', visible: false, opacity: 1, entityCount: 0, color: '#00e5ff', icon: '⚑', source: 'Intel Feed', lastUpdate: null },
};

export interface LayerSlice {
  layers: Record<LayerId, LayerConfig>;
  toggleLayer: (id: LayerId) => void;
  setLayerOpacity: (id: LayerId, opacity: number) => void;
  setEntityCount: (id: LayerId, count: number) => void;
  setLayerLastUpdate: (id: LayerId, timestamp: number) => void;
}

export const createLayerSlice: StateCreator<LayerSlice> = (set) => ({
  layers: defaultLayers,
  toggleLayer: (id) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [id]: { ...state.layers[id], visible: !state.layers[id].visible },
      },
    })),
  setLayerOpacity: (id, opacity) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [id]: { ...state.layers[id], opacity },
      },
    })),
  setEntityCount: (id, count) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [id]: { ...state.layers[id], entityCount: count },
      },
    })),
  setLayerLastUpdate: (id, timestamp) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [id]: { ...state.layers[id], lastUpdate: timestamp },
      },
    })),
});
