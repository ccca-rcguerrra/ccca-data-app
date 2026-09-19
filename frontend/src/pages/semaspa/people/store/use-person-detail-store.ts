import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';

import type {
  PersonAutefOccurrenceFlag,
  PersonGfOccurrenceFlag,
} from '@/types/semaspa';

export type PersonDetailTabId = 'overview' | 'autefs' | 'forestGuides';

export interface PersonDetailTabPagination {
  page: number;
  pageSize: number;
}

export interface PersonDetailStateData {
  activeTab: PersonDetailTabId;
  tabs: Record<PersonDetailTabId, PersonDetailTabPagination>;
  autefFlag: PersonAutefOccurrenceFlag | null;
  forestGuideFlag: PersonGfOccurrenceFlag | null;
}

export interface PersonDetailStateActions {
  setActiveTab: (tab: PersonDetailTabId) => void;
  setTabPage: (tab: PersonDetailTabId, page: number) => void;
  setTabPageSize: (tab: PersonDetailTabId, pageSize: number) => void;
  openAutefsWithFlag: (flag: PersonAutefOccurrenceFlag) => void;
  openForestGuidesWithFlag: (flag: PersonGfOccurrenceFlag) => void;
  clearAutefFlag: () => void;
  clearForestGuideFlag: () => void;
  reset: () => void;
}

export type PersonDetailState = PersonDetailStateData & PersonDetailStateActions;

const DEFAULT_TAB: PersonDetailTabPagination = { page: 1, pageSize: 20 };
const TAB_IDS: PersonDetailTabId[] = ['overview', 'autefs', 'forestGuides'];

function createInitialTabs(): Record<PersonDetailTabId, PersonDetailTabPagination> {
  return TAB_IDS.reduce(
    (acc, id) => {
      acc[id] = { ...DEFAULT_TAB };
      return acc;
    },
    {} as Record<PersonDetailTabId, PersonDetailTabPagination>,
  );
}

const initialState: PersonDetailStateData = {
  activeTab: 'overview',
  tabs: createInitialTabs(),
  autefFlag: null,
  forestGuideFlag: null,
};

export const usePersonDetailStore = create<PersonDetailState>((set) => ({
  ...initialState,
  tabs: createInitialTabs(),
  setActiveTab: (activeTab) => set({ activeTab }),
  setTabPage: (tab, page) =>
    set((state) => ({
      tabs: { ...state.tabs, [tab]: { ...state.tabs[tab], page } },
    })),
  setTabPageSize: (tab, pageSize) =>
    set((state) => ({
      tabs: { ...state.tabs, [tab]: { page: 1, pageSize } },
    })),
  openAutefsWithFlag: (flag) =>
    set((state) => ({
      activeTab: 'autefs',
      autefFlag: flag,
      tabs: { ...state.tabs, autefs: { ...state.tabs.autefs, page: 1 } },
    })),
  openForestGuidesWithFlag: (flag) =>
    set((state) => ({
      activeTab: 'forestGuides',
      forestGuideFlag: flag,
      tabs: {
        ...state.tabs,
        forestGuides: { ...state.tabs.forestGuides, page: 1 },
      },
    })),
  clearAutefFlag: () =>
    set((state) => ({
      autefFlag: null,
      tabs: { ...state.tabs, autefs: { ...state.tabs.autefs, page: 1 } },
    })),
  clearForestGuideFlag: () =>
    set((state) => ({
      forestGuideFlag: null,
      tabs: {
        ...state.tabs,
        forestGuides: { ...state.tabs.forestGuides, page: 1 },
      },
    })),
  reset: () =>
    set({
      activeTab: 'overview',
      tabs: createInitialTabs(),
      autefFlag: null,
      forestGuideFlag: null,
    }),
}));

export const usePersonDetailState = (): PersonDetailStateData =>
  usePersonDetailStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      tabs: s.tabs,
      autefFlag: s.autefFlag,
      forestGuideFlag: s.forestGuideFlag,
    })),
  );

export const usePersonDetailActions = (): PersonDetailStateActions =>
  usePersonDetailStore(
    useShallow((s) => ({
      setActiveTab: s.setActiveTab,
      setTabPage: s.setTabPage,
      setTabPageSize: s.setTabPageSize,
      openAutefsWithFlag: s.openAutefsWithFlag,
      openForestGuidesWithFlag: s.openForestGuidesWithFlag,
      clearAutefFlag: s.clearAutefFlag,
      clearForestGuideFlag: s.clearForestGuideFlag,
      reset: s.reset,
    })),
  );
