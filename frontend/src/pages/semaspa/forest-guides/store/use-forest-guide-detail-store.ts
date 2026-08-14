import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export type ForestGuideDetailTabId = 'species' | 'roles' | 'autefs';

export interface ForestGuideDetailTabPagination {
  page: number;
  pageSize: number;
}

export interface ForestGuideDetailStateData {
  activeTab: ForestGuideDetailTabId;
  tabs: Record<ForestGuideDetailTabId, ForestGuideDetailTabPagination>;
}

export interface ForestGuideDetailStateActions {
  setActiveTab: (tab: ForestGuideDetailTabId) => void;
  setTabPage: (tab: ForestGuideDetailTabId, page: number) => void;
  setTabPageSize: (tab: ForestGuideDetailTabId, pageSize: number) => void;
  reset: () => void;
}

export type ForestGuideDetailState = ForestGuideDetailStateData & ForestGuideDetailStateActions;

const DEFAULT_TAB: ForestGuideDetailTabPagination = { page: 1, pageSize: 20 };
const TAB_IDS: ForestGuideDetailTabId[] = ['species', 'roles', 'autefs'];

function createInitialTabs() {
  return TAB_IDS.reduce(
    (acc, id) => {
      acc[id] = { ...DEFAULT_TAB };
      return acc;
    },
    {} as Record<ForestGuideDetailTabId, ForestGuideDetailTabPagination>,
  );
}

export const useForestGuideDetailStore = create<ForestGuideDetailState>((set) => ({
  activeTab: 'species',
  tabs: createInitialTabs(),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTabPage: (tab, page) =>
    set((state) => ({
      tabs: { ...state.tabs, [tab]: { ...state.tabs[tab], page } },
    })),
  setTabPageSize: (tab, pageSize) =>
    set((state) => ({
      tabs: { ...state.tabs, [tab]: { page: 1, pageSize } },
    })),
  reset: () => set({ activeTab: 'species', tabs: createInitialTabs() }),
}));

export const useForestGuideDetailState = (): ForestGuideDetailStateData =>
  useForestGuideDetailStore(
    useShallow((s) => ({ activeTab: s.activeTab, tabs: s.tabs })),
  );

export const useForestGuideDetailActions = (): ForestGuideDetailStateActions =>
  useForestGuideDetailStore(
    useShallow((s) => ({
      setActiveTab: s.setActiveTab,
      setTabPage: s.setTabPage,
      setTabPageSize: s.setTabPageSize,
      reset: s.reset,
    })),
  );
