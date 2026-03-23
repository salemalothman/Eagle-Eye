import { useEffect, useRef, useCallback } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';

interface Props {
  viewer: Cesium.Viewer;
}

/**
 * Compute a destination point given origin (degrees), bearing (degrees from north), and distance (meters).
 */
function destPoint(lat: number, lon: number, bearing: number, distMeters: number): [number, number] {
  const R = 6_371_000;
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;
  const lat1 = lat * toRad;
  const lon1 = lon * toRad;
  const brng = bearing * toRad;
  const d = distMeters / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );

  return [lat2 * toDeg, lon2 * toDeg];
}

export function CctvLayer({ viewer }: Props) {
  const entitiesRef = useRef<Cesium.Entity[]>([]);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);

  const visible = useStore((s) => s.layers.cctvMesh.visible);
  const cameras = useStore((s) => s.cameras);
  const selectedCameraIdx = useStore((s) => s.selectedCameraIdx);
  const coverageOn = useStore((s) => s.coverageOn);
  const projectionOn = useStore((s) => s.projectionOn);
  const setEntityCount = useStore((s) => s.setEntityCount);
  const selectEntity = useStore((s) => s.selectEntity);
  const setSelectedCamera = useStore((s) => s.setSelectedCamera);

  const selectEntityRef = useRef(selectEntity);
  selectEntityRef.current = selectEntity;
  const setSelectedCameraRef = useRef(setSelectedCamera);
  setSelectedCameraRef.current = setSelectedCamera;

  // Create camera icon canvases
  const normalIconRef = useRef<string | null>(null);
  const selectedIconRef = useRef<string | null>(null);

  const getNormalIcon = useCallback(() => {
    if (normalIconRef.current) return normalIconRef.current;
    normalIconRef.current = createCameraIcon(20, '#80cbc4', '#00ff41');
    return normalIconRef.current;
  }, []);

  const getSelectedIcon = useCallback(() => {
    if (selectedIconRef.current) return selectedIconRef.current;
    selectedIconRef.current = createCameraIcon(28, '#00e5ff', '#ffab00');
    return selectedIconRef.current;
  }, []);

  useEffect(() => {
    // Cleanup previous entities
    for (const entity of entitiesRef.current) {
      viewer.entities.remove(entity);
    }
    entitiesRef.current = [];

    if (handlerRef.current) {
      handlerRef.current.destroy();
      handlerRef.current = null;
    }

    if (!visible) return;

    setEntityCount('cctvMesh', cameras.length);

    const CONE_DISTANCE = 200; // meters

    cameras.forEach((cam, idx) => {
      const isSelected = idx === selectedCameraIdx;

      // Camera billboard
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(cam.lon, cam.lat, 50),
        billboard: {
          image: isSelected ? getSelectedIcon() : getNormalIcon(),
          scale: isSelected ? 0.65 : 0.5,
          translucencyByDistance: new Cesium.NearFarScalar(1e2, 1.0, 5e6, 0.0),
          scaleByDistance: new Cesium.NearFarScalar(1e2, 1.0, 1e6, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: cam.name,
          font: isSelected ? '10px JetBrains Mono' : '9px JetBrains Mono',
          fillColor: isSelected
            ? Cesium.Color.fromCssColorString('#00e5ff')
            : Cesium.Color.fromCssColorString('#80cbc4'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, isSelected ? -18 : -14),
          translucencyByDistance: new Cesium.NearFarScalar(1e2, 1.0, 2e5, 0.0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      (entity as any)._camIdx = idx;
      entitiesRef.current.push(entity);

      // FOV Cone polygon (coverage)
      if (coverageOn && isSelected) {
        const halfFov = cam.fov / 2;
        const leftBearing = cam.heading - halfFov;
        const rightBearing = cam.heading + halfFov;

        const [leftLat, leftLon] = destPoint(cam.lat, cam.lon, leftBearing, CONE_DISTANCE);
        const [rightLat, rightLon] = destPoint(cam.lat, cam.lon, rightBearing, CONE_DISTANCE);

        // Interpolate arc between left and right for smoother cone
        const arcPoints: number[] = [];
        const steps = 12;
        for (let i = 0; i <= steps; i++) {
          const bearing = leftBearing + (rightBearing - leftBearing) * (i / steps);
          const [pLat, pLon] = destPoint(cam.lat, cam.lon, bearing, CONE_DISTANCE);
          arcPoints.push(pLon, pLat);
        }

        const positions = [
          cam.lon, cam.lat,
          ...arcPoints,
          cam.lon, cam.lat,
        ];

        const coneEntity = viewer.entities.add({
          polygon: {
            hierarchy: Cesium.Cartesian3.fromDegreesArray(positions),
            material: Cesium.Color.fromCssColorString('rgba(0, 255, 65, 0.15)'),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString('#00ff41'),
            outlineWidth: 1,
            height: 5,
          },
        });
        entitiesRef.current.push(coneEntity);
      }

      // Projection wireframe lines
      if (projectionOn && isSelected) {
        const halfFov = cam.fov / 2;
        const bearings = [
          cam.heading,
          cam.heading - halfFov,
          cam.heading + halfFov,
          cam.heading - halfFov * 0.5,
          cam.heading + halfFov * 0.5,
        ];

        for (const bearing of bearings) {
          const [destLat, destLon] = destPoint(cam.lat, cam.lon, bearing, CONE_DISTANCE);

          const lineEntity = viewer.entities.add({
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArrayHeights([
                cam.lon, cam.lat, 50,
                destLon, destLat, 5,
              ]),
              width: 1,
              material: bearing === cam.heading
                ? Cesium.Color.fromCssColorString('#ffeb3b').withAlpha(0.7)
                : Cesium.Color.fromCssColorString('#00ff41').withAlpha(0.5),
            },
          });
          entitiesRef.current.push(lineEntity);
        }

        // Cross-bar at the far end
        const [farLeftLat, farLeftLon] = destPoint(cam.lat, cam.lon, cam.heading - halfFov, CONE_DISTANCE);
        const [farRightLat, farRightLon] = destPoint(cam.lat, cam.lon, cam.heading + halfFov, CONE_DISTANCE);

        const crossBar = viewer.entities.add({
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights([
              farLeftLon, farLeftLat, 5,
              farRightLon, farRightLat, 5,
            ]),
            width: 1,
            material: Cesium.Color.fromCssColorString('#00ff41').withAlpha(0.4),
          },
        });
        entitiesRef.current.push(crossBar);
      }
    });

    // Click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id && typeof (picked.id as any)._camIdx === 'number') {
        const idx = (picked.id as any)._camIdx as number;
        const cam = cameras[idx];
        if (cam) {
          setSelectedCameraRef.current(idx);
          selectEntityRef.current(cam, 'cctv');
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handlerRef.current = handler;

    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
    };
  }, [viewer, visible, cameras, selectedCameraIdx, coverageOn, projectionOn, setEntityCount, getNormalIcon, getSelectedIcon]);

  return null;
}

/* ── Camera icon generator ──────────────────────────────── */

function createCameraIcon(size: number, bodyColor: string, dotColor: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const s = size / 20; // scale factor relative to original 20px

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = bodyColor;

  // Camera body
  ctx.fillRect(4 * s, 6 * s, 10 * s, 8 * s);
  // Lens
  ctx.beginPath();
  ctx.arc(14 * s, 10 * s, 4 * s, -Math.PI / 3, Math.PI / 3);
  ctx.lineTo(14 * s, 10 * s);
  ctx.closePath();
  ctx.fill();
  // Status dot
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(6 * s, 8 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL();
}
