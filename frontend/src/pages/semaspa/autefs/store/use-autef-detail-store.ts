import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';

import type { AutefVolumeBalanceSortField } from '@/types/semaspa';

export type AutefDetailTabId =
  | 'overview'
  | 'species'
  | 'forestGuides'
  | 'harvestUnits'
  | 'roles';

export interface AutefDetailTabPagination {
  page: number;
  pageSize: number;
}

export interface AutefDetailStateData {
  activeTab: AutefDetailTabId;
  tabs: Record<AutefDetailTabId, AutefDetailTabPagination>;
  selectedForestGuideId: number | null;
  forestGuideSheetOpen: boolean;
  selectedSpeciesProductId: string | null;
  creditSortBy: AutefVolumeBalanceSortField;
  creditSortOrder: 'ASC' | 'DESC';
}

export interface AutefDetailStateActions {
  setActiveTab: (tab: AutefDetailTabId) => void;
  setTabPage: (tab: AutefDetailTabId, page: number) => void;
  setTabPageSize: (tab: AutefDetailTabId, pageSize: number) => void;
  openForestGuideSheet: (id: number) => void;
  closeForestGuideSheet: () => void;
  setSelectedSpeciesProductId: (id: string | null) => void;
  setCreditSort: (sortBy: AutefVolumeBalanceSortField, sortOrder: 'ASC' | 'DESC') => void;
  reset: () => void;
}

export type AutefDetailState = AutefDetailStateData & AutefDetailStateActions;

const DEFAULT_TAB_PAGINATION: AutefDetailTabPagination = {
  page: 1,
  pageSize: 20,
};

const TAB_IDS: AutefDetailTabId[] = [
  'overview',
  'species',
  'forestGuides',
  'harvestUnits',
  'roles',
];

function createInitialTabs(): Record<AutefDetailTabId, AutefDetailTabPagination> {
  return TAB_IDS.reduce(
    (acc, id) => {
      acc[id] = {
        ...DEFAULT_TAB_PAGINATION,
        pageSize: id === 'species' || id === 'roles' ? 100 : DEFAULT_TAB_PAGINATION.pageSize,
      };
      return acc;
    },
    {} as Record<AutefDetailTabId, AutefDetailTabPagination>,
  );
}

const initialState: AutefDetailStateData = {
  activeTab: 'overview',
  tabs: createInitialTabs(),
  selectedForestGuideId: null,
  forestGuideSheetOpen: false,
  selectedSpeciesProductId: null,
  creditSortBy: 'excessVolume',
  creditSortOrder: 'DESC',
};

export const useAutefDetailStore = create<AutefDetailState>((set) => ({
  ...initialState,
  tabs: createInitialTabs(),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setTabPage: (tab, page) =>
    set((state) => ({
      tabs: {
        ...state.tabs,
        [tab]: { ...state.tabs[tab], page },
      },
    })),

  setTabPageSize: (tab, pageSize) =>
    set((state) => ({
      tabs: {
        ...state.tabs,
        [tab]: { page: 1, pageSize },
      },
    })),

  openForestGuideSheet: (id) =>
    set({ selectedForestGuideId: id, forestGuideSheetOpen: true }),

  closeForestGuideSheet: () =>
    set({ forestGuideSheetOpen: false, selectedForestGuideId: null }),

  setSelectedSpeciesProductId: (id) => set({ selectedSpeciesProductId: id }),

  setCreditSort: (sortBy, sortOrder) =>
    set((state) => ({
      creditSortBy: sortBy,
      creditSortOrder: sortOrder,
      tabs: {
        ...state.tabs,
        species: { ...state.tabs.species, page: 1 },
      },
    })),

  reset: () =>
    set({
      activeTab: 'overview',
      tabs: createInitialTabs(),
      selectedForestGuideId: null,
      forestGuideSheetOpen: false,
      selectedSpeciesProductId: null,
      creditSortBy: 'excessVolume',
      creditSortOrder: 'DESC',
    }),
}));

export const useAutefDetailState = (): AutefDetailStateData =>
  useAutefDetailStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      tabs: s.tabs,
      selectedForestGuideId: s.selectedForestGuideId,
      forestGuideSheetOpen: s.forestGuideSheetOpen,
      selectedSpeciesProductId: s.selectedSpeciesProductId,
      creditSortBy: s.creditSortBy,
      creditSortOrder: s.creditSortOrder,
    })),
  );

export const useAutefDetailActions = (): AutefDetailStateActions =>
  useAutefDetailStore(
    useShallow((s) => ({
      setActiveTab: s.setActiveTab,
      setTabPage: s.setTabPage,
      setTabPageSize: s.setTabPageSize,
      openForestGuideSheet: s.openForestGuideSheet,
      closeForestGuideSheet: s.closeForestGuideSheet,
      setSelectedSpeciesProductId: s.setSelectedSpeciesProductId,
      setCreditSort: s.setCreditSort,
      reset: s.reset,
    })),
  );
