import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';

interface Props {
  viewer: Cesium.Viewer;
}

// Seed data for internet outage regions
interface OutageRegion {
  id: string;
  name: string;
  label: string;
  severity: number; // 0-1
  center: { lat: number; lon: number };
  // Simplified polygon boundary (real data would use Natural Earth GeoJSON)
  boundary: Array<{ lat: number; lon: number }>;
}

const SEED_OUTAGES: OutageRegion[] = [
  {
    id: 'iran_tehran',
    name: 'Iran',
    label: 'TEHRAN INTERNET BLACKOUT',
    severity: 0.9,
    center: { lat: 35.7, lon: 51.4 },
    boundary: [
      { lat: 39.8, lon: 44.0 },
      { lat: 39.8, lon: 53.0 },
      { lat: 37.5, lon: 57.0 },
      { lat: 33.0, lon: 60.0 },
      { lat: 25.5, lon: 57.5 },
      { lat: 25.0, lon: 55.0 },
      { lat: 27.0, lon: 52.0 },
      { lat: 30.0, lon: 48.5 },
      { lat: 31.5, lon: 46.0 },
      { lat: 35.0, lon: 44.0 },
    ],
  },
  {
    id: 'syria',
    name: 'Syria',
    label: 'SYRIA CONNECTIVITY DISRUPTED',
    severity: 0.7,
    center: { lat: 35.0, lon: 38.0 },
    boundary: [
      { lat: 37.3, lon: 36.8 },
      { lat: 37.0, lon: 42.0 },
      { lat: 35.0, lon: 42.0 },
      { lat: 33.0, lon: 36.0 },
      { lat: 34.5, lon: 35.8 },
      { lat: 36.8, lon: 36.2 },
    ],
  },
];

export function InternetOutageLayer({ viewer }: Props) {
  const entitiesRef = useRef<Cesium.Entity[]>([]);

  const visible = useStore((s) => s.layers.internetOutages.visible);
  const setEntityCount = useStore((s) => s.setEntityCount);

  useEffect(() => {
    for (const entity of entitiesRef.current) {
      viewer.entities.remove(entity);
    }
    entitiesRef.current = [];

    if (!visible) return;

    setEntityCount('internetOutages', SEED_OUTAGES.length);

    for (const outage of SEED_OUTAGES) {
      // Country polygon shaded by severity
      const alpha = 0.15 + outage.severity * 0.25;
      const polygonEntity = viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(
            outage.boundary.map((p) => Cesium.Cartesian3.fromDegrees(p.lon, p.lat))
          ),
          material: Cesium.Color.fromCssColorString('#8b00ff').withAlpha(alpha),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#ff3d3d').withAlpha(0.6),
          outlineWidth: 2,
          height: 0,
        },
      });
      entitiesRef.current.push(polygonEntity);

      // Floating label
      const labelEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(outage.center.lon, outage.center.lat, 50_000),
        label: {
          text: outage.label,
          font: 'bold 14px JetBrains Mono',
          fillColor: Cesium.Color.fromCssColorString('#ff3d3d'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          translucencyByDistance: new Cesium.NearFarScalar(5e5, 1.0, 1e7, 0.3),
          scaleByDistance: new Cesium.NearFarScalar(5e5, 1.0, 1e7, 0.4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      entitiesRef.current.push(labelEntity);
    }
  }, [viewer, visible, setEntityCount]);

  return null;
}
