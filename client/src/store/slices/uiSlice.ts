import { StateCreator } from 'zustand';

export interface UiSlice {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  detailPanelOpen: boolean;
  selectedEntity: any | null;
  selectedEntityType: string | null;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  selectEntity: (entity: any, type: string) => void;
  clearSelection: () => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  detailPanelOpen: false,
  selectedEntity: null,
  selectedEntityType: null,
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  selectEntity: (entity, type) =>
    set({ selectedEntity: entity, selectedEntityType: type, detailPanelOpen: true }),
  clearSelection: () =>
    set({ selectedEntity: null, selectedEntityType: null, detailPanelOpen: false }),
});
