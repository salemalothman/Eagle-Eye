import { StateCreator } from 'zustand';
import type { ShaderMode, AppMode } from '../../types/layers';

export interface ViewerSlice {
  shaderMode: ShaderMode;
  appMode: AppMode;
  fps: number;
  sensitivity: number;
  pixelation: number;
  setShaderMode: (mode: ShaderMode) => void;
  setAppMode: (mode: AppMode) => void;
  setFps: (fps: number) => void;
  setSensitivity: (val: number) => void;
  setPixelation: (val: number) => void;
}

export const createViewerSlice: StateCreator<ViewerSlice> = (set) => ({
  shaderMode: 'normal',
  appMode: 'live',
  fps: 0,
  sensitivity: 50,
  pixelation: 0,
  setShaderMode: (mode) => set({ shaderMode: mode }),
  setAppMode: (mode) => set({ appMode: mode }),
  setFps: (fps) => set({ fps }),
  setSensitivity: (val) => set({ sensitivity: val }),
  setPixelation: (val) => set({ pixelation: val }),
});
