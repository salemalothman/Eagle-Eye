import { StateCreator } from 'zustand';

export interface UiSlice {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  detailPanelOpen: boolean;
  selectedEntity: any | null;
  selectedEntityType: string | null;
  hoveredEntity: any | null;
  hoveredEntityType: string | null;
  tooltipPosition: { x: number; y: number };
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  selectEntity: (entity: any, type: string) => void;
  clearSelection: () => void;
  setHoveredEntity: (entity: any | null, type: string | null, pos: { x: number; y: number }) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  detailPanelOpen: false,
  selectedEntity: null,
  selectedEntityType: null,
  hoveredEntity: null,
  hoveredEntityType: null,
  tooltipPosition: { x: 0, y: 0 },
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  selectEntity: (entity, type) =>
    set({ selectedEntity: entity, selectedEntityType: type, detailPanelOpen: true }),
  clearSelection: () =>
    set({ selectedEntity: null, selectedEntityType: null, detailPanelOpen: false }),
  setHoveredEntity: (entity, type, pos) =>
    set({ hoveredEntity: entity, hoveredEntityType: type, tooltipPosition: pos }),
});
