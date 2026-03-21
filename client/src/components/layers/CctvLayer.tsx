import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';

interface Props {
  viewer: Cesium.Viewer;
}

interface CameraStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  streamUrl?: string;
}

// Seed CCTV cameras (Austin traffic cameras + global landmarks)
const SEED_CAMERAS: CameraStation[] = [
  { id: 'cam_1', name: 'I-35 @ 51st St', lat: 30.315, lon: -97.723, streamUrl: '' },
  { id: 'cam_2', name: 'MoPac @ Enfield', lat: 30.285, lon: -97.776, streamUrl: '' },
  { id: 'cam_3', name: 'US-183 @ Burnet', lat: 30.372, lon: -97.724, streamUrl: '' },
  { id: 'cam_4', name: 'I-35 @ Riverside', lat: 30.252, lon: -97.733, streamUrl: '' },
  // Dubai
  { id: 'cam_5', name: 'Sheikh Zayed Road', lat: 25.198, lon: 55.272, streamUrl: '' },
  { id: 'cam_6', name: 'Dubai Marina', lat: 25.080, lon: 55.139, streamUrl: '' },
  // London
  { id: 'cam_7', name: 'Trafalgar Square', lat: 51.508, lon: -0.128, streamUrl: '' },
  { id: 'cam_8', name: 'Tower Bridge', lat: 51.505, lon: -0.075, streamUrl: '' },
  // Tokyo
  { id: 'cam_9', name: 'Shibuya Crossing', lat: 35.659, lon: 139.700, streamUrl: '' },
  // Times Square
  { id: 'cam_10', name: 'Times Square NYC', lat: 40.758, lon: -73.985, streamUrl: '' },
];

export function CctvLayer({ viewer }: Props) {
  const entitiesRef = useRef<Cesium.Entity[]>([]);

  const visible = useStore((s) => s.layers.cctvMesh.visible);
  const setEntityCount = useStore((s) => s.setEntityCount);
  const selectEntity = useStore((s) => s.selectEntity);

  useEffect(() => {
    for (const entity of entitiesRef.current) {
      viewer.entities.remove(entity);
    }
    entitiesRef.current = [];

    if (!visible) return;

    setEntityCount('cctvMesh', SEED_CAMERAS.length);

    for (const cam of SEED_CAMERAS) {
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(cam.lon, cam.lat, 50),
        billboard: {
          image: createCameraIcon(),
          scale: 0.5,
          translucencyByDistance: new Cesium.NearFarScalar(1e2, 1.0, 5e6, 0.0),
          scaleByDistance: new Cesium.NearFarScalar(1e2, 1.0, 1e6, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: cam.name,
          font: '9px JetBrains Mono',
          fillColor: Cesium.Color.fromCssColorString('#80cbc4'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          translucencyByDistance: new Cesium.NearFarScalar(1e2, 1.0, 2e5, 0.0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      (entity as any)._camId = cam.id;
      entitiesRef.current.push(entity);
    }

    // Click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id && (picked.id as any)._camId) {
        const cam = SEED_CAMERAS.find((c) => c.id === (picked.id as any)._camId);
        if (cam) selectEntity(cam, 'cctv');
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => handler.destroy();
  }, [viewer, visible, setEntityCount, selectEntity]);

  return null;
}

let cachedCamIcon: string | null = null;
function createCameraIcon(): string {
  if (cachedCamIcon) return cachedCamIcon;

  const size = 20;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#80cbc4';

  // Camera body
  ctx.fillRect(4, 6, 10, 8);
  // Lens
  ctx.beginPath();
  ctx.arc(14, 10, 4, -Math.PI / 3, Math.PI / 3);
  ctx.lineTo(14, 10);
  ctx.closePath();
  ctx.fill();
  // Status dot (green = active)
  ctx.fillStyle = '#00ff41';
  ctx.beginPath();
  ctx.arc(6, 8, 2, 0, Math.PI * 2);
  ctx.fill();

  cachedCamIcon = canvas.toDataURL();
  return cachedCamIcon;
}
