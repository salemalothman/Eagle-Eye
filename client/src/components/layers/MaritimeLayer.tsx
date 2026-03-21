import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';
import type { VesselEntity } from '../../types/entities';

interface Props {
  viewer: Cesium.Viewer;
}

// Seed data for maritime vessels (Strait of Hormuz area)
const SEED_VESSELS: VesselEntity[] = [
  { id: 'v1', mmsi: 211234567, name: 'MSC AURORA', vesselType: 70, lat: 26.4, lon: 56.2, speed: 12.5, course: 305, heading: 302, navStatus: 0, destination: 'FUJAIRAH' },
  { id: 'v2', mmsi: 311876543, name: 'EVER GOLDEN', vesselType: 70, lat: 26.2, lon: 56.5, speed: 14.2, course: 125, heading: 128, navStatus: 0, destination: 'JEBEL ALI' },
  { id: 'v3', mmsi: 412345678, name: 'FRONT WARRIOR', vesselType: 80, lat: 26.6, lon: 56.0, speed: 11.0, course: 290, heading: 288, navStatus: 0, destination: 'RAS TANURA' },
  { id: 'v4', mmsi: 538234567, name: 'PACIFIC JEWEL', vesselType: 60, lat: 26.3, lon: 56.8, speed: 18.5, course: 310, heading: 312, navStatus: 0, destination: 'MUSCAT' },
  { id: 'v5', mmsi: 636012345, name: 'USS EISENHOWER', vesselType: 35, lat: 25.8, lon: 57.5, speed: 22.0, course: 270, heading: 268, navStatus: 0, destination: 'PATROL' },
  { id: 'v6', mmsi: 215678901, name: 'STENA BULK', vesselType: 80, lat: 26.1, lon: 56.3, speed: 10.8, course: 120, heading: 122, navStatus: 0, destination: 'BANDAR ABBAS' },
  { id: 'v7', mmsi: 477234567, name: 'COSCO STAR', vesselType: 70, lat: 26.5, lon: 55.8, speed: 15.3, course: 90, heading: 92, navStatus: 0, destination: 'MUMBAI' },
  { id: 'v8', mmsi: 352123456, name: 'HMS DEFENDER', vesselType: 35, lat: 26.0, lon: 57.0, speed: 20.5, course: 180, heading: 178, navStatus: 0, destination: 'PATROL' },
  // Suez Canal area
  { id: 'v9', mmsi: 229345678, name: 'MAERSK ELBA', vesselType: 70, lat: 30.0, lon: 32.6, speed: 8.0, course: 340, heading: 342, navStatus: 0, destination: 'ROTTERDAM' },
  { id: 'v10', mmsi: 538567890, name: 'TORM PLATTE', vesselType: 80, lat: 29.9, lon: 32.58, speed: 7.5, course: 160, heading: 158, navStatus: 0, destination: 'SINGAPORE' },
];

const VESSEL_COLORS: Record<number, string> = {
  35: '#ff3d3d', // military
  60: '#4fc3f7', // passenger
  70: '#4caf50', // cargo
  80: '#ffb300', // tanker
};

export function MaritimeLayer({ viewer }: Props) {
  const billboardsRef = useRef<Cesium.BillboardCollection | null>(null);
  const labelsRef = useRef<Cesium.LabelCollection | null>(null);
  const primitivesRef = useRef<Map<string, { billboard: Cesium.Billboard; label: Cesium.Label }>>(new Map());

  const vessels = useStore((s) => s.vessels);
  const visible = useStore((s) => s.layers.maritime.visible);
  const selectEntity = useStore((s) => s.selectEntity);
  const setEntityCount = useStore((s) => s.setEntityCount);
  const setVessels = useStore((s) => s.setVessels);

  // Load seed data on mount
  useEffect(() => {
    if (vessels.size === 0) {
      setVessels(SEED_VESSELS);
      setEntityCount('maritime', SEED_VESSELS.length);
    }
  }, [vessels.size, setVessels, setEntityCount]);

  useEffect(() => {
    const billboards = new Cesium.BillboardCollection({ scene: viewer.scene });
    const labels = new Cesium.LabelCollection({ scene: viewer.scene });

    viewer.scene.primitives.add(billboards);
    viewer.scene.primitives.add(labels);

    billboardsRef.current = billboards;
    labelsRef.current = labels;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (picked?.primitive && picked.primitive instanceof Cesium.Billboard) {
        const vesselId = (picked.primitive as any)._vesselId;
        if (vesselId) {
          const vessel = useStore.getState().vessels.get(vesselId);
          if (vessel) selectEntity(vessel, 'vessel');
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      viewer.scene.primitives.remove(billboards);
      viewer.scene.primitives.remove(labels);
    };
  }, [viewer, selectEntity]);

  useEffect(() => {
    if (billboardsRef.current) billboardsRef.current.show = visible;
    if (labelsRef.current) labelsRef.current.show = visible;
  }, [visible]);

  useEffect(() => {
    const billboards = billboardsRef.current;
    const labels = labelsRef.current;
    if (!billboards || !labels) return;

    billboards.removeAll();
    labels.removeAll();
    primitivesRef.current.clear();

    for (const [id, vessel] of vessels) {
      const position = Cesium.Cartesian3.fromDegrees(vessel.lon, vessel.lat, 0);
      const color = VESSEL_COLORS[vessel.vesselType] || '#4fc3f7';

      const billboard = billboards.add({
        position,
        image: createVesselIcon(color, vessel.vesselType === 35),
        scale: 0.5,
        rotation: -Cesium.Math.toRadians(vessel.heading || vessel.course || 0),
        alignedAxis: Cesium.Cartesian3.UNIT_Z,
        translucencyByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1e7, 0.3),
        scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 5e6, 0.3),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
      (billboard as any)._vesselId = id;

      const label = labels.add({
        position,
        text: vessel.name || String(vessel.mmsi),
        font: '9px JetBrains Mono',
        fillColor: Cesium.Color.fromCssColorString(color),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -14),
        translucencyByDistance: new Cesium.NearFarScalar(1e3, 1.0, 3e6, 0.0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });

      primitivesRef.current.set(id, { billboard, label });
    }
  }, [vessels]);

  return null;
}

// Ship-shaped icon
const vesselIconCache = new Map<string, string>();
function createVesselIcon(color: string, isMilitary: boolean): string {
  const key = `${color}_${isMilitary}`;
  if (vesselIconCache.has(key)) return vesselIconCache.get(key)!;

  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = color;

  if (isMilitary) {
    // Military diamond
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.lineTo(22, 12);
    ctx.lineTo(12, 22);
    ctx.lineTo(2, 12);
    ctx.closePath();
    ctx.fill();
  } else {
    // Ship shape pointing up
    ctx.beginPath();
    ctx.moveTo(12, 2);    // bow
    ctx.lineTo(18, 10);
    ctx.lineTo(18, 20);   // stern right
    ctx.lineTo(6, 20);    // stern left
    ctx.lineTo(6, 10);
    ctx.closePath();
    ctx.fill();
  }

  const url = canvas.toDataURL();
  vesselIconCache.set(key, url);
  return url;
}
