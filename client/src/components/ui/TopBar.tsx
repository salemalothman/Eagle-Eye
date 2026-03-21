import { useStore } from '../../store';
import type { AppMode } from '../../types/layers';

export function TopBar() {
  const fps = useStore((s) => s.fps);
  const appMode = useStore((s) => s.appMode);
  const shaderMode = useStore((s) => s.shaderMode);
  const setAppMode = useStore((s) => s.setAppMode);
  const flightCount = useStore((s) => s.layers.commercialFlights.entityCount);

  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 23);

  return (
    <div style={styles.container}>
      {/* Left section: FPS + Stats */}
      <div style={styles.left}>
        <div style={styles.statsRow}>
          <span style={styles.stat}>FPS:{fps}</span>
          <span style={styles.stat}>DMS:{(1000 / Math.max(fps, 1)).toFixed(1)}ms</span>
          <span style={styles.stat}>ENT:{flightCount}</span>
        </div>
        <div style={styles.logoRow}>
          <div style={styles.pulsingDot} />
          <span style={styles.logo}>EAGLE EYE</span>
        </div>
        <div style={styles.classificationBanner}>
          TOP SECRET // SI-TK // NOFORN
        </div>
        <div style={styles.metaRow}>
          <span style={styles.metaText}>0413-4164 DPS-4157</span>
        </div>
        <div style={styles.modeLabel}>
          {shaderMode.toUpperCase()}
        </div>
      </div>

      {/* Center: LIVE / PLAYBACK toggle */}
      <div style={styles.center}>
        <div style={styles.modeToggle}>
          <button
            style={{
              ...styles.modeButton,
              ...(appMode === 'live' ? styles.modeButtonActive : {}),
            }}
            onClick={() => setAppMode('live')}
          >
            LIVE
          </button>
          <button
            style={{
              ...styles.modeButton,
              ...(appMode === 'playback' ? styles.modeButtonActive : {}),
            }}
            onClick={() => setAppMode('playback')}
          >
            PLAYBACK
          </button>
        </div>
      </div>

      {/* Right section: Shader mode + timestamp */}
      <div style={styles.right}>
        <div style={styles.shaderLabel}>{shaderMode.toUpperCase()}</div>
        <div style={styles.recRow}>
          <span style={styles.recDot}>●</span>
          <span style={styles.recText}>REC {timestamp}</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '8px 16px',
    pointerEvents: 'none',
    zIndex: 100,
    fontFamily: 'var(--font-mono)',
  },
  left: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    pointerEvents: 'auto',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    fontSize: '9px',
    color: '#6b7a8d',
    letterSpacing: '0.5px',
  },
  stat: {
    textTransform: 'uppercase' as const,
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#00ff41',
    animation: 'pulse-dot 2s ease-in-out infinite',
  },
  logo: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#00e5ff',
    letterSpacing: '3px',
  },
  classificationBanner: {
    fontSize: '8px',
    color: '#6b7a8d',
    letterSpacing: '1.5px',
    marginTop: '2px',
  },
  metaRow: {
    fontSize: '8px',
    color: '#4a5568',
  },
  metaText: {},
  modeLabel: {
    fontSize: '11px',
    color: '#00e5ff',
    fontWeight: 600,
    marginTop: '4px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    pointerEvents: 'auto',
    paddingTop: '4px',
  },
  modeToggle: {
    display: 'flex',
    border: '1px solid rgba(0, 229, 255, 0.3)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  modeButton: {
    padding: '6px 20px',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    background: 'transparent',
    color: '#6b7a8d',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '1px',
    transition: 'all 150ms ease',
  },
  modeButtonActive: {
    background: 'rgba(0, 229, 255, 0.15)',
    color: '#00e5ff',
    boxShadow: '0 0 10px rgba(0, 229, 255, 0.2)',
  },
  right: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    pointerEvents: 'auto',
  },
  shaderLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#00e5ff',
    letterSpacing: '2px',
  },
  recRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '9px',
    color: '#6b7a8d',
  },
  recDot: {
    color: '#ff3d3d',
    animation: 'blink 1.5s ease-in-out infinite',
    fontSize: '10px',
  },
  recText: {
    letterSpacing: '0.5px',
  },
};
