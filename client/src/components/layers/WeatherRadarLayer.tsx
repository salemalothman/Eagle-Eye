import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';

interface Props {
  viewer: Cesium.Viewer;
}

interface WeatherCell {
  id: string;
  name: string;
  label: string;
  centerLat: number;
  centerLon: number;
  radius: number; // degrees
  color: Cesium.Color;
  points: number; // vertices in polygon
}

const WEATHER_CELLS: WeatherCell[] = [
  {
    id: 'storm_gulf',
    name: 'Gulf Storm Cell',
    label: 'STORM CELL',
    centerLat: 26.5,
    centerLon: -90.0,
    radius: 3.0,
    color: Cesium.Color.fromCssColorString('#4caf50').withAlpha(0.25),
    points: 10,
  },
  {
    id: 'front_east',
    name: 'East Coast Front',
    label: 'FRONT',
    centerLat: 37.0,
    centerLon: -76.0,
    radius: 2.5,
    color: Cesium.Color.fromCssColorString('#ffeb3b').withAlpha(0.2),
    points: 12,
  },
  {
    id: 'storm_pacific',
    name: 'Pacific Storm',
    label: 'STORM CELL',
    centerLat: 35.0,
    centerLon: -135.0,
    radius: 4.0,
    color: Cesium.Color.fromCssColorString('#2196f3').withAlpha(0.2),
    points: 10,
  },
  {
    id: 'front_atlantic',
    name: 'North Atlantic Low',
    label: 'FRONT',
    centerLat: 48.0,
    centerLon: -30.0,
    radius: 3.5,
    color: Cesium.Color.fromCssColorString('#2196f3').withAlpha(0.15),
    points: 8,
  },
];

function generatePolygonPositions(
  centerLat: number,
  centerLon: number,
  radius: number,
  pointCount: number
): Cesium.Cartesian3[] {
  const positions: number[] = [];
  for (let i = 0; i < pointCount; i++) {
    const angle = (2 * Math.PI * i) / pointCount;
    // Add slight jitter for organic shape
    const jitter = 0.7 + Math.random() * 0.6;
    const lat = centerLat + radius * jitter * Math.sin(angle);
    const lon = centerLon + radius * jitter * Math.cos(angle);
    positions.push(lon, lat);
  }
  return Cesium.Cartesian3.fromDegreesArray(positions);
}

export function WeatherRadarLayer({ viewer }: Props) {
  const entitiesRef = useRef<Cesium.Entity[]>([]);

  const visible = useStore((s) => s.layers.weatherRadar.visible);
  const setEntityCount = useStore((s) => s.setEntityCount);

  useEffect(() => {
    // Clean up existing entities
    for (const entity of entitiesRef.current) {
      viewer.entities.remove(entity);
    }
    entitiesRef.current = [];

    if (!visible) {
      setEntityCount('weatherRadar', 0);
      return;
    }

    for (const cell of WEATHER_CELLS) {
      const polygonPositions = generatePolygonPositions(
        cell.centerLat,
        cell.centerLon,
        cell.radius,
        cell.points
      );

      // Polygon entity
      const polygonEntity = viewer.entities.add({
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(polygonPositions),
          material: cell.color,
          outline: true,
          outlineColor: cell.color.withAlpha(0.6),
          outlineWidth: 1,
          height: 0,
        },
      });
      entitiesRef.current.push(polygonEntity);

      // Label entity at center
      const labelEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(cell.centerLon, cell.centerLat, 0),
        label: {
          text: `${cell.label}\n${cell.name}`,
          font: '11px JetBrains Mono',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          translucencyByDistance: new Cesium.NearFarScalar(1e5, 1.0, 2e7, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      entitiesRef.current.push(labelEntity);
    }

    setEntityCount('weatherRadar', WEATHER_CELLS.length);
  }, [viewer, visible, setEntityCount]);

  return null;
}
