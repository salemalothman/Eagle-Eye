import { useState, useEffect, useCallback } from 'react';
import { useCesiumViewer } from '../../hooks/useCesiumViewer';
import * as Cesium from 'cesium';

export function LocationsPanel() {
  const viewer = useCesiumViewer();
  const [location, setLocation] = useState('--');
  const [landmark] = useState('--');

  const updateLocation = useCallback(() => {
    if (!viewer) return;
    try {
      const carto = viewer.camera.positionCartographic;
      const lat = Cesium.Math.toDegrees(carto.latitude);
      const lon = Cesium.Math.toDegrees(carto.longitude);
      setLocation(`${lat.toFixed(1)}\u00B0, ${lon.toFixed(1)}\u00B0`);
    } catch {
      setLocation('--');
    }
  }, [viewer]);

  useEffect(() => {
    if (!viewer) return;

    // Initial read
    updateLocation();

    const removeListener = viewer.camera.changed.addEventListener(updateLocation);
    return () => {
      removeListener();
    };
  }, [viewer, updateLocation]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerLabel}>LOCATIONS</span>
        <button style={styles.addBtn}>+</button>
      </div>

      {/* Location row */}
      <div style={styles.row}>
        <span style={styles.pin}>{'\uD83D\uDCCD'}</span>
        <span style={styles.label}>Location:</span>
        <span style={styles.value}>{location}</span>
      </div>

      {/* Landmark row */}
      <div style={{ ...styles.row, paddingLeft: 20 }}>
        <span style={styles.label}>Landmark:</span>
        <span style={styles.value}>{landmark}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 130,
    right: 12,
    width: 200,
    background: 'rgba(10, 14, 23, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(0, 229, 255, 0.12)',
    borderRadius: 6,
    padding: '8px 10px',
    pointerEvents: 'auto',
    zIndex: 110,
    fontFamily: "'JetBrains Mono', monospace",
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 5,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: '#6b7a8d',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  addBtn: {
    background: 'none',
    border: '1px solid rgba(0, 229, 255, 0.25)',
    borderRadius: 3,
    color: '#00e5ff',
    fontSize: 12,
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    fontFamily: "'JetBrains Mono', monospace",
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
  },
  pin: {
    fontSize: 11,
    flexShrink: 0,
  },
  label: {
    color: '#6b7a8d',
    fontSize: 10,
    fontWeight: 500,
    flexShrink: 0,
  },
  value: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
};
