import { useState } from 'react';
import { useStore } from '../../store';
import type { LayerId } from '../../types/layers';

const LAYER_ORDER: LayerId[] = [
  'commercialFlights',
  'militaryFlights',
  'earthquakes',
  'satellites',
  'streetTraffic',
  'weatherRadar',
  'cctvMesh',
  'bikeshare',
];

function formatRelativeTime(ts: number | null): string {
  if (ts == null) return 'never';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function LeftSidebar() {
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const leftSidebarOpen = useStore((s) => s.leftSidebarOpen);
  const [collapsed, setCollapsed] = useState(false);

  if (!leftSidebarOpen) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerText}>DATA LAYERS</span>
        <button
          style={styles.collapseBtn}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? '+' : '\u2212'}
        </button>
      </div>

      {!collapsed && (
        <div style={styles.layerList}>
          {LAYER_ORDER.map((id) => {
            const layer = layers[id];
            if (!layer) return null;
            const isOn = layer.visible;

            return (
              <div key={id} style={styles.layerRow}>
                {/* Icon */}
                <span style={styles.icon}>{layer.icon}</span>

                {/* Name + source */}
                <div style={styles.info}>
                  <span style={styles.layerName}>{layer.label}</span>
                  <span style={styles.layerSource}>
                    {layer.source} &middot; {formatRelativeTime(layer.lastUpdate)}
                  </span>
                </div>

                {/* Entity count */}
                {layer.entityCount > 0 && (
                  <span style={styles.entityCount}>
                    {formatCount(layer.entityCount)}
                  </span>
                )}

                {/* ON/OFF pill toggle */}
                <button
                  style={{
                    ...styles.pill,
                    borderColor: isOn ? '#00e5ff' : '#4a5568',
                    color: isOn ? '#00e5ff' : '#6b7a8d',
                  }}
                  onClick={() => toggleLayer(id)}
                >
                  {isOn ? 'ON' : 'OFF'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 120,
    left: 12,
    width: 280,
    background: 'rgba(10, 14, 23, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(0, 229, 255, 0.12)',
    borderRadius: 6,
    padding: '12px',
    pointerEvents: 'auto',
    zIndex: 100,
    fontFamily: "'JetBrains Mono', monospace",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1px solid rgba(0, 229, 255, 0.12)',
  },
  headerText: {
    fontSize: 9,
    fontWeight: 600,
    color: '#6b7a8d',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  collapseBtn: {
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
  layerList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  layerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 4px',
    borderRadius: 3,
    cursor: 'default',
  },
  icon: {
    fontSize: 14,
    flexShrink: 0,
    width: 20,
    textAlign: 'center' as const,
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  layerName: {
    fontSize: 11,
    fontWeight: 600,
    color: '#e0e6ed',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  layerSource: {
    fontSize: 8,
    fontWeight: 400,
    color: '#6b7a8d',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  entityCount: {
    fontSize: 10,
    fontWeight: 600,
    color: '#ffb300',
    flexShrink: 0,
    letterSpacing: 0.5,
  },
  pill: {
    background: 'transparent',
    border: '1px solid',
    borderRadius: 10,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1,
    padding: '2px 8px',
    cursor: 'pointer',
    flexShrink: 0,
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: 'uppercase' as const,
  },
};
