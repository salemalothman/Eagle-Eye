import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';
import type { FlightEntity } from '../../types/entities';

interface Props {
  viewer: Cesium.Viewer;
}

interface FlightPrimitive {
  billboard: Cesium.Billboard;
  label: Cesium.Label;
  trail: Cesium.Polyline | null;
}

const AMBER = '#ffb300';

export function MilitaryFlightsLayer({ viewer }: Props) {
  const billboardsRef = useRef<Cesium.BillboardCollection | null>(null);
  const labelsRef = useRef<Cesium.LabelCollection | null>(null);
  const polylinesRef = useRef<Cesium.PolylineCollection | null>(null);
  const primitivesRef = useRef<Map<string, FlightPrimitive>>(new Map());
  const trailsRef = useRef<Map<string, Array<{ lat: number; lon: number; alt: number }>>>(new Map());

  const flights = useStore((s) => s.militaryFlights);
  const visible = useStore((s) => s.layers.militaryFlights.visible);
  const selectEntity = useStore((s) => s.selectEntity);

  useEffect(() => {
    const billboards = new Cesium.BillboardCollection({ scene: viewer.scene });
    const labels = new Cesium.LabelCollection({ scene: viewer.scene });
    const polylines = new Cesium.PolylineCollection();

    viewer.scene.primitives.add(billboards);
    viewer.scene.primitives.add(labels);
    viewer.scene.primitives.add(polylines);

    billboardsRef.current = billboards;
    labelsRef.current = labels;
    polylinesRef.current = polylines;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (picked?.primitive && picked.primitive instanceof Cesium.Billboard) {
        const flightId = (picked.primitive as any)._milFlightId;
        if (flightId) {
          const flight = useStore.getState().militaryFlights.get(flightId);
          if (flight) selectEntity(flight, 'flight');
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      viewer.scene.primitives.remove(billboards);
      viewer.scene.primitives.remove(labels);
      viewer.scene.primitives.remove(polylines);
    };
  }, [viewer, selectEntity]);

  useEffect(() => {
    if (billboardsRef.current) billboardsRef.current.show = visible;
    if (labelsRef.current) labelsRef.current.show = visible;
    if (polylinesRef.current) polylinesRef.current.show = visible;
  }, [visible]);

  useEffect(() => {
    const billboards = billboardsRef.current;
    const labels = labelsRef.current;
    const polylines = polylinesRef.current;
    if (!billboards || !labels || !polylines) return;

    const existingIds = new Set(primitivesRef.current.keys());
    const newIds = new Set(flights.keys());

    for (const id of existingIds) {
      if (!newIds.has(id)) {
        const prim = primitivesRef.current.get(id)!;
        billboards.remove(prim.billboard);
        labels.remove(prim.label);
        if (prim.trail) polylines.remove(prim.trail);
        primitivesRef.current.delete(id);
        trailsRef.current.delete(id);
      }
    }

    for (const [id, flight] of flights) {
      const position = Cesium.Cartesian3.fromDegrees(
        flight.lon,
        flight.lat,
        flight.onGround ? 100 : flight.altitude
      );

      if (!trailsRef.current.has(id)) trailsRef.current.set(id, []);
      const trail = trailsRef.current.get(id)!;
      trail.push({ lat: flight.lat, lon: flight.lon, alt: flight.altitude });
      if (trail.length > 10) trail.shift();

      if (primitivesRef.current.has(id)) {
        const prim = primitivesRef.current.get(id)!;
        prim.billboard.position = position;
        prim.billboard.rotation = -Cesium.Math.toRadians(flight.heading || 0);
        prim.label.position = position;
        prim.label.text = flight.callsign || '';

        if (trail.length > 1 && prim.trail) {
          prim.trail.positions = trail.map((t) =>
            Cesium.Cartesian3.fromDegrees(t.lon, t.lat, t.alt || 100)
          );
        }
      } else {
        const billboard = billboards.add({
          position,
          image: createDiamondIcon(),
          scale: 0.6,
          rotation: -Cesium.Math.toRadians(flight.heading || 0),
          alignedAxis: Cesium.Cartesian3.UNIT_Z,
          translucencyByDistance: new Cesium.NearFarScalar(1e3, 1.0, 2e7, 0.3),
          scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1e7, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });
        (billboard as any)._milFlightId = id;

        const label = labels.add({
          position,
          text: flight.callsign || '',
          font: '10px JetBrains Mono',
          fillColor: Cesium.Color.fromCssColorString(AMBER),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          translucencyByDistance: new Cesium.NearFarScalar(1e3, 1.0, 5e6, 0.0),
          scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 5e6, 0.5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });

        let trailLine: Cesium.Polyline | null = null;
        if (trail.length > 1) {
          trailLine = polylines.add({
            positions: trail.map((t) =>
              Cesium.Cartesian3.fromDegrees(t.lon, t.lat, t.alt || 100)
            ),
            width: 1.5,
            material: Cesium.Material.fromType('Color', {
              color: Cesium.Color.fromCssColorString(AMBER).withAlpha(0.4),
            }),
          });
        }

        primitivesRef.current.set(id, { billboard, label, trail: trailLine });
      }
    }
  }, [flights]);

  return null;
}

let cachedDiamond: string | null = null;
function createDiamondIcon(): string {
  if (cachedDiamond) return cachedDiamond;

  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = AMBER;

  // Diamond shape (rotated square)
  ctx.beginPath();
  ctx.moveTo(16, 4);
  ctx.lineTo(28, 16);
  ctx.lineTo(16, 28);
  ctx.lineTo(4, 16);
  ctx.closePath();
  ctx.fill();

  // Inner highlight
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(16, 8);
  ctx.lineTo(24, 16);
  ctx.lineTo(16, 24);
  ctx.lineTo(8, 16);
  ctx.closePath();
  ctx.fill();

  cachedDiamond = canvas.toDataURL();
  return cachedDiamond;
}
