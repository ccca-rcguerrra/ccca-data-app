import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export interface ForestGuidesQuickFilters {
  searchQuery: string;
  status: string;
  type: string;
}

export interface ForestGuidesAdvancedFilters {
  issuedFrom: string;
  issuedTo: string;
  autefId: string;
  taxId: string;
  personName: string;
  plate: string;
  scientificName: string;
  commonName: string;
}

export interface ForestGuidesListStateData {
  currentPage: number;
  pageSize: number;
  quickFilters: ForestGuidesQuickFilters;
  advancedInputs: ForestGuidesAdvancedFilters;
  advancedApplied: ForestGuidesAdvancedFilters;
  advancedOpen: boolean;
}

export interface ForestGuidesListStateActions {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setQuickFilters: (filters: Partial<ForestGuidesQuickFilters>) => void;
  setAdvancedInputs: (filters: Partial<ForestGuidesAdvancedFilters>) => void;
  applyAdvancedFilters: () => void;
  hydratePlateFilter: (plate: string) => void;
  setAdvancedOpen: (open: boolean) => void;
  clearFilters: () => void;
  reset: () => void;
}

export type ForestGuidesListState = ForestGuidesListStateData & ForestGuidesListStateActions;

const initialQuickFilters: ForestGuidesQuickFilters = {
  searchQuery: '',
  status: '',
  type: '',
};

const initialAdvancedFilters: ForestGuidesAdvancedFilters = {
  issuedFrom: '',
  issuedTo: '',
  autefId: '',
  taxId: '',
  personName: '',
  plate: '',
  scientificName: '',
  commonName: '',
};

const initialState: ForestGuidesListStateData = {
  currentPage: 1,
  pageSize: 20,
  quickFilters: initialQuickFilters,
  advancedInputs: initialAdvancedFilters,
  advancedApplied: initialAdvancedFilters,
  advancedOpen: false,
};

export const useForestGuidesListStore = create<ForestGuidesListState>((set, get) => ({
  ...initialState,

  setPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
  setQuickFilters: (filters) =>
    set((state) => ({
      quickFilters: { ...state.quickFilters, ...filters },
      currentPage: 1,
    })),
  setAdvancedInputs: (filters) =>
    set((state) => ({
      advancedInputs: { ...state.advancedInputs, ...filters },
    })),
  applyAdvancedFilters: () => {
    const { advancedInputs } = get();
    set({ advancedApplied: { ...advancedInputs }, currentPage: 1 });
  },
  hydratePlateFilter: (plate) => {
    const next = { ...initialAdvancedFilters, plate };
    set({
      advancedInputs: next,
      advancedApplied: next,
      advancedOpen: true,
      currentPage: 1,
    });
  },
  setAdvancedOpen: (open) => set({ advancedOpen: open }),
  clearFilters: () =>
    set({
      quickFilters: initialQuickFilters,
      advancedInputs: initialAdvancedFilters,
      advancedApplied: initialAdvancedFilters,
      currentPage: 1,
    }),
  reset: () => set({ ...initialState }),
}));

export const useForestGuidesListState = (): ForestGuidesListStateData =>
  useForestGuidesListStore(
    useShallow((s) => ({
      currentPage: s.currentPage,
      pageSize: s.pageSize,
      quickFilters: s.quickFilters,
      advancedInputs: s.advancedInputs,
      advancedApplied: s.advancedApplied,
      advancedOpen: s.advancedOpen,
    })),
  );

export const useForestGuidesListActions = (): ForestGuidesListStateActions =>
  useForestGuidesListStore(
    useShallow((s) => ({
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      setQuickFilters: s.setQuickFilters,
      setAdvancedInputs: s.setAdvancedInputs,
      applyAdvancedFilters: s.applyAdvancedFilters,
      hydratePlateFilter: s.hydratePlateFilter,
      setAdvancedOpen: s.setAdvancedOpen,
      clearFilters: s.clearFilters,
      reset: s.reset,
    })),
  );
