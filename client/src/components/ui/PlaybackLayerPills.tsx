import { useStore } from '../../store';
import type { LayerId } from '../../types/layers';

const PILL_LAYERS: { id: LayerId; label: string }[] = [
  { id: 'commercialFlights', label: 'Commercial Flights' },
  { id: 'militaryFlights', label: 'Military Flights' },
  { id: 'gpsJamming', label: 'GPS Jamming' },
  { id: 'satellites', label: 'Imaging Satellites' },
  { id: 'maritime', label: 'Maritime Traffic' },
  { id: 'airspaceClosures', label: 'Airspace Closures' },
  { id: 'internetOutages', label: 'Internet Blackout' },
  { id: 'earthquakes', label: 'Earthquakes' },
  { id: 'cctvMesh', label: 'CCTV Mesh' },
  { id: 'events', label: 'Events' },
];

export function PlaybackLayerPills() {
  const appMode = useStore((s) => s.appMode);
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);

  if (appMode !== 'playback') return null;

  return (
    <div style={styles.container}>
      <div style={styles.pillRow}>
        {PILL_LAYERS.map((pl) => {
          const layer = layers[pl.id];
          return (
            <button
              key={pl.id}
              style={{
                ...styles.pill,
                ...(layer.visible ? {
                  background: layer.color + '25',
                  borderColor: layer.color + '60',
                  color: layer.color,
                } : {}),
              }}
              onClick={() => toggleLayer(pl.id)}
            >
              <span
                style={{
                  ...styles.pillDot,
                  backgroundColor: layer.visible ? layer.color : '#4a5568',
                }}
              />
              {pl.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 190,
    left: 180,
    right: 180,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 99,
  },
  pillRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    fontSize: '8px',
    fontWeight: 500,
    fontFamily: 'var(--font-mono)',
    background: 'rgba(10, 14, 23, 0.6)',
    color: '#6b7a8d',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'all 150ms ease',
    whiteSpace: 'nowrap' as const,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    flexShrink: 0,
  },
};
