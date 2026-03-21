import { StateCreator } from 'zustand';

export interface PlaybackSlice {
  isPlaying: boolean;
  currentTime: Date;
  startTime: Date;
  endTime: Date;
  playbackSpeed: number;
  play: () => void;
  pause: () => void;
  seek: (time: Date) => void;
  setSpeed: (speed: number) => void;
}

export const createPlaybackSlice: StateCreator<PlaybackSlice> = (set) => ({
  isPlaying: false,
  currentTime: new Date(),
  startTime: new Date('2024-10-01T00:00:00Z'),
  endTime: new Date('2024-10-02T00:00:00Z'),
  playbackSpeed: 1,
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  seek: (time) => set({ currentTime: time }),
  setSpeed: (speed) => set({ playbackSpeed: speed }),
});
