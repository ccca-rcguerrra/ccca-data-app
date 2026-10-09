import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';

import type { CatalogIndicatorId } from '@/types/semaspa';

export interface IndicatorCenterStateData {
  selectedIndicatorId: CatalogIndicatorId | null;
  currentPage: number;
  pageSize: number;
  isCasesDialogOpen: boolean;
}

export interface IndicatorCenterStateActions {
  setSelectedIndicatorId: (id: CatalogIndicatorId | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setCasesDialogOpen: (open: boolean) => void;
  applySnapshot: (snapshot: { selectedIndicatorId: CatalogIndicatorId | null }) => void;
  reset: () => void;
}

export type IndicatorCenterState = IndicatorCenterStateData & IndicatorCenterStateActions;

const initialState: IndicatorCenterStateData = {
  selectedIndicatorId: null,
  currentPage: 1,
  pageSize: 20,
  isCasesDialogOpen: false,
};

export const useIndicatorsStore = create<IndicatorCenterState>((set) => ({
  ...initialState,

  setSelectedIndicatorId: (id) => set({ selectedIndicatorId: id, currentPage: 1 }),

  setPage: (page) => set({ currentPage: page }),

  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),

  setCasesDialogOpen: (open) => set({ isCasesDialogOpen: open }),

  applySnapshot: ({ selectedIndicatorId }) =>
    set({
      selectedIndicatorId,
      currentPage: 1,
      isCasesDialogOpen: false,
    }),

  reset: () => set({ ...initialState }),
}));

export const useIndicatorsState = (): IndicatorCenterStateData =>
  useIndicatorsStore(
    useShallow((s) => ({
      selectedIndicatorId: s.selectedIndicatorId,
      currentPage: s.currentPage,
      pageSize: s.pageSize,
      isCasesDialogOpen: s.isCasesDialogOpen,
    })),
  );

export const useIndicatorsActions = (): IndicatorCenterStateActions =>
  useIndicatorsStore(
    useShallow((s) => ({
      setSelectedIndicatorId: s.setSelectedIndicatorId,
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      setCasesDialogOpen: s.setCasesDialogOpen,
      applySnapshot: s.applySnapshot,
      reset: s.reset,
    })),
  );
