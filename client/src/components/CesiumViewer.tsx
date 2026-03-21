import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import { CesiumViewerContext } from '../hooks/useCesiumViewer';
import { useStore } from '../store';
import { ShaderManager } from './shaders/ShaderManager';
import { CommercialFlightsLayer } from './layers/CommercialFlightsLayer';
import { SatelliteLayer } from './layers/SatelliteLayer';
import { MilitaryFlightsLayer } from './layers/MilitaryFlightsLayer';
import { EarthquakeLayer } from './layers/EarthquakeLayer';
import { GpsJammingLayer } from './layers/GpsJammingLayer';
import { InternetOutageLayer } from './layers/InternetOutageLayer';
import { AirspaceClosureLayer } from './layers/AirspaceClosureLayer';
import { MaritimeLayer } from './layers/MaritimeLayer';
import { EventCardLayer } from './layers/EventCardLayer';
import { CctvLayer } from './layers/CctvLayer';

interface Props {
  children?: React.ReactNode;
}

export function CesiumGlobe({ children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);
  const setFps = useStore((s) => s.setFps);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // Set Cesium Ion token if available
    const ionToken = (window as any).__CESIUM_ION_TOKEN__;
    if (ionToken) {
      Cesium.Ion.defaultAccessToken = ionToken;
    }

    const v = new Cesium.Viewer(containerRef.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      creditContainer: document.createElement('div'),
      msaaSamples: 4,
      useBrowserRecommendedResolution: true,
      requestRenderMode: false,
      baseLayer: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      showRenderLoopErrors: false,
    });

    // Deep navy space background + ocean base color for immediate visual feedback
    v.scene.backgroundColor = Cesium.Color.fromCssColorString('#0a0e17');
    v.scene.globe.baseColor = Cesium.Color.fromCssColorString('#1a2332');
    v.scene.globe.enableLighting = true;
    if (v.scene.skyAtmosphere) v.scene.skyAtmosphere.show = true;
    v.scene.fog.enabled = true;
    v.scene.globe.showGroundAtmosphere = true;

    // Load NaturalEarthII base imagery, then expose the viewer to React.
    // This ensures layers only mount once the globe has visible surface imagery.
    Cesium.TileMapServiceImageryProvider.fromUrl(
      Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
    ).then((provider) => {
      if (!v.isDestroyed()) {
        v.imageryLayers.addImageryProvider(provider);
      }
    }).catch(() => {
      // Local tilemap failed — fall back to OpenStreetMap
      if (!v.isDestroyed()) {
        v.imageryLayers.addImageryProvider(
          new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' })
        );
      }
    }).finally(() => {
      if (!v.isDestroyed()) {
        viewerRef.current = v;
        setViewer(v);
      }
    });

    // Recover from render errors silently
    v.scene.renderError.addEventListener((_scene: Cesium.Scene, error: Error) => {
      console.warn('[Cesium] Render error (auto-recovering):', error?.message);
      setTimeout(() => {
        try {
          if (!v.isDestroyed()) {
            v.useDefaultRenderLoop = true;
          }
        } catch { /* viewer destroyed */ }
      }, 300);
    });

    // Initial camera: Middle East overview
    v.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(45, 28, 8_000_000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-75),
        roll: 0,
      },
    });

    // Camera controls
    v.scene.screenSpaceCameraController.enableTilt = true;
    v.scene.screenSpaceCameraController.enableRotate = true;
    v.scene.screenSpaceCameraController.enableZoom = true;
    v.scene.screenSpaceCameraController.inertiaSpin = 0.9;
    v.scene.screenSpaceCameraController.inertiaTranslate = 0.9;
    v.scene.screenSpaceCameraController.inertiaZoom = 0.8;

    // FPS counter
    let frameCount = 0;
    let lastTime = performance.now();
    v.scene.postRender.addEventListener(() => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
    });

    return () => {
      v.destroy();
      viewerRef.current = null;
    };
  }, [setFps]);

  return (
    <CesiumViewerContext.Provider value={viewer}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
        }}
      />
      {viewer && (
        <>
          <LayerErrorBoundary><ShaderManager viewer={viewer} /></LayerErrorBoundary>
          <LayerErrorBoundary><CommercialFlightsLayer viewer={viewer} /></LayerErrorBoundary>
          <LayerErrorBoundary><MilitaryFlightsLayer viewer={viewer} /></LayerErrorBoundary>
          <LayerErrorBoundary><SatelliteLayer viewer={viewer} /></LayerErrorBoundary>
          <LayerErrorBoundary><EarthquakeLayer viewer={viewer} /></LayerErrorBoundary>
          <LayerErrorBoundary><GpsJammingLayer viewer={viewer} /></LayerErrorBoundary>
          <LayerErrorBoundary><InternetOutageLayer viewer={viewer} /></LayerErrorBoundary>
          <LayerErrorBoundary><AirspaceClosureLayer viewer={viewer} /></LayerErrorBoundary>
          <LayerErrorBoundary><MaritimeLayer viewer={viewer} /></LayerErrorBoundary>
          <LayerErrorBoundary><EventCardLayer viewer={viewer} /></LayerErrorBoundary>
          <LayerErrorBoundary><CctvLayer viewer={viewer} /></LayerErrorBoundary>
          {children}
        </>
      )}
    </CesiumViewerContext.Provider>
  );
}

// Error boundary to prevent individual layer crashes from taking down the whole UI
class LayerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[LayerErrorBoundary] Layer crashed:', error.message);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

