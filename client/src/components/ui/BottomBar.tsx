import { useStore } from '../../store';
import type { ShaderMode } from '../../types/layers';
import { LOCATION_PRESETS, flyToPreset } from '../../utils/cesiumHelpers';
import { useCesiumViewer } from '../../hooks/useCesiumViewer';

const SHADER_MODES: { id: ShaderMode; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'crt', label: 'CRT' },
  { id: 'nvg', label: 'NVG' },
  { id: 'flir', label: 'FLIR' },
  { id: 'anime', label: 'Anime' },
  { id: 'pixar', label: 'Pixar' },
  { id: 'bloom', label: 'Bloom' },
  { id: 'nil', label: 'Nil' },
];

export function BottomBar() {
  const shaderMode = useStore((s) => s.shaderMode);
  const setShaderMode = useStore((s) => s.setShaderMode);
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

      {/* Shader mode selector */}
      <div style={styles.shaderRow}>
        {SHADER_MODES.map((mode) => (
          <button
            key={mode.id}
            style={{
              ...styles.shaderButton,
              ...(shaderMode === mode.id ? styles.shaderButtonActive : {}),
            }}
            onClick={() => setShaderMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 16px 12px',
    pointerEvents: 'none',
    zIndex: 100,
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
  shaderRow: {
    display: 'flex',
    gap: '2px',
    pointerEvents: 'auto',
    background: 'rgba(10, 14, 23, 0.7)',
    backdropFilter: 'blur(8px)',
    borderRadius: '3px',
    padding: '2px',
    border: '1px solid var(--color-border)',
  },
  shaderButton: {
    padding: '5px 14px',
    fontSize: '10px',
    fontWeight: 500,
    fontFamily: 'var(--font-mono)',
    background: 'transparent',
    color: '#6b7a8d',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 150ms ease',
  },
  shaderButtonActive: {
    background: 'rgba(0, 229, 255, 0.15)',
    color: '#00e5ff',
    boxShadow: '0 2px 0 #00e5ff',
  },
};
