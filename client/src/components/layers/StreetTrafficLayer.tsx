import { useEffect, useRef, useCallback } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';

interface Props {
  viewer: Cesium.Viewer;
}

interface VehicleData {
  id: string;
  lat: number;
  lon: number;
  label: Cesium.Label;
}

const ALTITUDE_THRESHOLD = 5000; // meters
const VEHICLE_COUNT = 40;
const ANIMATION_INTERVAL = 2000; // ms

export function StreetTrafficLayer({ viewer }: Props) {
  const labelCollectionRef = useRef<Cesium.LabelCollection | null>(null);
  const vehiclesRef = useRef<VehicleData[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCenterRef = useRef<{ lat: number; lon: number } | null>(null);

  const visible = useStore((s) => s.layers.streetTraffic.visible);
  const setEntityCount = useStore((s) => s.setEntityCount);

  // Initialize label collection
  useEffect(() => {
    const labels = new Cesium.LabelCollection({ scene: viewer.scene });
    viewer.scene.primitives.add(labels);
    labelCollectionRef.current = labels;

    return () => {
      viewer.scene.primitives.remove(labels);
      labelCollectionRef.current = null;
    };
  }, [viewer]);

  const clearVehicles = useCallback(() => {
    const labels = labelCollectionRef.current;
    if (!labels) return;
    labels.removeAll();
    vehiclesRef.current = [];
    setEntityCount('streetTraffic', 0);
  }, [setEntityCount]);

  const generateVehicles = useCallback(() => {
    const labels = labelCollectionRef.current;
    if (!labels) return;

    const carto = viewer.camera.positionCartographic;
    const centerLat = Cesium.Math.toDegrees(carto.latitude);
    const centerLon = Cesium.Math.toDegrees(carto.longitude);

    // Clear existing
    labels.removeAll();
    vehiclesRef.current = [];

    const vehicles: VehicleData[] = [];

    for (let i = 0; i < VEHICLE_COUNT; i++) {
      const id = `VEH-${String(i + 301).padStart(4, '0')}`;
      const lat = centerLat + (Math.random() - 0.5) * 0.02; // ~0.01 degree radius
      const lon = centerLon + (Math.random() - 0.5) * 0.02;

      const position = Cesium.Cartesian3.fromDegrees(lon, lat, 2);

      const label = labels.add({
        position,
        text: id,
        font: '9px JetBrains Mono',
        fillColor: Cesium.Color.fromCssColorString('#d4a843'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, 0),
        translucencyByDistance: new Cesium.NearFarScalar(1e2, 1.0, 1e5, 0.0),
        scaleByDistance: new Cesium.NearFarScalar(1e2, 1.0, 5e4, 0.4),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });

      vehicles.push({ id, lat, lon, label });
    }

    vehiclesRef.current = vehicles;
    lastCenterRef.current = { lat: centerLat, lon: centerLon };
    setEntityCount('streetTraffic', vehicles.length);
  }, [viewer, setEntityCount]);

  // Animate vehicles: shift positions every 2s
  useEffect(() => {
    if (!visible) return;

    intervalRef.current = setInterval(() => {
      for (const vehicle of vehiclesRef.current) {
        const deltaLat = (Math.random() - 0.5) * 0.0001; // 0.00001 - 0.00005 range
        const deltaLon = (Math.random() - 0.5) * 0.0001;
        vehicle.lat += deltaLat;
        vehicle.lon += deltaLon;
        vehicle.label.position = Cesium.Cartesian3.fromDegrees(vehicle.lon, vehicle.lat, 2);
      }
    }, ANIMATION_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [visible]);

  // Camera change handler: check altitude, regenerate when camera moves significantly
  useEffect(() => {
    const checkCamera = () => {
      const labels = labelCollectionRef.current;
      if (!labels) return;

      const altitude = viewer.camera.positionCartographic.height;

      if (!visible || altitude > ALTITUDE_THRESHOLD) {
        if (vehiclesRef.current.length > 0) {
          clearVehicles();
        }
        labels.show = false;
        return;
      }

      labels.show = true;

      const centerLat = Cesium.Math.toDegrees(viewer.camera.positionCartographic.latitude);
      const centerLon = Cesium.Math.toDegrees(viewer.camera.positionCartographic.longitude);

      // Regenerate if camera moved significantly (> 0.005 degrees) or no vehicles yet
      const last = lastCenterRef.current;
      if (
        vehiclesRef.current.length === 0 ||
        !last ||
        Math.abs(centerLat - last.lat) > 0.005 ||
        Math.abs(centerLon - last.lon) > 0.005
      ) {
        generateVehicles();
      }
    };

    viewer.camera.changed.addEventListener(checkCamera);

    // Initial check
    checkCamera();

    return () => {
      viewer.camera.changed.removeEventListener(checkCamera);
    };
  }, [viewer, visible, clearVehicles, generateVehicles]);

  // Visibility toggle
  useEffect(() => {
    if (!visible) {
      clearVehicles();
      if (labelCollectionRef.current) {
        labelCollectionRef.current.show = false;
      }
    }
  }, [visible, clearVehicles]);

  return null;
}
