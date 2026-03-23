import { LOCATION_PRESETS, flyToPreset } from '../../utils/cesiumHelpers';
import { useCesiumViewer } from '../../hooks/useCesiumViewer';

export function BottomBar() {
  const viewer = useCesiumViewer();

  const landmarks = LOCATION_PRESETS.filter((p) => p.category === 'landmark');
  const cities = LOCATION_PRESETS.filter((p) => p.category === 'city');

  return (
    <div style={styles.container}>
      {/* Location presets - landmarks */}
      <div style={styles.presetRow}>
        {landmarks.map((preset) => (
          <button
            key={preset.name}
            style={styles.presetButton}
            onClick={() => viewer && flyToPreset(viewer, preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Location presets - cities */}
      <div style={styles.presetRow}>
        {cities.map((preset) => (
          <button
            key={preset.name}
            style={{
              ...styles.presetButton,
              ...styles.cityButton,
            }}
            onClick={() => viewer && flyToPreset(viewer, preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 130,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 16px',
    pointerEvents: 'none',
    zIndex: 99,
  },
  presetRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  presetButton: {
    padding: '4px 10px',
    fontSize: '9px',
    fontWeight: 500,
    fontFamily: 'var(--font-mono)',
    background: 'rgba(10, 14, 23, 0.7)',
    color: '#00e5ff',
    border: '1px solid rgba(0, 229, 255, 0.2)',
    borderRadius: '2px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 150ms ease',
    backdropFilter: 'blur(4px)',
  },
  cityButton: {
    color: '#6b7a8d',
    borderColor: 'rgba(107, 122, 141, 0.2)',
  },
};
