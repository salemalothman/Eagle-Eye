import { StateCreator } from 'zustand';
import type { FlightEntity, SatelliteEntity, VesselEntity, EarthquakeEntity } from '../../types/entities';
import type { LayerId } from '../../types/layers';

export interface EntitySlice {
  commercialFlights: Map<string, FlightEntity>;
  militaryFlights: Map<string, FlightEntity>;
  satellites: Map<number, SatelliteEntity>;
  vessels: Map<string, VesselEntity>;
  earthquakes: Map<string, EarthquakeEntity>;
  trailsEnabled: Partial<Record<LayerId, boolean>>;
  setCommercialFlights: (flights: FlightEntity[]) => void;
  setMilitaryFlights: (flights: FlightEntity[]) => void;
  setSatellites: (sats: SatelliteEntity[]) => void;
  setVessels: (vessels: VesselEntity[]) => void;
  setEarthquakes: (quakes: EarthquakeEntity[]) => void;
  toggleTrails: (id: LayerId) => void;
}

export const createEntitySlice: StateCreator<EntitySlice> = (set) => ({
  commercialFlights: new Map(),
  militaryFlights: new Map(),
  satellites: new Map(),
  vessels: new Map(),
  earthquakes: new Map(),
  trailsEnabled: {},
  setCommercialFlights: (flights) => {
    const map = new Map<string, FlightEntity>();
    flights.forEach((f) => map.set(f.id, f));
    set({ commercialFlights: map });
  },
  setMilitaryFlights: (flights) => {
    const map = new Map<string, FlightEntity>();
    flights.forEach((f) => map.set(f.id, f));
    set({ militaryFlights: map });
  },
  setSatellites: (sats) => {
    const map = new Map<number, SatelliteEntity>();
    sats.forEach((s) => map.set(s.noradId, s));
    set({ satellites: map });
  },
  setVessels: (vessels) => {
    const map = new Map<string, VesselEntity>();
    vessels.forEach((v) => map.set(v.id, v));
    set({ vessels: map });
  },
  setEarthquakes: (quakes) => {
    const map = new Map<string, EarthquakeEntity>();
    quakes.forEach((q) => map.set(q.id, q));
    set({ earthquakes: map });
  },
  toggleTrails: (id) =>
    set((s) => ({
      trailsEnabled: { ...s.trailsEnabled, [id]: !s.trailsEnabled[id] },
    })),
});
