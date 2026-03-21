import { createContext, useContext } from 'react';
import type { Viewer } from 'cesium';

export const CesiumViewerContext = createContext<Viewer | null>(null);

export function useCesiumViewer(): Viewer | null {
  return useContext(CesiumViewerContext);
}
