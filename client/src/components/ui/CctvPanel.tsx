import { useState, type CSSProperties } from 'react';
import { useStore } from '../../store';
import type { CctvCalibration } from '../../store/slices/cctvSlice';

const CYAN = '#00e5ff';
const GREEN = '#00ff41';
const AMBER = '#ffab00';
const BG = 'rgba(10, 14, 23, 0.92)';
const BORDER = 'rgba(0, 229, 255, 0.2)';
const BTN_BG = 'rgba(10, 14, 23, 0.85)';
const BTN_BORDER = 'rgba(255,255,255,0.12)';

const SLIDERS: { key: keyof CctvCalibration; label: string; min: number; max: number; unit: string }[] = [
  { key: 'heading', label: 'HEADING', min: -180, max: 180, unit: '\u00b0' },
  { key: 'pitch', label: 'PITCH', min: -90, max: 90, unit: '\u00b0' },
  { key: 'fov', label: 'FOV', min: 0, max: 120, unit: '\u00b0' },
  { key: 'range', label: 'RANGE', min: 0, max: 100, unit: '%' },
  { key: 'height', label: 'HEIGHT', min: -50, max: 50, unit: 'm' },
  { key: 'north', label: 'NORTH', min: -50, max: 50, unit: 'm' },
  { key: 'east', label: 'EAST', min: -50, max: 50, unit: 'm' },
];

export function CctvPanel() {
  const visible = useStore((s) => s.layers.cctvMesh.visible);
  const cctvEnabled = useStore((s) => s.cctvEnabled);
  const selectedCameraIdx = useStore((s) => s.selectedCameraIdx);
  const cameras = useStore((s) => s.cameras);
  const coverageOn = useStore((s) => s.coverageOn);
  const projectionOn = useStore((s) => s.projectionOn);
  const autoHop = useStore((s) => s.autoHop);
  const alignDrape = useStore((s) => s.alignDrape);
  const calibration = useStore((s) => s.calibration);
  const snapshotStatus = useStore((s) => s.snapshotStatus);

  const setCctvEnabled = useStore((s) => s.setCctvEnabled);
  const setSelectedCamera = useStore((s) => s.setSelectedCamera);
  const nextCamera = useStore((s) => s.nextCamera);
  const prevCamera = useStore((s) => s.prevCamera);
  const setCoverageOn = useStore((s) => s.setCoverageOn);
  const setProjectionOn = useStore((s) => s.setProjectionOn);
  const setAutoHop = useStore((s) => s.setAutoHop);
  const setAlignDrape = useStore((s) => s.setAlignDrape);
  const setCalibration = useStore((s) => s.setCalibration);
  const resetCalibration = useStore((s) => s.resetCalibration);

  const [collapsed, setCollapsed] = useState(false);

  if (!visible) return null;

  const cam = cameras[selectedCameraIdx] ?? cameras[0];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.row}>
        <span style={styles.headerLabel}>CCTV MESH</span>
        <button style={styles.collapseBtn} onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? '+' : '\u2212'}
        </button>
      </div>

      {collapsed ? null : (
        <>
          {/* Toggle row */}
          <div style={styles.row}>
            <button
              style={{ ...styles.btn, ...(cctvEnabled ? styles.btnActiveCyan : {}) }}
              onClick={() => setCctvEnabled(!cctvEnabled)}
            >
              CCTV {cctvEnabled ? 'ON' : 'OFF'}
            </button>
            <button style={styles.btn} onClick={() => {}}>
              NEAREST
            </button>
          </div>

          {/* Navigation row */}
          <div style={styles.row}>
            <button style={styles.btn} onClick={prevCamera}>PREV</button>
            <select
              style={styles.dropdown}
              value={selectedCameraIdx}
              onChange={(e) => setSelectedCamera(Number(e.target.value))}
            >
              {cameras.map((c, i) => (
                <option key={c.id} value={i}>
                  {c.city} &middot; {c.name.length > 16 ? c.name.slice(0, 16) : c.name}
                </option>
              ))}
            </select>
            <button style={styles.btn} onClick={nextCamera}>NEXT</button>
          </div>

          {/* Control row 1 */}
          <div style={styles.row}>
            <button style={styles.btn}>FOCUS</button>
            <button
              style={{ ...styles.btn, ...(coverageOn ? styles.btnActiveGreen : {}) }}
              onClick={() => setCoverageOn(!coverageOn)}
            >
              COVERAGE {coverageOn ? 'ON' : 'OFF'}
            </button>
            <button
              style={{ ...styles.btn, ...(autoHop ? styles.btnActiveCyan : {}) }}
              onClick={() => setAutoHop(!autoHop)}
            >
              AUTO HOP {autoHop ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Control row 2 */}
          <div style={styles.row}>
            <button
              style={{ ...styles.btn, ...(projectionOn ? styles.btnActiveCyan : {}) }}
              onClick={() => setProjectionOn(!projectionOn)}
            >
              PROJECTION {projectionOn ? 'ON' : 'OFF'}
            </button>
            <button style={styles.btn}>AUTO CAL</button>
            <button
              style={{ ...styles.btn, ...(alignDrape ? styles.btnActiveGreen : {}) }}
              onClick={() => setAlignDrape(!alignDrape)}
            >
              ALIGN &middot; DRAPE
            </button>
          </div>

          {/* Calibration section */}
          <div style={styles.calHeader}>CALIBRATION</div>
          {SLIDERS.map((sl) => (
            <div key={sl.key} style={styles.sliderRow}>
              <span style={styles.sliderLabel}>{sl.label}</span>
              <input
                type="range"
                min={sl.min}
                max={sl.max}
                step={sl.key === 'fov' || sl.key === 'range' ? 1 : 0.5}
                value={calibration[sl.key]}
                onChange={(e) => setCalibration({ [sl.key]: Number(e.target.value) })}
                style={styles.slider}
              />
              <span style={styles.sliderValue}>
                {calibration[sl.key]}{sl.unit}
              </span>
            </div>
          ))}

          {/* Action row */}
          <div style={styles.row}>
            <button style={styles.btn}>SAVE CAL</button>
            <button style={styles.btn} onClick={resetCalibration}>RESET CAL</button>
          </div>

          {/* Snapshot preview */}
          <div style={styles.snapshotArea}>
            <div style={styles.snapshotPlaceholder}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.5 }}>
                <rect x="2" y="5" width="14" height="10" rx="1" stroke="#80cbc4" strokeWidth="1.5" />
                <path d="M16 8L21 5.5V15.5L16 13" stroke="#80cbc4" strokeWidth="1.5" />
              </svg>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, marginTop: 4 }}>
                NO FEED
              </span>
            </div>
          </div>

          {/* Status badge */}
          <div style={styles.row}>
            <span style={styles.statusBadge}>
              SNAPSHOT &middot; {snapshotStatus}
            </span>
          </div>

          {/* Metadata readout */}
          <div style={styles.metadata}>
            <div>
              {cam.city} &middot; HDG {cam.heading}&deg; &middot; FOV {cam.fov}&deg; &middot; RANGE {calibration.range}m &middot; DRAPE HIGH &middot; {cam.operator}
            </div>
            <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.5)' }}>SCENE SUMMARY</div>
            <div style={{ marginTop: 2 }}>
              {cam.city} CCTV &middot; {cam.name} &middot; HDG {cam.heading}&deg; &middot; FOV {cam.fov}&deg; &middot; COVERAGE 0.02km&sup2;
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Styles ──────────────────────────────────────────────── */

const styles: Record<string, CSSProperties> = {
  container: {
    position: 'absolute',
    top: 80,
    left: 12,
    width: 320,
    background: BG,
    border: `1px solid ${BORDER}`,
    borderRadius: 4,
    padding: 8,
    zIndex: 110,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontFamily: 'JetBrains Mono, monospace',
    color: '#e0e0e0',
    fontSize: 10,
    userSelect: 'none',
  },
  row: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  headerLabel: {
    flex: 1,
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: 1.5,
    color: CYAN,
    textTransform: 'uppercase' as const,
  },
  collapseBtn: {
    background: 'transparent',
    border: `1px solid ${BTN_BORDER}`,
    color: '#aaa',
    fontSize: 12,
    width: 22,
    height: 22,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    fontFamily: 'JetBrains Mono, monospace',
  },
  btn: {
    flex: 1,
    background: BTN_BG,
    border: `1px solid ${BTN_BORDER}`,
    color: '#ccc',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 9,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    padding: '4px 6px',
    cursor: 'pointer',
    borderRadius: 2,
    whiteSpace: 'nowrap' as const,
    textAlign: 'center' as const,
  },
  btnActiveCyan: {
    borderColor: CYAN,
    color: CYAN,
    background: 'rgba(0, 229, 255, 0.08)',
  },
  btnActiveGreen: {
    borderColor: GREEN,
    color: GREEN,
    background: 'rgba(0, 255, 65, 0.08)',
  },
  dropdown: {
    flex: 2,
    background: BTN_BG,
    border: `1px solid ${BTN_BORDER}`,
    color: '#ccc',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 9,
    padding: '4px 4px',
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
  },
  calHeader: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase' as const,
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 6,
    marginTop: 2,
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  sliderLabel: {
    width: 52,
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    flexShrink: 0,
  },
  slider: {
    flex: 1,
    height: 4,
    accentColor: CYAN,
    cursor: 'pointer',
  },
  sliderValue: {
    width: 42,
    textAlign: 'right' as const,
    fontSize: 9,
    color: CYAN,
    flexShrink: 0,
  },
  snapshotArea: {
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 6,
    marginTop: 2,
  },
  snapshotPlaceholder: {
    width: '100%',
    aspectRatio: '16/9',
    background: 'rgba(0,0,0,0.4)',
    border: `1px solid ${BTN_BORDER}`,
    borderRadius: 2,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    fontSize: 9,
    fontFamily: 'JetBrains Mono, monospace',
    color: GREEN,
    letterSpacing: 0.8,
    background: 'rgba(0, 255, 65, 0.06)',
    border: `1px solid rgba(0, 255, 65, 0.25)`,
    padding: '2px 8px',
    borderRadius: 2,
  },
  metadata: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 8,
    color: AMBER,
    letterSpacing: 0.4,
    lineHeight: '1.5',
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 6,
    marginTop: 2,
    wordBreak: 'break-word' as const,
  },
};
