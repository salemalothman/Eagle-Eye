import { useWebSocket } from '../../hooks/useWebSocket';

export function HudOverlay() {
  const { connected } = useWebSocket();

  return (
    <div style={styles.container}>
      {/* Connection status */}
      <div style={styles.connectionStatus}>
        <div
          style={{
            ...styles.statusDot,
            backgroundColor: connected ? '#00ff41' : '#ff3d3d',
            boxShadow: connected
              ? '0 0 6px rgba(0, 255, 65, 0.5)'
              : '0 0 6px rgba(255, 61, 61, 0.5)',
          }}
        />
        <span style={styles.statusText}>
          {connected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 100,
    left: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    pointerEvents: 'none',
    zIndex: 100,
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    background: 'var(--color-bg-panel)',
    backdropFilter: 'var(--panel-blur)',
    border: '1px solid var(--color-border)',
    borderRadius: '2px',
    pointerEvents: 'auto',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    transition: 'all 300ms ease',
  },
  statusText: {
    fontSize: '8px',
    fontWeight: 600,
    color: '#6b7a8d',
    letterSpacing: '1px',
  },
};
