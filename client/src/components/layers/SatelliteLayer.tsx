import { useEffect, useRef, useCallback } from 'react';
import * as Cesium from 'cesium';
import * as satellite from 'satellite.js';
import { useStore } from '../../store';
import type { SatelliteEntity } from '../../types/entities';

interface Props {
  viewer: Cesium.Viewer;
}

interface SatPrimitive {
  billboard: Cesium.Billboard;
  label: Cesium.Label;
  satrec: satellite.SatRec;
  entity: SatelliteEntity;
}

const CATEGORY_COLORS: Record<string, string> = {
  military: '#ff3d3d',
  imaging: '#ff8c00',
  comms: '#00e5ff',
  weather: '#a855f7',
  navigation: '#22c55e',
  science: '#fbbf24',
  other: '#94a3b8',
};

// How many points to draw for one orbital period
const ORBIT_PATH_POINTS = 120;
// Max satellites to render for performance (prioritize non-Starlink)
const MAX_RENDERED = 800;

export function SatelliteLayer({ viewer }: Props) {
  const billboardsRef = useRef<Cesium.BillboardCollection | null>(null);
  const labelsRef = useRef<Cesium.LabelCollection | null>(null);
  const orbitLinesRef = useRef<Cesium.PolylineCollection | null>(null);
  const groundLinesRef = useRef<Cesium.PolylineCollection | null>(null);
  const primitivesRef = useRef<Map<number, SatPrimitive>>(new Map());
  const orbitPolylinesRef = useRef<Map<number, Cesium.Polyline>>(new Map());
  const groundPolylinesRef = useRef<Map<number, Cesium.Polyline>>(new Map());
  const animFrameRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  const satellites = useStore((s) => s.satellites);
  const visible = useStore((s) => s.layers.satellites.visible);
  const selectEntity = useStore((s) => s.selectEntity);

  // Initialize collections
  useEffect(() => {
    const billboards = new Cesium.BillboardCollection({ scene: viewer.scene });
    const labels = new Cesium.LabelCollection({ scene: viewer.scene });
    const orbitLines = new Cesium.PolylineCollection();
    const groundLines = new Cesium.PolylineCollection();

    viewer.scene.primitives.add(billboards);
    viewer.scene.primitives.add(labels);
    viewer.scene.primitives.add(orbitLines);
    viewer.scene.primitives.add(groundLines);

    billboardsRef.current = billboards;
    labelsRef.current = labels;
    orbitLinesRef.current = orbitLines;
    groundLinesRef.current = groundLines;

    // Click handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (picked?.primitive && picked.primitive instanceof Cesium.Billboard) {
        const satId = (picked.primitive as any)._satId;
        if (satId != null) {
          const sat = useStore.getState().satellites.get(satId);
          if (sat) {
            selectEntity(sat, 'satellite');
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      cancelAnimationFrame(animFrameRef.current);
      viewer.scene.primitives.remove(billboards);
      viewer.scene.primitives.remove(labels);
      viewer.scene.primitives.remove(orbitLines);
      viewer.scene.primitives.remove(groundLines);
    };
  }, [viewer, selectEntity]);

  // Visibility
  useEffect(() => {
    if (billboardsRef.current) billboardsRef.current.show = visible;
    if (labelsRef.current) labelsRef.current.show = visible;
    if (orbitLinesRef.current) orbitLinesRef.current.show = visible;
    if (groundLinesRef.current) groundLinesRef.current.show = visible;
  }, [visible]);

  // Propagate satellite position using SGP4
  const propagate = useCallback((satrec: satellite.SatRec, date: Date) => {
    try {
      const posVel = satellite.propagate(satrec, date);
      if (!posVel.position || typeof posVel.position === 'boolean') return null;

      const gmst = satellite.gstime(date);
      const geo = satellite.eciToGeodetic(posVel.position, gmst);

      return {
        lat: satellite.degreesLat(geo.latitude),
        lon: satellite.degreesLong(geo.longitude),
        alt: geo.height * 1000, // km -> meters
      };
    } catch {
      return null;
    }
  }, []);

  // Compute orbital path points
  const computeOrbitPath = useCallback(
    (satrec: satellite.SatRec, now: Date): Cesium.Cartesian3[] => {
      // Orbital period in minutes from mean motion (rev/day)
      const meanMotion = satrec.no * (1440 / (2 * Math.PI)); // rad/min -> rev/day
      const periodMinutes = meanMotion > 0 ? 1440 / meanMotion : 90;
      const stepMs = (periodMinutes * 60 * 1000) / ORBIT_PATH_POINTS;

      const positions: Cesium.Cartesian3[] = [];
      for (let i = 0; i <= ORBIT_PATH_POINTS; i++) {
        const t = new Date(now.getTime() + i * stepMs);
        const pos = propagate(satrec, t);
        if (pos) {
          positions.push(Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt));
        }
      }
      return positions;
    },
    [propagate]
  );

  // Build/rebuild satellite primitives when TLE catalog changes
  useEffect(() => {
    const billboards = billboardsRef.current;
    const labels = labelsRef.current;
    const orbitLines = orbitLinesRef.current;
    const groundLines = groundLinesRef.current;
    if (!billboards || !labels || !orbitLines || !groundLines) return;

    // Clear old primitives
    billboards.removeAll();
    labels.removeAll();
    orbitLines.removeAll();
    groundLines.removeAll();
    primitivesRef.current.clear();
    orbitPolylinesRef.current.clear();
    groundPolylinesRef.current.clear();

    if (satellites.size === 0) return;

    // Prioritize: military, imaging, navigation first, then limit Starlink
    const sorted = Array.from(satellites.values()).sort((a, b) => {
      const priority: Record<string, number> = {
        military: 0,
        imaging: 1,
        navigation: 2,
        weather: 3,
        science: 4,
        comms: 5,
        other: 6,
      };
      return (priority[a.category] ?? 6) - (priority[b.category] ?? 6);
    });
    const toRender = sorted.slice(0, MAX_RENDERED);

    const now = new Date();

    for (const sat of toRender) {
      try {
        const satrec = satellite.twoline2satrec(sat.tleLine1, sat.tleLine2);
        const pos = propagate(satrec, now);
        if (!pos) continue;

        const position = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt);
        const color = CATEGORY_COLORS[sat.category] || CATEGORY_COLORS.other;

        const billboard = billboards.add({
          position,
          image: createSatelliteIcon(color),
          scale: 0.5,
          translucencyByDistance: new Cesium.NearFarScalar(1e4, 1.0, 3e7, 0.4),
          scaleByDistance: new Cesium.NearFarScalar(1e4, 1.0, 2e7, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });
        (billboard as any)._satId = sat.noradId;

        const label = labels.add({
          position,
          text: sat.name,
          font: '9px JetBrains Mono',
          fillColor: Cesium.Color.fromCssColorString(color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          translucencyByDistance: new Cesium.NearFarScalar(1e4, 1.0, 8e6, 0.0),
          scaleByDistance: new Cesium.NearFarScalar(1e4, 1.0, 8e6, 0.4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });

        primitivesRef.current.set(sat.noradId, { billboard, label, satrec, entity: sat });

        // Orbital path (dashed cyan/colored line)
        const orbitPositions = computeOrbitPath(satrec, now);
        if (orbitPositions.length > 2) {
          const orbitLine = orbitLines.add({
            positions: orbitPositions,
            width: 1.0,
            material: Cesium.Material.fromType('Color', {
              color: Cesium.Color.fromCssColorString(color).withAlpha(0.2),
            }),
          });
          orbitPolylinesRef.current.set(sat.noradId, orbitLine);
        }

        // Ground-target line (satellite to nadir point on surface)
        const nadirPosition = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, 0);
        const groundLine = groundLines.add({
          positions: [position, nadirPosition],
          width: 0.5,
          material: Cesium.Material.fromType('Color', {
            color: Cesium.Color.WHITE.withAlpha(0.15),
          }),
        });
        groundPolylinesRef.current.set(sat.noradId, groundLine);
      } catch {
        // Skip satellites with bad TLEs
      }
    }
  }, [satellites, propagate, computeOrbitPath]);

  // Real-time animation loop: update satellite positions every 100ms
  useEffect(() => {
    if (!visible || primitivesRef.current.size === 0) return;

    const tick = () => {
      const now = performance.now();
      // Throttle to every 100ms
      if (now - lastUpdateRef.current < 100) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      lastUpdateRef.current = now;

      const date = new Date();
      for (const [noradId, prim] of primitivesRef.current) {
        const pos = propagate(prim.satrec, date);
        if (!pos) continue;

        const position = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, pos.alt);
        prim.billboard.position = position;
        prim.label.position = position;

        // Update ground line
        const groundLine = groundPolylinesRef.current.get(noradId);
        if (groundLine) {
          const nadir = Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat, 0);
          groundLine.positions = [position, nadir];
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [visible, propagate]);

  return null;
}

// Diamond-shaped satellite icon
const iconCache = new Map<string, string>();
function createSatelliteIcon(color: string): string {
  if (iconCache.has(color)) return iconCache.get(color)!;

  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // Diamond shape
  ctx.beginPath();
  ctx.moveTo(12, 2);  // top
  ctx.lineTo(22, 12); // right
  ctx.lineTo(12, 22); // bottom
  ctx.lineTo(2, 12);  // left
  ctx.closePath();
  ctx.fill();

  // Inner glow
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(12, 6);
  ctx.lineTo(18, 12);
  ctx.lineTo(12, 18);
  ctx.lineTo(6, 12);
  ctx.closePath();
  ctx.fill();

  const url = canvas.toDataURL();
  iconCache.set(color, url);
  return url;
}
