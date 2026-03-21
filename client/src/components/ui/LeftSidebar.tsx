import { useStore } from '../../store';
import type { LayerId } from '../../types/layers';

const LAYER_ORDER: LayerId[] = [
  'commercialFlights',
  'militaryFlights',
  'earthquakes',
  'satellites',
  'maritime',
  'gpsJamming',
  'internetOutages',
  'airspaceClosures',
  'cctvMesh',
];

export function LeftSidebar() {
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const leftSidebarOpen = useStore((s) => s.leftSidebarOpen);

  if (!leftSidebarOpen) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerText}>DATA LAYERS</span>
      </div>

      <div style={styles.layerList}>
        {LAYER_ORDER.map((id) => {
          const layer = layers[id];
          return (
            <div
              key={id}
              style={styles.layerRow}
              onClick={() => toggleLayer(id)}
            >
              <div style={styles.toggleWrapper}>
                <div
                  style={{
                    ...styles.toggle,
                    backgroundColor: layer.visible
                      ? layer.color
                      : 'transparent',
                    borderColor: layer.visible
                      ? layer.color
                      : '#4a5568',
                  }}
                >
                  {layer.visible && <span style={styles.checkmark}>✓</span>}
                </div>
              </div>
              <span
                style={{
                  ...styles.layerLabel,
                  color: layer.visible ? '#e0e6ed' : '#6b7a8d',
                }}
              >
                {layer.icon} {layer.label}
              </span>
              {layer.entityCount > 0 && (
                <span
                  style={{
                    ...styles.badge,
                    color: layer.color,
                    borderColor: layer.color + '40',
                  }}
                >
                  {layer.entityCount > 1000
                    ? `${(layer.entityCount / 1000).toFixed(1)}k`
                    : layer.entityCount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 120,
    left: 12,
    width: 200,
    background: 'var(--color-bg-panel)',
    backdropFilter: 'var(--panel-blur)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--panel-radius)',
    padding: '12px',
    pointerEvents: 'auto',
    zIndex: 100,
    transition: 'transform var(--transition-normal)',
  },
  header: {
    marginBottom: '10px',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--color-border)',
  },
  headerText: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#6b7a8d',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
  },
  layerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  layerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '5px 4px',
    borderRadius: '2px',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)',
  },
  toggleWrapper: {},
  toggle: {
    width: 14,
    height: 14,
    borderRadius: '2px',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)',
    flexShrink: 0,
  },
  checkmark: {
    fontSize: '9px',
    color: '#0a0e17',
    fontWeight: 700,
  },
  layerLabel: {
    fontSize: '11px',
    fontWeight: 400,
    flex: 1,
    transition: 'color var(--transition-fast)',
    whiteSpace: 'nowrap' as const,
  },
  badge: {
    fontSize: '9px',
    fontWeight: 500,
    padding: '1px 5px',
    border: '1px solid',
    borderRadius: '8px',
    letterSpacing: '0.3px',
  },
};
