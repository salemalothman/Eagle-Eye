export interface FlightEntity {
  id: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  velocity: number;
  verticalRate: number;
  onGround: boolean;
  country: string;
  squawk: string;
  timestamp: number;
  isMilitary: boolean;
  trail: Array<{ lat: number; lon: number; alt: number }>;
}

export interface SatelliteEntity {
  noradId: number;
  name: string;
  lat: number;
  lon: number;
  altitude: number;
  category: 'military' | 'imaging' | 'comms' | 'weather' | 'navigation' | 'science' | 'other';
  country: string;
  tleLine1: string;
  tleLine2: string;
}

export interface VesselEntity {
  id: string;
  mmsi: number;
  name: string;
  vesselType: number;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading: number;
  navStatus: number;
  destination: string;
}

export interface EarthquakeEntity {
  id: string;
  magnitude: number;
  place: string;
  lat: number;
  lon: number;
  depth: number;
  timestamp: number;
}

export interface GpsJammingCell {
  h3Index: string;
  lat: number;
  lon: number;
  intensity: number;
}

export interface EventCard {
  id: string;
  type: 'VERIFIED' | 'REPORTED' | 'INFRASTRUCTURE' | 'RETALIATION';
  title: string;
  description: string;
  timestamp: string;
  lat: number;
  lon: number;
  altitude?: number;
  imageUrl?: string;
  category: 'strike' | 'airspace' | 'internet' | 'maritime' | 'retaliation';
}
