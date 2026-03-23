import { useState } from 'react';
import { useStore } from '../../store';
import type { ShaderMode } from '../../types/layers';

const PRESETS: { mode: ShaderMode; label: string; icon: string; iconStyle?: React.CSSProperties }[] = [
  { mode: 'normal', label: 'Normal', icon: '\u25CB' },
  { mode: 'crt', label: 'CRT', icon: '\u229E' },
  { mode: 'nvg', label: 'NVG', icon: '\uD83C\uDF19', iconStyle: { color: '#ffb300' } },
  { mode: 'flir', label: 'FLIR', icon: '\uD83C\uDF21\uFE0F' },
  { mode: 'anime', label: 'Anime', icon: '\u2726' },
  { mode: 'noir', label: 'Noir', icon: '\u25D0' },
  { mode: 'snow', label: 'Snow', icon: '\u2744' },
  { mode: 'ai', label: 'AI', icon: '\u2B23' },
];

export function StylePresetsPanel() {
  const shaderMode = useStore((s) => s.shaderMode);
  const setShaderMode = useStore((s) => s.setShaderMode);
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div style={styles.collapsedBar}>
        <span style={styles.headerLabel}>STYLE PRESETS</span>
        <button
          style={styles.collapseBtn}
          onClick={() => setCollapsed(false)}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header + collapse button row */}
      <div style={styles.topRow}>
        <div style={styles.headerBlock}>
          <div style={styles.headerLabel}>STYLE PRESETS</div>
          <div style={styles.headerSub}>STYLE PRESETS &mdash; Visual Modes</div>
        </div>
        <button
          style={styles.collapseBtn}
          onClick={() => setCollapsed(true)}
        >
          &minus;
        </button>
      </div>

      {/* Preset cards row */}
      <div style={styles.scrollOuter}>
        <div style={styles.scrollInner}>
          {PRESETS.map(({ mode, label, icon, iconStyle }) => {
            const isActive = shaderMode === mode;
            return (
              <div
                key={mode}
                style={{
                  ...styles.card,
                  border: isActive
                    ? '2px solid #00e5ff'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: isActive
                    ? '0 0 8px rgba(0, 229, 255, 0.3)'
                    : 'none',
                }}
                onClick={() => setShaderMode(mode)}
              >
                <span style={{ ...styles.cardIcon, ...iconStyle }}>{icon}</span>
                <span style={styles.cardLabel}>{label}</span>
              </div>
            );
          })}
        </div>
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
    height: 120,
    background: 'rgba(10, 14, 23, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(0, 229, 255, 0.12)',
    zIndex: 100,
    pointerEvents: 'auto',
    fontFamily: "'JetBrains Mono', monospace",
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '10px 16px 8px 16px',
    boxSizing: 'border-box' as const,
  },
  collapsedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    background: 'rgba(10, 14, 23, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(0, 229, 255, 0.12)',
    zIndex: 100,
    pointerEvents: 'auto',
    fontFamily: "'JetBrains Mono', monospace",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    boxSizing: 'border-box' as const,
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexShrink: 0,
  },
  headerBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: '#6b7a8d',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  headerSub: {
    fontSize: 8,
    color: '#4a5568',
    letterSpacing: 1,
  },
  collapseBtn: {
    background: 'none',
    border: '1px solid rgba(0, 229, 255, 0.25)',
    borderRadius: 3,
    color: '#00e5ff',
    fontSize: 14,
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    fontFamily: "'JetBrains Mono', monospace",
    flexShrink: 0,
  },
  scrollOuter: {
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  scrollInner: {
    display: 'flex',
    gap: 12,
    overflowX: 'auto' as const,
    overflowY: 'hidden' as const,
    paddingBottom: 12,
    /* hide scrollbar cross-browser via clip */
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
  },
  card: {
    width: 90,
    minWidth: 90,
    height: 80,
    background: 'rgba(30, 36, 50, 0.8)',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
    flexShrink: 0,
  },
  cardIcon: {
    fontSize: 26,
    lineHeight: 1,
    color: '#c0cad8',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#ffffff',
    textAlign: 'center' as const,
    lineHeight: 1,
  },
};
