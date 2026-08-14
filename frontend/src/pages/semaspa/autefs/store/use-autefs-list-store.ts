import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

export interface AutefsQuickFilters {
  searchQuery: string;
  city: string;
  state: string;
  issueYear: string;
}

export interface AutefsAdvancedFilters {
  issueMonth: string;
  processNumber: string;
  issuedFrom: string;
  issuedTo: string;
  taxId: string;
  personName: string;
  isOverExtracted: boolean;
  hasForestGuide: boolean | null;
  movedRatioMin: string;
  movedRatioMax: string;
  speciesProductId: string;
  scientificName: string;
  commonName: string;
}

export interface AutefsListStateData {
  currentPage: number;
  pageSize: number;
  quickFilters: AutefsQuickFilters;
  advancedInputs: AutefsAdvancedFilters;
  advancedApplied: AutefsAdvancedFilters;
  advancedOpen: boolean;
}

export interface AutefsListStateActions {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setQuickFilters: (filters: Partial<AutefsQuickFilters>) => void;
  setAdvancedInputs: (filters: Partial<AutefsAdvancedFilters>) => void;
  applyAdvancedFilters: () => void;
  setOverExtractedFilter: (value: boolean) => void;
  setAdvancedOpen: (open: boolean) => void;
  clearFilters: () => void;
  reset: () => void;
}

export type AutefsListState = AutefsListStateData & AutefsListStateActions;

const initialQuickFilters: AutefsQuickFilters = {
  searchQuery: '',
  city: '',
  state: '',
  issueYear: '',
};

const initialAdvancedFilters: AutefsAdvancedFilters = {
  issueMonth: '',
  processNumber: '',
  issuedFrom: '',
  issuedTo: '',
  taxId: '',
  personName: '',
  isOverExtracted: false,
  hasForestGuide: null,
  movedRatioMin: '',
  movedRatioMax: '',
  speciesProductId: '',
  scientificName: '',
  commonName: '',
};

const initialState: AutefsListStateData = {
  currentPage: 1,
  pageSize: 20,
  quickFilters: initialQuickFilters,
  advancedInputs: initialAdvancedFilters,
  advancedApplied: initialAdvancedFilters,
  advancedOpen: false,
};

export const useAutefsListStore = create<AutefsListState>((set, get) => ({
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
    set({
      advancedApplied: { ...advancedInputs },
      currentPage: 1,
    });
  },

  setOverExtractedFilter: (value) =>
    set((state) => ({
      advancedInputs: { ...state.advancedInputs, isOverExtracted: value },
      advancedApplied: { ...state.advancedApplied, isOverExtracted: value },
      currentPage: 1,
    })),

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

export const useAutefsListState = (): AutefsListStateData =>
  useAutefsListStore(
    useShallow((s) => ({
      currentPage: s.currentPage,
      pageSize: s.pageSize,
      quickFilters: s.quickFilters,
      advancedInputs: s.advancedInputs,
      advancedApplied: s.advancedApplied,
      advancedOpen: s.advancedOpen,
    })),
  );

export const useAutefsListActions = (): AutefsListStateActions =>
  useAutefsListStore(
    useShallow((s) => ({
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      setQuickFilters: s.setQuickFilters,
      setAdvancedInputs: s.setAdvancedInputs,
      applyAdvancedFilters: s.applyAdvancedFilters,
      setOverExtractedFilter: s.setOverExtractedFilter,
      setAdvancedOpen: s.setAdvancedOpen,
      clearFilters: s.clearFilters,
      reset: s.reset,
    })),
  );
