import { StateCreator } from 'zustand';
import type { LayerId, LayerConfig } from '../../types/layers';

const defaultLayers: Record<LayerId, LayerConfig> = {
  commercialFlights: { id: 'commercialFlights', label: 'Live Flights', visible: true, opacity: 1, entityCount: 0, color: '#00e5ff', icon: '✈' },
  militaryFlights: { id: 'militaryFlights', label: 'Military Flights', visible: false, opacity: 1, entityCount: 0, color: '#ffb300', icon: '◆' },
  satellites: { id: 'satellites', label: 'Satellites', visible: false, opacity: 1, entityCount: 0, color: '#00e5ff', icon: '◇' },
  earthquakes: { id: 'earthquakes', label: 'Earthquakes (24h)', visible: false, opacity: 1, entityCount: 0, color: '#ff3d3d', icon: '⊙' },
  maritime: { id: 'maritime', label: 'Maritime Traffic', visible: false, opacity: 1, entityCount: 0, color: '#4fc3f7', icon: '⛴' },
  gpsJamming: { id: 'gpsJamming', label: 'GPS Jamming', visible: false, opacity: 1, entityCount: 0, color: '#ff3d3d', icon: '⬡' },
  internetOutages: { id: 'internetOutages', label: 'Internet Outages', visible: false, opacity: 1, entityCount: 0, color: '#ce93d8', icon: '⊘' },
  airspaceClosures: { id: 'airspaceClosures', label: 'Airspace Closures', visible: false, opacity: 1, entityCount: 0, color: '#f48fb1', icon: '⊗' },
  cctvMesh: { id: 'cctvMesh', label: 'CCTV Mesh', visible: false, opacity: 1, entityCount: 0, color: '#80cbc4', icon: '📷' },
  events: { id: 'events', label: 'Events', visible: false, opacity: 1, entityCount: 0, color: '#00e5ff', icon: '⚑' },
};

export interface LayerSlice {
  layers: Record<LayerId, LayerConfig>;
  toggleLayer: (id: LayerId) => void;
  setLayerOpacity: (id: LayerId, opacity: number) => void;
  setEntityCount: (id: LayerId, count: number) => void;
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
});
