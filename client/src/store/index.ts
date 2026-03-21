import { create } from 'zustand';
import { createViewerSlice, type ViewerSlice } from './slices/viewerSlice';
import { createLayerSlice, type LayerSlice } from './slices/layerSlice';
import { createUiSlice, type UiSlice } from './slices/uiSlice';
import { createEntitySlice, type EntitySlice } from './slices/entitySlice';
import { createPlaybackSlice, type PlaybackSlice } from './slices/playbackSlice';

export type StoreState = ViewerSlice & LayerSlice & UiSlice & EntitySlice & PlaybackSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createViewerSlice(...a),
  ...createLayerSlice(...a),
  ...createUiSlice(...a),
  ...createEntitySlice(...a),
  ...createPlaybackSlice(...a),
}));
