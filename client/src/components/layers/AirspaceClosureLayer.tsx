import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';

interface Props {
  viewer: Cesium.Viewer;
}

interface AirspaceClosure {
  id: string;
  name: string;
  label: string;
  center: { lat: number; lon: number };
  boundary: Array<{ lat: number; lon: number }>;
}

const SEED_CLOSURES: AirspaceClosure[] = [
  {
    id: 'iraq_closure',
    name: 'Iraq',
    label: 'IRAQ AIRSPACE CLOSED',
    center: { lat: 33.0, lon: 44.0 },
    boundary: [
      { lat: 37.3, lon: 42.5 },
      { lat: 37.0, lon: 45.5 },
      { lat: 35.0, lon: 46.0 },
      { lat: 33.5, lon: 46.5 },
      { lat: 30.0, lon: 47.5 },
      { lat: 29.5, lon: 47.8 },
      { lat: 29.1, lon: 44.0 },
      { lat: 32.0, lon: 39.0 },
      { lat: 33.5, lon: 38.8 },
      { lat: 36.5, lon: 41.0 },
    ],
  },
  {
    id: 'lebanon_closure',
    name: 'Lebanon',
    label: 'LEBANON NOTAM ACTIVE',
    center: { lat: 33.9, lon: 35.8 },
    boundary: [
      { lat: 34.7, lon: 35.9 },
      { lat: 34.5, lon: 36.6 },
      { lat: 33.2, lon: 36.3 },
      { lat: 33.0, lon: 35.1 },
      { lat: 34.0, lon: 35.1 },
    ],
  },
];

export function AirspaceClosureLayer({ viewer }: Props) {
  const entitiesRef = useRef<Cesium.Entity[]>([]);

  const visible = useStore((s) => s.layers.airspaceClosures.visible);
  const setEntityCount = useStore((s) => s.setEntityCount);

  useEffect(() => {
    for (const entity of entitiesRef.current) {
      viewer.entities.remove(entity);
    }
    entitiesRef.current = [];

    if (!visible) return;

    setEntityCount('airspaceClosures', SEED_CLOSURES.length);

    for (const closure of SEED_CLOSURES) {
      // Semi-transparent pink/red overlay
      const polygonEntity = viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(
            closure.boundary.map((p) => Cesium.Cartesian3.fromDegrees(p.lon, p.lat))
          ),
          material: Cesium.Color.fromCssColorString('#ff3d3d').withAlpha(0.12),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#ff6b6b').withAlpha(0.5),
          outlineWidth: 2,
          height: 0,
        },
      });
      entitiesRef.current.push(polygonEntity);

      // "CLOSED" label
      const labelEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(closure.center.lon, closure.center.lat, 30_000),
        label: {
          text: closure.label,
          font: 'bold 13px JetBrains Mono',
          fillColor: Cesium.Color.fromCssColorString('#ff6b6b'),
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
