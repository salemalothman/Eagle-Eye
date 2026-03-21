import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';
import type { GpsJammingCell } from '../../types/entities';

interface Props {
  viewer: Cesium.Viewer;
}

// Seed data for GPS jamming zones (known conflict areas)
const SEED_JAMMING_DATA: GpsJammingCell[] = [
  // Eastern Mediterranean / Syria / Iraq
  { h3Index: 'h3_aleppo_1', lat: 36.2, lon: 37.15, intensity: 0.9 },
  { h3Index: 'h3_aleppo_2', lat: 36.15, lon: 37.3, intensity: 0.85 },
  { h3Index: 'h3_aleppo_3', lat: 36.25, lon: 37.0, intensity: 0.7 },
  { h3Index: 'h3_damascus_1', lat: 33.5, lon: 36.3, intensity: 0.8 },
  { h3Index: 'h3_damascus_2', lat: 33.55, lon: 36.45, intensity: 0.6 },
  { h3Index: 'h3_baghdad_1', lat: 33.3, lon: 44.4, intensity: 0.5 },
  { h3Index: 'h3_baghdad_2', lat: 33.35, lon: 44.55, intensity: 0.4 },
  // Eastern Ukraine
  { h3Index: 'h3_donbas_1', lat: 48.0, lon: 38.0, intensity: 0.95 },
  { h3Index: 'h3_donbas_2', lat: 48.1, lon: 37.8, intensity: 0.85 },
  { h3Index: 'h3_donbas_3', lat: 47.9, lon: 38.2, intensity: 0.7 },
  { h3Index: 'h3_crimea_1', lat: 45.3, lon: 34.0, intensity: 0.8 },
  { h3Index: 'h3_crimea_2', lat: 45.2, lon: 33.8, intensity: 0.6 },
  // Baltic region
  { h3Index: 'h3_kaliningrad_1', lat: 54.7, lon: 20.5, intensity: 0.7 },
  { h3Index: 'h3_kaliningrad_2', lat: 54.75, lon: 20.3, intensity: 0.5 },
  // Iran borders
  { h3Index: 'h3_tehran_1', lat: 35.7, lon: 51.4, intensity: 0.6 },
  { h3Index: 'h3_iran_gulf_1', lat: 27.0, lon: 56.0, intensity: 0.5 },
  { h3Index: 'h3_iran_gulf_2', lat: 26.8, lon: 56.3, intensity: 0.4 },
];

export function GpsJammingLayer({ viewer }: Props) {
  const entitiesRef = useRef<Cesium.Entity[]>([]);
  const [cells] = useState<GpsJammingCell[]>(SEED_JAMMING_DATA);

  const visible = useStore((s) => s.layers.gpsJamming.visible);
  const setEntityCount = useStore((s) => s.setEntityCount);

  useEffect(() => {
    // Clean up old
    for (const entity of entitiesRef.current) {
      viewer.entities.remove(entity);
    }
    entitiesRef.current = [];

    if (!visible) return;

    setEntityCount('gpsJamming', cells.length);

    for (const cell of cells) {
      // Create hexagonal polygon
      const hexPositions = generateHexVertices(cell.lat, cell.lon, 0.15); // ~15km radius
      const extrudedHeight = cell.intensity * 200_000; // Max 200km extrusion

      const entity = viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(
            hexPositions.map((p) => Cesium.Cartesian3.fromDegrees(p.lon, p.lat))
          ),
          extrudedHeight,
          height: 0,
          material: Cesium.Color.RED.withAlpha(0.35 + cell.intensity * 0.35),
          outline: true,
          outlineColor: Cesium.Color.RED.withAlpha(0.8),
          outlineWidth: 1,
        },
      });

      entitiesRef.current.push(entity);
    }
  }, [viewer, cells, visible, setEntityCount]);

  return null;
}

// Generate hex vertices around a center point
function generateHexVertices(
  centerLat: number,
  centerLon: number,
  radiusDeg: number
): Array<{ lat: number; lon: number }> {
  const vertices: Array<{ lat: number; lon: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6; // 30deg offset for flat-top hex
    vertices.push({
      lat: centerLat + radiusDeg * Math.sin(angle),
      lon: centerLon + radiusDeg * Math.cos(angle) / Math.cos((centerLat * Math.PI) / 180),
    });
  }
  return vertices;
}
