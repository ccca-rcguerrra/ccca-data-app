import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';

import type { CatalogIndicatorId } from '@/types/semaspa';

export interface IndicatorCenterFilters {
  city: string;
  state: string;
  issuedFrom: string;
  issuedTo: string;
  scientificName: string;
  commonName: string;
  speciesProductId: string;
  movedRatioMin: string;
  movedRatioMax: string;
  excessVolumeMin: string;
}

export interface IndicatorCenterStateData {
  selectedIndicatorId: CatalogIndicatorId | null;
  currentPage: number;
  pageSize: number;
  filters: IndicatorCenterFilters;
}

export interface IndicatorCenterStateActions {
  setSelectedIndicatorId: (id: CatalogIndicatorId | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: Partial<IndicatorCenterFilters>) => void;
  clearFilters: () => void;
  applySnapshot: (snapshot: {
    selectedIndicatorId: CatalogIndicatorId | null;
    filters: IndicatorCenterFilters;
  }) => void;
  reset: () => void;
}

export type IndicatorCenterState = IndicatorCenterStateData & IndicatorCenterStateActions;

export const initialIndicatorFilters: IndicatorCenterFilters = {
  city: '',
  state: '',
  issuedFrom: '',
  issuedTo: '',
  scientificName: '',
  commonName: '',
  speciesProductId: '',
  movedRatioMin: '',
  movedRatioMax: '',
  excessVolumeMin: '',
};

const initialState: IndicatorCenterStateData = {
  selectedIndicatorId: null,
  currentPage: 1,
  pageSize: 20,
  filters: initialIndicatorFilters,
};

export const useIndicatorsStore = create<IndicatorCenterState>((set) => ({
  ...initialState,

  setSelectedIndicatorId: (id) =>
    set({ selectedIndicatorId: id, currentPage: 1 }),

  setPage: (page) => set({ currentPage: page }),

  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      currentPage: 1,
    })),

  clearFilters: () =>
    set({
      filters: initialIndicatorFilters,
      currentPage: 1,
    }),

  applySnapshot: ({ selectedIndicatorId, filters }) =>
    set({
      selectedIndicatorId,
      filters: { ...initialIndicatorFilters, ...filters },
      currentPage: 1,
    }),

  reset: () => set({ ...initialState }),
}));

export const useIndicatorsState = (): IndicatorCenterStateData =>
  useIndicatorsStore(
    useShallow((s) => ({
      selectedIndicatorId: s.selectedIndicatorId,
      currentPage: s.currentPage,
      pageSize: s.pageSize,
      filters: s.filters,
    })),
  );

export const useIndicatorsActions = (): IndicatorCenterStateActions =>
  useIndicatorsStore(
    useShallow((s) => ({
      setSelectedIndicatorId: s.setSelectedIndicatorId,
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      setFilters: s.setFilters,
      clearFilters: s.clearFilters,
      applySnapshot: s.applySnapshot,
      reset: s.reset,
    })),
  );
