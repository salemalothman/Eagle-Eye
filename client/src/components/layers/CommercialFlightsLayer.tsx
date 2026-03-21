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

export function CommercialFlightsLayer({ viewer }: Props) {
  const billboardCollectionRef = useRef<Cesium.BillboardCollection | null>(null);
  const labelCollectionRef = useRef<Cesium.LabelCollection | null>(null);
  const polylineCollectionRef = useRef<Cesium.PolylineCollection | null>(null);
  const primitivesRef = useRef<Map<string, FlightPrimitive>>(new Map());
  const trailsRef = useRef<Map<string, Array<{ lat: number; lon: number; alt: number }>>>(new Map());

  const flights = useStore((s) => s.commercialFlights);
  const visible = useStore((s) => s.layers.commercialFlights.visible);
  const selectEntity = useStore((s) => s.selectEntity);

  // Initialize collections
  useEffect(() => {
    const billboards = new Cesium.BillboardCollection({ scene: viewer.scene });
    const labels = new Cesium.LabelCollection({ scene: viewer.scene });
    const polylines = new Cesium.PolylineCollection();

    viewer.scene.primitives.add(billboards);
    viewer.scene.primitives.add(labels);
    viewer.scene.primitives.add(polylines);

    billboardCollectionRef.current = billboards;
    labelCollectionRef.current = labels;
    polylineCollectionRef.current = polylines;

    // Click handler for flights
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position);
      if (picked?.primitive && picked.primitive instanceof Cesium.Billboard) {
        const flightId = (picked.primitive as any)._flightId;
        if (flightId) {
          const flight = useStore.getState().commercialFlights.get(flightId);
          if (flight) {
            selectEntity(flight, 'flight');
          }
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

  // Update visibility
  useEffect(() => {
    if (billboardCollectionRef.current) billboardCollectionRef.current.show = visible;
    if (labelCollectionRef.current) labelCollectionRef.current.show = visible;
    if (polylineCollectionRef.current) polylineCollectionRef.current.show = visible;
  }, [visible]);

  // Update flights
  useEffect(() => {
    const billboards = billboardCollectionRef.current;
    const labels = labelCollectionRef.current;
    const polylines = polylineCollectionRef.current;
    if (!billboards || !labels || !polylines) return;

    const existingIds = new Set(primitivesRef.current.keys());
    const newIds = new Set(flights.keys());

    // Remove flights that no longer exist
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

    // Add or update flights
    for (const [id, flight] of flights) {
      const position = Cesium.Cartesian3.fromDegrees(
        flight.lon,
        flight.lat,
        flight.onGround ? 100 : flight.altitude
      );

      // Update trail history
      if (!trailsRef.current.has(id)) trailsRef.current.set(id, []);
      const trail = trailsRef.current.get(id)!;
      trail.push({ lat: flight.lat, lon: flight.lon, alt: flight.altitude });
      if (trail.length > 10) trail.shift();

      if (primitivesRef.current.has(id)) {
        // Update existing
        const prim = primitivesRef.current.get(id)!;
        prim.billboard.position = position;
        prim.billboard.rotation = -Cesium.Math.toRadians(flight.heading || 0);
        prim.label.position = position;
        prim.label.text = flight.callsign || '';

        // Update trail polyline
        if (trail.length > 1 && prim.trail) {
          prim.trail.positions = trail.map((t) =>
            Cesium.Cartesian3.fromDegrees(t.lon, t.lat, t.alt || 100)
          );
        }
      } else {
        // Create new
        const billboard = billboards.add({
          position,
          image: createAirplaneIcon('#00e5ff'),
          scale: 0.6,
          rotation: -Cesium.Math.toRadians(flight.heading || 0),
          alignedAxis: Cesium.Cartesian3.UNIT_Z,
          translucencyByDistance: new Cesium.NearFarScalar(1e3, 1.0, 2e7, 0.3),
          scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1e7, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });
        (billboard as any)._flightId = id;

        const label = labels.add({
          position,
          text: flight.callsign || '',
          font: '10px JetBrains Mono',
          fillColor: Cesium.Color.fromCssColorString('#00e5ff'),
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
              color: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.4),
            }),
          });
        }

        primitivesRef.current.set(id, { billboard, label, trail: trailLine });
      }
    }
  }, [flights]);

  return null;
}

// Create airplane icon as a data URL canvas
let cachedIcon: string | null = null;
function createAirplaneIcon(color: string): string {
  if (cachedIcon) return cachedIcon;

  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  // Simple airplane silhouette pointing up
  ctx.beginPath();
  ctx.moveTo(16, 2);   // nose
  ctx.lineTo(20, 14);  // right fuselage
  ctx.lineTo(30, 18);  // right wing tip
  ctx.lineTo(30, 20);  // right wing bottom
  ctx.lineTo(20, 17);  // right wing join
  ctx.lineTo(19, 24);  // right tail
  ctx.lineTo(24, 28);  // right tail tip
  ctx.lineTo(24, 30);  // right tail bottom
  ctx.lineTo(16, 27);  // tail center
  ctx.lineTo(8, 30);   // left tail bottom
  ctx.lineTo(8, 28);   // left tail tip
  ctx.lineTo(13, 24);  // left tail
  ctx.lineTo(12, 17);  // left wing join
  ctx.lineTo(2, 20);   // left wing bottom
  ctx.lineTo(2, 18);   // left wing tip
  ctx.lineTo(12, 14);  // left fuselage
  ctx.closePath();
  ctx.fill();

  cachedIcon = canvas.toDataURL();
  return cachedIcon;
}
