import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';

export type PersonDetailTabId = 'overview' | 'autefs' | 'forestGuides';

export interface PersonDetailTabPagination {
  page: number;
  pageSize: number;
}

export interface PersonDetailStateData {
  activeTab: PersonDetailTabId;
  tabs: Record<PersonDetailTabId, PersonDetailTabPagination>;
}

export interface PersonDetailStateActions {
  setActiveTab: (tab: PersonDetailTabId) => void;
  setTabPage: (tab: PersonDetailTabId, page: number) => void;
  setTabPageSize: (tab: PersonDetailTabId, pageSize: number) => void;
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
  reset: () => set({ activeTab: 'overview', tabs: createInitialTabs() }),
}));

export const usePersonDetailState = (): PersonDetailStateData =>
  usePersonDetailStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      tabs: s.tabs,
    })),
  );

export const usePersonDetailActions = (): PersonDetailStateActions =>
  usePersonDetailStore(
    useShallow((s) => ({
      setActiveTab: s.setActiveTab,
      setTabPage: s.setTabPage,
      setTabPageSize: s.setTabPageSize,
      reset: s.reset,
    })),
  );
