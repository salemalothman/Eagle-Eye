import { StateCreator } from 'zustand';

export interface CameraStation {
  id: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  heading: number;
  fov: number;
  streamUrl: string;
  snapshotUrl: string;
  operator: string;
}

export interface CctvCalibration {
  heading: number;
  pitch: number;
  fov: number;
  range: number;
  height: number;
  north: number;
  east: number;
}

export interface CctvSlice {
  cctvEnabled: boolean;
  selectedCameraIdx: number;
  cameras: CameraStation[];
  coverageOn: boolean;
  projectionOn: boolean;
  autoHop: boolean;
  alignDrape: boolean;
  calibration: CctvCalibration;
  snapshotStatus: 'OK' | 'LOADING' | 'ERROR';
  setCctvEnabled: (on: boolean) => void;
  setSelectedCamera: (idx: number) => void;
  nextCamera: () => void;
  prevCamera: () => void;
  nearestCamera: (lat: number, lon: number) => void;
  setCoverageOn: (on: boolean) => void;
  setProjectionOn: (on: boolean) => void;
  setAutoHop: (on: boolean) => void;
  setAlignDrape: (on: boolean) => void;
  setCalibration: (cal: Partial<CctvCalibration>) => void;
  resetCalibration: () => void;
  setSnapshotStatus: (status: 'OK' | 'LOADING' | 'ERROR') => void;
}

const DEFAULT_CALIBRATION: CctvCalibration = {
  heading: 0,
  pitch: 0,
  fov: 0,
  range: 100,
  height: 0,
  north: 0,
  east: 0,
};

const SEED_CAMERAS: CameraStation[] = [
  { id: 'atx-001', name: 'SAN JACINTO BLVD / 7TH ST', city: 'Austin', lat: 30.2700, lon: -97.7396, heading: 135, fov: 56, streamUrl: '', snapshotUrl: '', operator: 'Austin Transportation & Public Works' },
  { id: 'atx-002', name: 'CONGRESS AVE / 6TH ST', city: 'Austin', lat: 30.2676, lon: -97.7431, heading: 180, fov: 60, streamUrl: '', snapshotUrl: '', operator: 'Austin Transportation & Public Works' },
  { id: 'atx-003', name: 'I-35 @ 51ST ST', city: 'Austin', lat: 30.315, lon: -97.723, heading: 0, fov: 70, streamUrl: '', snapshotUrl: '', operator: 'TxDOT' },
  { id: 'atx-004', name: 'MOPAC @ ENFIELD RD', city: 'Austin', lat: 30.285, lon: -97.776, heading: 45, fov: 65, streamUrl: '', snapshotUrl: '', operator: 'TxDOT' },
  { id: 'atx-005', name: 'US-183 @ BURNET RD', city: 'Austin', lat: 30.372, lon: -97.724, heading: 90, fov: 60, streamUrl: '', snapshotUrl: '', operator: 'TxDOT' },
  { id: 'atx-006', name: 'I-35 @ RIVERSIDE DR', city: 'Austin', lat: 30.252, lon: -97.733, heading: 270, fov: 55, streamUrl: '', snapshotUrl: '', operator: 'TxDOT' },
  { id: 'dxb-001', name: 'SHEIKH ZAYED ROAD', city: 'Dubai', lat: 25.198, lon: 55.272, heading: 45, fov: 50, streamUrl: '', snapshotUrl: '', operator: 'RTA Dubai' },
  { id: 'dxb-002', name: 'DUBAI MARINA', city: 'Dubai', lat: 25.080, lon: 55.139, heading: 180, fov: 60, streamUrl: '', snapshotUrl: '', operator: 'RTA Dubai' },
  { id: 'ldn-001', name: 'TRAFALGAR SQUARE', city: 'London', lat: 51.508, lon: -0.128, heading: 135, fov: 70, streamUrl: '', snapshotUrl: '', operator: 'TfL' },
  { id: 'ldn-002', name: 'TOWER BRIDGE', city: 'London', lat: 51.505, lon: -0.075, heading: 90, fov: 65, streamUrl: '', snapshotUrl: '', operator: 'TfL' },
  { id: 'tky-001', name: 'SHIBUYA CROSSING', city: 'Tokyo', lat: 35.659, lon: 139.700, heading: 0, fov: 75, streamUrl: '', snapshotUrl: '', operator: 'TMG' },
  { id: 'nyc-001', name: 'TIMES SQUARE', city: 'New York', lat: 40.758, lon: -73.985, heading: 180, fov: 60, streamUrl: '', snapshotUrl: '', operator: 'NYC DOT' },
];

export const createCctvSlice: StateCreator<CctvSlice> = (set, get) => ({
  cctvEnabled: false,
  selectedCameraIdx: 0,
  cameras: SEED_CAMERAS,
  coverageOn: false,
  projectionOn: false,
  autoHop: false,
  alignDrape: false,
  calibration: { ...DEFAULT_CALIBRATION },
  snapshotStatus: 'OK',
  setCctvEnabled: (on) => set({ cctvEnabled: on }),
  setSelectedCamera: (idx) => set({ selectedCameraIdx: idx, calibration: { ...DEFAULT_CALIBRATION } }),
  nextCamera: () => {
    const { cameras, selectedCameraIdx } = get();
    set({ selectedCameraIdx: (selectedCameraIdx + 1) % cameras.length, calibration: { ...DEFAULT_CALIBRATION } });
  },
  prevCamera: () => {
    const { cameras, selectedCameraIdx } = get();
    set({ selectedCameraIdx: (selectedCameraIdx - 1 + cameras.length) % cameras.length, calibration: { ...DEFAULT_CALIBRATION } });
  },
  nearestCamera: (lat, lon) => {
    const { cameras } = get();
    let minDist = Infinity;
    let minIdx = 0;
    cameras.forEach((cam, i) => {
      const d = Math.sqrt((cam.lat - lat) ** 2 + (cam.lon - lon) ** 2);
      if (d < minDist) { minDist = d; minIdx = i; }
    });
    set({ selectedCameraIdx: minIdx, calibration: { ...DEFAULT_CALIBRATION } });
  },
  setCoverageOn: (on) => set({ coverageOn: on }),
  setProjectionOn: (on) => set({ projectionOn: on }),
  setAutoHop: (on) => set({ autoHop: on }),
  setAlignDrape: (on) => set({ alignDrape: on }),
  setCalibration: (cal) => set((s) => ({ calibration: { ...s.calibration, ...cal } })),
  resetCalibration: () => set({ calibration: { ...DEFAULT_CALIBRATION } }),
  setSnapshotStatus: (status) => set({ snapshotStatus: status }),
});
