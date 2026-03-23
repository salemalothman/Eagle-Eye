import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';

interface Props {
  viewer: Cesium.Viewer;
}

interface BikeshareStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  bikes: number;
}

// Seed stations: Austin BCycle + London Santander
const SEED_STATIONS: BikeshareStation[] = [
  // Austin BCycle - 6 stations around downtown Austin
  { id: 'atx_01', name: 'Congress & 6th', lat: 30.2672, lon: -97.7431, bikes: Math.floor(Math.random() * 21) },
  { id: 'atx_02', name: 'Rainey St', lat: 30.2585, lon: -97.7394, bikes: Math.floor(Math.random() * 21) },
  { id: 'atx_03', name: 'UT West Mall', lat: 30.2849, lon: -97.7394, bikes: Math.floor(Math.random() * 21) },
  { id: 'atx_04', name: 'Zilker Park', lat: 30.2669, lon: -97.7729, bikes: Math.floor(Math.random() * 21) },
  { id: 'atx_05', name: 'East 6th & Comal', lat: 30.2656, lon: -97.7268, bikes: Math.floor(Math.random() * 21) },
  { id: 'atx_06', name: 'S Lamar & Barton Springs', lat: 30.2605, lon: -97.7553, bikes: Math.floor(Math.random() * 21) },
  // London Santander - 4 stations around central London
  { id: 'lon_01', name: 'Hyde Park Corner', lat: 51.5027, lon: -0.1527, bikes: Math.floor(Math.random() * 21) },
  { id: 'lon_02', name: 'Waterloo Station', lat: 51.5036, lon: -0.1143, bikes: Math.floor(Math.random() * 21) },
  { id: 'lon_03', name: 'Kings Cross', lat: 51.5347, lon: -0.1246, bikes: Math.floor(Math.random() * 21) },
  { id: 'lon_04', name: 'Tower Bridge Rd', lat: 51.5055, lon: -0.0764, bikes: Math.floor(Math.random() * 21) },
];

export function BikeshareLayer({ viewer }: Props) {
  const entitiesRef = useRef<Cesium.Entity[]>([]);

  const visible = useStore((s) => s.layers.bikeshare.visible);
  const setEntityCount = useStore((s) => s.setEntityCount);

  useEffect(() => {
    // Clean up existing entities
    for (const entity of entitiesRef.current) {
      viewer.entities.remove(entity);
    }
    entitiesRef.current = [];

    if (!visible) {
      setEntityCount('bikeshare', 0);
      return;
    }

    const icon = createBikeStationIcon();

    for (const station of SEED_STATIONS) {
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(station.lon, station.lat, 10),
        billboard: {
          image: icon,
          scale: 0.6,
          translucencyByDistance: new Cesium.NearFarScalar(1e2, 1.0, 5e6, 0.0),
          scaleByDistance: new Cesium.NearFarScalar(1e2, 1.0, 1e6, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${station.name}\n${station.bikes} bikes`,
          font: '9px JetBrains Mono',
          fillColor: Cesium.Color.fromCssColorString('#ab47bc'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          translucencyByDistance: new Cesium.NearFarScalar(1e2, 1.0, 3e5, 0.0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      (entity as any)._stationId = station.id;
      entitiesRef.current.push(entity);
    }

    setEntityCount('bikeshare', SEED_STATIONS.length);
  }, [viewer, visible, setEntityCount]);

  return null;
}

let cachedBikeIcon: string | null = null;
function createBikeStationIcon(): string {
  if (cachedBikeIcon) return cachedBikeIcon;

  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  // Outer circle (purple)
  ctx.fillStyle = '#ab47bc';
  ctx.beginPath();
  ctx.arc(12, 12, 11, 0, Math.PI * 2);
  ctx.fill();

  // Inner circle (dark background)
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(12, 12, 8, 0, Math.PI * 2);
  ctx.fill();

  // Simple bike shape: two wheels + frame
  ctx.strokeStyle = '#ab47bc';
  ctx.lineWidth = 1.5;

  // Left wheel
  ctx.beginPath();
  ctx.arc(7, 14, 3, 0, Math.PI * 2);
  ctx.stroke();

  // Right wheel
  ctx.beginPath();
  ctx.arc(17, 14, 3, 0, Math.PI * 2);
  ctx.stroke();

  // Frame: triangle-ish shape
  ctx.beginPath();
  ctx.moveTo(7, 14);  // left hub
  ctx.lineTo(12, 8);  // top
  ctx.lineTo(17, 14); // right hub
  ctx.moveTo(12, 8);  // top
  ctx.lineTo(10, 14); // down to bottom bar
  ctx.stroke();

  // Handlebars
  ctx.beginPath();
  ctx.moveTo(15, 8);
  ctx.lineTo(17, 10);
  ctx.stroke();

  // Seat
  ctx.fillStyle = '#ab47bc';
  ctx.fillRect(10, 7, 4, 1.5);

  cachedBikeIcon = canvas.toDataURL();
  return cachedBikeIcon;
}
