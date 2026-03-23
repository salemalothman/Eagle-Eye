import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { useStore } from '../../store';
import { NVG_SHADER } from './nvgShader';
import { CRT_SHADER } from './crtShader';
import { FLIR_SHADER } from './flirShader';
import { ANIME_SHADER } from './animeShader';
import { PIXAR_SHADER } from './pixarShader';
import { BLOOM_SHADER } from './bloomShader';
import { NOIR_SHADER } from './noirShader';
import { SNOW_SHADER } from './snowShader';
import { AI_SHADER } from './aiShader';

interface Props {
  viewer: Cesium.Viewer;
}

export function ShaderManager({ viewer }: Props) {
  const shaderMode = useStore((s) => s.shaderMode);
  const sensitivity = useStore((s) => s.sensitivity);
  const stageRef = useRef<Cesium.PostProcessStage | null>(null);

  useEffect(() => {
    // Safely remove previous stage — guard against already-destroyed stages
    // (can happen when Cesium's render loop errors and auto-clears stages)
    const removeStageSafely = () => {
      const stage = stageRef.current;
      if (!stage) return;
      stageRef.current = null;
      try {
        if (!stage.isDestroyed()) {
          viewer.scene.postProcessStages.remove(stage);
          stage.destroy();
        }
      } catch {
        // Stage was already destroyed by Cesium render error recovery
      }
    };

    removeStageSafely();

    if (shaderMode === 'normal' || shaderMode === 'nil') return;
    if (viewer.isDestroyed()) return;

    let fragmentShader: string;
    const uniforms: Record<string, any> = {
      time: 0,
      intensity: sensitivity / 100,
      resolution: () => new Cesium.Cartesian2(
        viewer.scene.drawingBufferWidth,
        viewer.scene.drawingBufferHeight
      ),
    };

    switch (shaderMode) {
      case 'nvg':   fragmentShader = NVG_SHADER;   break;
      case 'crt':   fragmentShader = CRT_SHADER;   break;
      case 'flir':  fragmentShader = FLIR_SHADER;  break;
      case 'anime': fragmentShader = ANIME_SHADER; break;
      case 'pixar': fragmentShader = PIXAR_SHADER; break;
      case 'bloom': fragmentShader = BLOOM_SHADER; break;
      case 'noir':  fragmentShader = NOIR_SHADER;  break;
      case 'snow':  fragmentShader = SNOW_SHADER;  break;
      case 'ai':    fragmentShader = AI_SHADER;    break;
      default: return;
    }

    let stage: Cesium.PostProcessStage | null = null;
    try {
      stage = new Cesium.PostProcessStage({ fragmentShader, uniforms });
      viewer.scene.postProcessStages.add(stage);
      stageRef.current = stage;
    } catch {
      // PostProcessStages unavailable (render error state)
      return;
    }

    // Update time uniform each frame
    const removeListener = viewer.scene.postUpdate.addEventListener(() => {
      const s = stageRef.current;
      if (s && !s.isDestroyed()) {
        try { s.uniforms.time = performance.now() / 1000; } catch { /* ignore */ }
      }
    });

    return () => {
      removeListener();
      removeStageSafely();
    };
  }, [viewer, shaderMode, sensitivity]);

  return null;
}
