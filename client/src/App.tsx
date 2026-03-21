import { useEffect } from 'react';
import { CesiumGlobe } from './components/CesiumViewer';
import { TopBar } from './components/ui/TopBar';
import { LeftSidebar } from './components/ui/LeftSidebar';
import { RightSidebar } from './components/ui/RightSidebar';
import { BottomBar } from './components/ui/BottomBar';
import { DetailPanel } from './components/ui/DetailPanel';
import { HudOverlay } from './components/ui/HudOverlay';
import { PlaybackTimeline } from './components/ui/PlaybackTimeline';
import { Minimap } from './components/ui/Minimap';
import { PlaybackLayerPills } from './components/ui/PlaybackLayerPills';
import { CameraInfo } from './components/ui/CameraInfo';
import { useCesiumViewer } from './hooks/useCesiumViewer';
import { useStore } from './store';
import { LOCATION_PRESETS, flyToPreset, flyToGlobeView } from './utils/cesiumHelpers';
import type { LayerId } from './types/layers';

export default function App() {
  return (
    <div style={styles.app}>
      <CesiumGlobe>
        <KeyboardShortcuts />
      </CesiumGlobe>

      {/* HUD Overlay UI */}
      <TopBar />
      <LeftSidebar />
      <RightSidebar />
      <BottomBar />
      <DetailPanel />
      <PlaybackTimeline />
      <PlaybackLayerPills />
      <CameraInfo />
      <Minimap />
      <HudOverlay />
    </div>
  );
}

function KeyboardShortcuts() {
  const viewer = useCesiumViewer();
  const clearSelection = useStore((s) => s.clearSelection);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const appMode = useStore((s) => s.appMode);
  const isPlaying = useStore((s) => s.isPlaying);
  const play = useStore((s) => s.play);
  const pause = useStore((s) => s.pause);

  useEffect(() => {
    if (!viewer) return;

    const handler = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      const presetKeys = ['q', 'w', 'e', 'r', 't'];
      const idx = presetKeys.indexOf(e.key.toLowerCase());
      if (idx !== -1 && idx < LOCATION_PRESETS.length) {
        flyToPreset(viewer, LOCATION_PRESETS[idx]);
        return;
      }

      // 1-9 toggle data layers
      const layerKeys: LayerId[] = [
        'commercialFlights', 'militaryFlights', 'satellites',
        'earthquakes', 'maritime', 'gpsJamming',
        'internetOutages', 'airspaceClosures', 'cctvMesh',
      ];
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        toggleLayer(layerKeys[num - 1]);
        return;
      }
      if (e.key === '0') {
        toggleLayer('events');
        return;
      }

      switch (e.key) {
        case 'Escape':
          clearSelection();
          break;
        case 'g':
          flyToGlobeView(viewer);
          break;
        case ' ':
          if (appMode === 'playback') {
            e.preventDefault();
            isPlaying ? pause() : play();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [viewer, clearSelection, toggleLayer, appMode, isPlaying, play, pause]);

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: 'var(--color-bg)',
  },
};
