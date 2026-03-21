import { useEffect, useState } from 'react';
import * as Cesium from 'cesium';
import { useCesiumViewer } from '../../hooks/useCesiumViewer';

interface CameraState {
  lat: string;
  lon: string;
  alt: string;
  heading: string;
}

function toDMS(deg: number, isLat: boolean): string {
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(3);
  const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
  return `${d}°${String(m).padStart(2, '0')}'${s}" ${dir}`;
}

export function CameraInfo() {
  const viewer = useCesiumViewer();
  const [cam, setCam] = useState<CameraState>({ lat: '—', lon: '—', alt: '—', heading: '—' });

  useEffect(() => {
    if (!viewer) return;

    const update = () => {
      try {
        const pos = viewer.camera.positionCartographic;
        const latDeg = Cesium.Math.toDegrees(pos.latitude);
        const lonDeg = Cesium.Math.toDegrees(pos.longitude);
        const altKm = pos.height / 1000;
        const hdg = Cesium.Math.toDegrees(viewer.camera.heading);

        setCam({
          lat: toDMS(latDeg, true),
          lon: toDMS(lonDeg, false),
          alt: altKm > 1000 ? `${(altKm / 1000).toFixed(1)}k KM` : `${altKm.toFixed(1)} KM`,
          heading: `${hdg.toFixed(0)}°`,
        });
      } catch {
        // Camera not ready
      }
    };

    const removeListener = viewer.scene.postRender.addEventListener(update);
    return () => removeListener();
  }, [viewer]);

  return (
    <div style={styles.container}>
      <div style={styles.coordLabel}>MARS: GPS 86 EPSG 7912</div>
      <div style={styles.coordRow}>{cam.lat}</div>
      <div style={styles.coordRow}>{cam.lon}</div>
      <div style={styles.infoRow}>
        <span style={styles.infoLabel}>ALT:</span>
        <span style={styles.infoValue}>{cam.alt}</span>
        <span style={styles.infoLabel}>HDG:</span>
        <span style={styles.infoValue}>{cam.heading}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    pointerEvents: 'none',
    zIndex: 100,
    fontFamily: 'var(--font-mono)',
  },
  coordLabel: {
    fontSize: '7px',
    color: '#4a5568',
    letterSpacing: '0.5px',
    marginBottom: '2px',
  },
  coordRow: {
    fontSize: '9px',
    color: '#6b7a8d',
    letterSpacing: '0.3px',
  },
  infoRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '2px',
    fontSize: '8px',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#4a5568',
    letterSpacing: '0.5px',
  },
  infoValue: {
    color: '#00e5ff',
    fontWeight: 500,
  },
};
