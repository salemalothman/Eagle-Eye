import { useEffect, useState } from 'react';
import * as Cesium from 'cesium';
import { useCesiumViewer } from '../../hooks/useCesiumViewer';
import { useStore } from '../../store';

export function RightSidebar() {
  const viewer = useCesiumViewer();
  const sensitivity = useStore((s) => s.sensitivity);
  const pixelation = useStore((s) => s.pixelation);
  const setSensitivity = useStore((s) => s.setSensitivity);
  const setPixelation = useStore((s) => s.setPixelation);
  const rightSidebarOpen = useStore((s) => s.rightSidebarOpen);
  const layers = useStore((s) => s.layers);

  const [altKm, setAltKm] = useState('—');

  // Count total visible entities
  const totalEntities = Object.values(layers).reduce((sum, l) => sum + (l.visible ? l.entityCount : 0), 0);

  useEffect(() => {
    if (!viewer) return;
    const update = () => {
      try {
        const h = viewer.camera.positionCartographic.height / 1000;
        setAltKm(h > 1000 ? `${(h / 1000).toFixed(1)}k` : `${h.toFixed(0)}`);
      } catch {}
    };
    const remove = viewer.scene.postRender.addEventListener(update);
    return () => remove();
  }, [viewer]);

  if (!rightSidebarOpen) return null;

  return (
    <div style={styles.container}>
      {/* Action buttons */}
      <div style={styles.buttonGroup}>
        <button style={{ ...styles.button, ...styles.buttonSleep }}>SLEEP</button>
        <button style={{ ...styles.button, ...styles.buttonAor }}>AOR</button>
        <select style={styles.select} defaultValue="tactical">
          <option value="tactical">Tactical</option>
          <option value="strategic">Strategic</option>
          <option value="overview">Overview</option>
        </select>
      </div>

      {/* Sliders */}
      <div style={styles.sliderGroup}>
        <div style={styles.sliderRow}>
          <label style={styles.sliderLabel}>SENSITIVITY</label>
          <input
            type="range"
            min={0}
            max={100}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            style={styles.slider}
          />
        </div>
        <div style={styles.sliderRow}>
          <label style={styles.sliderLabel}>PIXELATION</label>
          <input
            type="range"
            min={0}
            max={100}
            value={pixelation}
            onChange={(e) => setPixelation(Number(e.target.value))}
            style={styles.slider}
          />
        </div>
      </div>

      <button style={{ ...styles.button, ...styles.buttonClear }}>CLEAR RANGE</button>

      {/* Extra readouts (matching reference) */}
      <div style={styles.readouts}>
        <div style={styles.readoutRow}>
          <span style={styles.readoutLabel}>EVENTS</span>
          <span style={styles.readoutValue}>{layers.events.entityCount}</span>
        </div>
        <div style={styles.readoutRow}>
          <span style={styles.readoutLabel}>ALT</span>
          <span style={styles.readoutValue}>{altKm} KM</span>
        </div>
        <div style={styles.readoutRow}>
          <span style={styles.readoutLabel}>ENT</span>
          <span style={styles.readoutValue}>{totalEntities}</span>
        </div>
        <div style={styles.readoutRow}>
          <span style={styles.readoutLabel}>CRS</span>
          <span style={styles.readoutValue}>4750</span>
        </div>
        <div style={styles.readoutRow}>
          <span style={styles.readoutLabel}>PASS</span>
          <span style={styles.readoutValue}>3592-293</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 80,
    right: 12,
    width: 160,
    background: 'var(--color-bg-panel)',
    backdropFilter: 'var(--panel-blur)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--panel-radius)',
    padding: '12px',
    pointerEvents: 'auto',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  button: {
    padding: '6px 10px',
    fontSize: '10px',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    border: '1px solid',
    borderRadius: '2px',
    cursor: 'pointer',
    letterSpacing: '1px',
    textAlign: 'center' as const,
    transition: 'all var(--transition-fast)',
  },
  buttonSleep: {
    background: 'rgba(0, 255, 65, 0.15)',
    borderColor: 'rgba(0, 255, 65, 0.4)',
    color: '#00ff41',
  },
  buttonAor: {
    background: 'rgba(0, 229, 255, 0.15)',
    borderColor: 'rgba(0, 229, 255, 0.4)',
    color: '#00e5ff',
  },
  buttonClear: {
    background: 'rgba(255, 61, 61, 0.1)',
    borderColor: 'rgba(255, 61, 61, 0.3)',
    color: '#ff3d3d',
  },
  select: {
    padding: '6px 8px',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    background: 'rgba(17, 24, 39, 0.8)',
    color: '#e0e6ed',
    border: '1px solid var(--color-border)',
    borderRadius: '2px',
    cursor: 'pointer',
    outline: 'none',
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sliderRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  sliderLabel: {
    fontSize: '8px',
    fontWeight: 600,
    color: '#6b7a8d',
    letterSpacing: '1.5px',
  },
  slider: {
    width: '100%',
    height: 4,
    appearance: 'none' as const,
    background: 'rgba(0, 229, 255, 0.2)',
    borderRadius: '2px',
    cursor: 'pointer',
    accentColor: '#00e5ff',
  },
  readouts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    paddingTop: '8px',
    borderTop: '1px solid var(--color-border)',
  },
  readoutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readoutLabel: {
    fontSize: '7px',
    fontWeight: 600,
    color: '#4a5568',
    letterSpacing: '1px',
  },
  readoutValue: {
    fontSize: '9px',
    color: '#00e5ff',
    fontWeight: 500,
    letterSpacing: '0.5px',
  },
};
