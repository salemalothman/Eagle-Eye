import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useCesiumViewer } from '../../hooks/useCesiumViewer';
import { useStore } from '../../store';
import type { FlightEntity, SatelliteEntity, EarthquakeEntity } from '../../types/entities';

export function DetailPanel() {
  const viewer = useCesiumViewer();
  const entity = useStore((s) => s.selectedEntity);
  const entityType = useStore((s) => s.selectedEntityType);
  const isOpen = useStore((s) => s.detailPanelOpen);
  const clearSelection = useStore((s) => s.clearSelection);

  if (!isOpen || !entity) return null;

  const handleTrack = () => {
    if (!viewer) return;
    const lat = entity.lat;
    const lon = entity.lon;
    const alt = entity.altitude || 0;
    if (lat == null || lon == null) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, Math.max(alt * 3, 50_000)),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 1.5,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerType}>{entityType?.toUpperCase()}</span>
        <button style={styles.closeButton} onClick={clearSelection}>
          ✕
        </button>
      </div>

      <div style={styles.body}>
        {entityType === 'flight' && <FlightDetail flight={entity} />}
        {entityType === 'satellite' && <SatelliteDetail sat={entity} />}
        {entityType === 'earthquake' && <EarthquakeDetail quake={entity} />}
        {entityType === 'cctv' && <CctvDetail cam={entity} />}
        {entityType === 'vessel' && <GenericDetail data={entity} />}
      </div>

      <div style={styles.footer}>
        <button style={styles.trackButton} onClick={handleTrack}>TRACK</button>
      </div>
    </div>
  );
}

function FlightDetail({ flight }: { flight: FlightEntity }) {
  return (
    <div style={styles.fieldList}>
      <Field label="CALLSIGN" value={flight.callsign || 'N/A'} highlight />
      <Field label="ICAO24" value={flight.id} />
      <Field label="COUNTRY" value={flight.country} />
      <Field label="ALTITUDE" value={`${Math.round(flight.altitude)}m`} />
      <Field label="VELOCITY" value={`${Math.round(flight.velocity)}m/s`} />
      <Field label="HEADING" value={`${Math.round(flight.heading)}°`} />
      <Field label="V/RATE" value={`${Math.round(flight.verticalRate)}m/s`} />
      <Field label="SQUAWK" value={flight.squawk || 'N/A'} />
      <Field label="ON GROUND" value={flight.onGround ? 'YES' : 'NO'} />
      <Field label="LAT" value={flight.lat.toFixed(4)} />
      <Field label="LON" value={flight.lon.toFixed(4)} />
    </div>
  );
}

function SatelliteDetail({ sat }: { sat: SatelliteEntity }) {
  return (
    <div style={styles.fieldList}>
      <Field label="NAME" value={sat.name} highlight />
      <Field label="NORAD ID" value={String(sat.noradId)} />
      <Field label="CATEGORY" value={sat.category.toUpperCase()} />
      <Field label="COUNTRY" value={sat.country || 'N/A'} />
      <Field label="ALTITUDE" value={`${Math.round(sat.altitude / 1000)} km`} />
      <Field label="LAT" value={sat.lat.toFixed(4)} />
      <Field label="LON" value={sat.lon.toFixed(4)} />
    </div>
  );
}

function EarthquakeDetail({ quake }: { quake: EarthquakeEntity }) {
  return (
    <div style={styles.fieldList}>
      <Field label="MAGNITUDE" value={`M${quake.magnitude.toFixed(1)}`} highlight />
      <Field label="LOCATION" value={quake.place} />
      <Field label="DEPTH" value={`${quake.depth.toFixed(1)} km`} />
      <Field label="LAT" value={quake.lat.toFixed(4)} />
      <Field label="LON" value={quake.lon.toFixed(4)} />
      <Field label="TIME" value={new Date(quake.timestamp).toISOString().slice(0, 19)} />
    </div>
  );
}

function CctvDetail({ cam }: { cam: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cam.streamUrl) return;

    let destroyed = false;
    import('hls.js').then(({ default: Hls }) => {
      if (destroyed) return;
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(cam.streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = cam.streamUrl;
        video.play().catch(() => {});
      }
    });

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [cam.streamUrl]);

  return (
    <div style={styles.fieldList}>
      <Field label="CAMERA" value={cam.name} highlight />
      <Field label="ID" value={cam.id} />
      <Field label="LAT" value={String(cam.lat)} />
      <Field label="LON" value={String(cam.lon)} />
      <Field label="STATUS" value="ONLINE" />

      {/* Video feed */}
      <div style={cctvStyles.videoContainer}>
        {cam.streamUrl ? (
          <video
            ref={videoRef}
            style={cctvStyles.video}
            muted
            playsInline
            autoPlay
          />
        ) : (
          <div style={cctvStyles.noFeed}>
            <div style={cctvStyles.noFeedIcon}>📹</div>
            <span style={cctvStyles.noFeedText}>NO FEED AVAILABLE</span>
            <span style={cctvStyles.noFeedSub}>Configure streamUrl to enable</span>
          </div>
        )}
        {/* Scanline overlay */}
        <div style={cctvStyles.scanlines} />
        {/* Timestamp overlay */}
        <div style={cctvStyles.timestamp}>
          {new Date().toISOString().slice(0, 19)} UTC
        </div>
        {/* REC indicator */}
        <div style={cctvStyles.recIndicator}>
          <span style={cctvStyles.recDot}>●</span> REC
        </div>
      </div>
    </div>
  );
}

const cctvStyles: Record<string, React.CSSProperties> = {
  videoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16/9',
    background: '#000',
    borderRadius: '2px',
    overflow: 'hidden',
    border: '1px solid rgba(128, 203, 196, 0.3)',
    marginTop: '8px',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  noFeed: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '4px',
  },
  noFeedIcon: {
    fontSize: '24px',
    opacity: 0.5,
  },
  noFeedText: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#6b7a8d',
    letterSpacing: '1px',
  },
  noFeedSub: {
    fontSize: '7px',
    color: '#4a5568',
    letterSpacing: '0.5px',
  },
  scanlines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
    pointerEvents: 'none',
  },
  timestamp: {
    position: 'absolute',
    bottom: '4px',
    left: '6px',
    fontSize: '7px',
    fontFamily: 'var(--font-mono)',
    color: 'rgba(255, 255, 255, 0.7)',
    textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
  },
  recIndicator: {
    position: 'absolute',
    top: '4px',
    right: '6px',
    fontSize: '8px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    color: '#ff3d3d',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  recDot: {
    fontSize: '10px',
    animation: 'pulse 1.5s infinite',
  },
};

function GenericDetail({ data }: { data: any }) {
  return (
    <div style={styles.fieldList}>
      {Object.entries(data).map(([key, value]) => {
        if (key === 'trail' || typeof value === 'object') return null;
        return <Field key={key} label={key.toUpperCase()} value={String(value)} />;
      })}
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <span style={{ ...styles.fieldValue, ...(highlight ? styles.fieldHighlight : {}) }}>
        {value}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 80,
    right: 180,
    width: 220,
    maxHeight: 'calc(100vh - 160px)',
    background: 'var(--color-bg-panel)',
    backdropFilter: 'var(--panel-blur)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--panel-radius)',
    overflow: 'hidden',
    pointerEvents: 'auto',
    zIndex: 110,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderBottom: '1px solid var(--color-border)',
    background: 'rgba(0, 229, 255, 0.05)',
  },
  headerType: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#00e5ff',
    letterSpacing: '1.5px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#6b7a8d',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    padding: '2px 4px',
  },
  body: {
    padding: '8px 12px',
    overflowY: 'auto' as const,
    flex: 1,
  },
  fieldList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  field: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2px 0',
  },
  fieldLabel: {
    fontSize: '8px',
    fontWeight: 500,
    color: '#6b7a8d',
    letterSpacing: '1px',
  },
  fieldValue: {
    fontSize: '10px',
    color: '#e0e6ed',
    fontWeight: 400,
  },
  fieldHighlight: {
    color: '#00e5ff',
    fontWeight: 600,
    fontSize: '12px',
  },
  footer: {
    padding: '8px 12px',
    borderTop: '1px solid var(--color-border)',
  },
  trackButton: {
    width: '100%',
    padding: '6px',
    fontSize: '10px',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    background: 'rgba(0, 229, 255, 0.1)',
    color: '#00e5ff',
    border: '1px solid rgba(0, 229, 255, 0.3)',
    borderRadius: '2px',
    cursor: 'pointer',
    letterSpacing: '1.5px',
    transition: 'all 150ms ease',
  },
};
