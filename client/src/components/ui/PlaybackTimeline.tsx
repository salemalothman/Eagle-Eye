import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';

const SPEEDS = [1, 5, 10, 50, 100];

// Event ticks for the timeline - matches SEED_EVENTS from EventCardLayer
const EVENT_TICKS: { time: string; color: string; label: string }[] = [
  { time: '2024-10-01T02:15:00Z', color: '#00e5ff', label: 'MISSILE LAUNCH' },
  { time: '2024-10-01T02:20:00Z', color: '#ffb300', label: 'AIRSPACE CLOSED' },
  { time: '2024-10-01T02:25:00Z', color: '#00e5ff', label: 'GPS JAMMING' },
  { time: '2024-10-01T02:30:00Z', color: '#ce93d8', label: 'INTERNET BLACKOUT' },
  { time: '2024-10-01T02:45:00Z', color: '#00e5ff', label: 'IRON DOME' },
  { time: '2024-10-01T03:00:00Z', color: '#ffb300', label: 'USS EISENHOWER' },
  { time: '2024-10-01T03:15:00Z', color: '#ce93d8', label: 'CABLE ANOMALY' },
  { time: '2024-10-01T04:30:00Z', color: '#ff3d3d', label: 'IDF STRIKES' },
];

export function PlaybackTimeline() {
  const appMode = useStore((s) => s.appMode);
  const isPlaying = useStore((s) => s.isPlaying);
  const currentTime = useStore((s) => s.currentTime);
  const startTime = useStore((s) => s.startTime);
  const endTime = useStore((s) => s.endTime);
  const playbackSpeed = useStore((s) => s.playbackSpeed);
  const play = useStore((s) => s.play);
  const pause = useStore((s) => s.pause);
  const seek = useStore((s) => s.seek);
  const setSpeed = useStore((s) => s.setSpeed);

  const animRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  // Advance time when playing
  useEffect(() => {
    if (appMode !== 'playback' || !isPlaying) return;

    lastTickRef.current = performance.now();
    const tick = () => {
      const now = performance.now();
      const deltaMs = (now - lastTickRef.current) * playbackSpeed;
      lastTickRef.current = now;

      const newTime = new Date(currentTime.getTime() + deltaMs);
      if (newTime >= endTime) {
        pause();
        seek(endTime);
      } else {
        seek(newTime);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [appMode, isPlaying, playbackSpeed, currentTime, endTime, pause, seek]);

  const totalRange = endTime.getTime() - startTime.getTime();
  const progress = totalRange > 0 ? (currentTime.getTime() - startTime.getTime()) / totalRange : 0;

  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = new Date(startTime.getTime() + pct * totalRange);
      seek(newTime);
    },
    [startTime, totalRange, seek]
  );

  if (appMode !== 'playback') return null;

  return (
    <div style={styles.container}>
      {/* UTC timestamp */}
      <div style={styles.timestamp}>
        {currentTime.toISOString().replace('T', ' ').slice(0, 23)} UTC
      </div>

      {/* Scrubber bar */}
      <div style={styles.scrubberContainer} onClick={handleScrub}>
        <div style={styles.scrubberTrack}>
          {/* Event tick marks */}
          {EVENT_TICKS.map((tick) => {
            const tickTime = new Date(tick.time).getTime();
            const tickPct = totalRange > 0
              ? ((tickTime - startTime.getTime()) / totalRange) * 100
              : 0;
            if (tickPct < 0 || tickPct > 100) return null;
            return (
              <div
                key={tick.time}
                title={tick.label}
                style={{
                  position: 'absolute',
                  left: `${tickPct}%`,
                  top: '-3px',
                  width: '2px',
                  height: '10px',
                  backgroundColor: tick.color,
                  borderRadius: '1px',
                  opacity: 0.8,
                  zIndex: 1,
                  pointerEvents: 'none',
                  boxShadow: `0 0 4px ${tick.color}60`,
                }}
              />
            );
          })}
          <div style={{ ...styles.scrubberProgress, width: `${progress * 100}%` }} />
          <div style={{ ...styles.scrubberHead, left: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Controls row */}
      <div style={styles.controls}>
        <div style={styles.controlsLeft}>
          <button style={styles.controlBtn} onClick={isPlaying ? pause : play}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <span style={styles.timeRange}>
            {startTime.toISOString().slice(5, 16)} — {endTime.toISOString().slice(5, 16)}
          </span>
        </div>

        <div style={styles.speedButtons}>
          {SPEEDS.map((s) => (
            <button
              key={s}
              style={{
                ...styles.speedBtn,
                ...(playbackSpeed === s ? styles.speedBtnActive : {}),
              }}
              onClick={() => setSpeed(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 60,
    left: 180,
    right: 180,
    background: 'var(--color-bg-panel)',
    backdropFilter: 'var(--panel-blur)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--panel-radius)',
    padding: '10px 16px',
    pointerEvents: 'auto',
    zIndex: 100,
  },
  timestamp: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#00e5ff',
    textAlign: 'center' as const,
    marginBottom: '8px',
    letterSpacing: '1px',
  },
  scrubberContainer: {
    cursor: 'pointer',
    padding: '4px 0',
  },
  scrubberTrack: {
    position: 'relative',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
  },
  scrubberProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #00e5ff, #00ff41)',
    borderRadius: '2px',
  },
  scrubberHead: {
    position: 'absolute',
    top: '-4px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#00e5ff',
    border: '2px solid #0a0e17',
    transform: 'translateX(-50%)',
    boxShadow: '0 0 6px rgba(0, 229, 255, 0.5)',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
  },
  controlsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  controlBtn: {
    background: 'rgba(0, 229, 255, 0.1)',
    border: '1px solid rgba(0, 229, 255, 0.3)',
    color: '#00e5ff',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
  },
  timeRange: {
    fontSize: '9px',
    color: '#6b7a8d',
    letterSpacing: '0.5px',
  },
  speedButtons: {
    display: 'flex',
    gap: '4px',
  },
  speedBtn: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#6b7a8d',
    padding: '3px 8px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '9px',
    fontFamily: 'var(--font-mono)',
    transition: 'all 150ms ease',
  },
  speedBtnActive: {
    background: 'rgba(0, 229, 255, 0.15)',
    borderColor: 'rgba(0, 229, 255, 0.4)',
    color: '#00e5ff',
  },
};
