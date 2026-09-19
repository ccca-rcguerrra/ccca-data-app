import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';

import type { PermitReferenceMatchStatus } from '@/types/semaspa';

export interface PermitReferencesListStateData {
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  matchStatus: PermitReferenceMatchStatus | '';
  type: string;
  issuedFrom: string;
  issuedTo: string;
  multiple: boolean;
}

export interface PermitReferencesListStateActions {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchQuery: (searchQuery: string) => void;
  setMatchStatus: (matchStatus: PermitReferenceMatchStatus | '') => void;
  setType: (type: string) => void;
  setIssuedFrom: (issuedFrom: string) => void;
  setIssuedTo: (issuedTo: string) => void;
  setMultiple: (multiple: boolean) => void;
  reset: () => void;
}

export type PermitReferencesListState = PermitReferencesListStateData &
  PermitReferencesListStateActions;

const initialState: PermitReferencesListStateData = {
  currentPage: 1,
  pageSize: 20,
  searchQuery: '',
  matchStatus: '',
  type: '',
  issuedFrom: '',
  issuedTo: '',
  multiple: false,
};

export const usePermitReferencesListStore = create<PermitReferencesListState>((set) => ({
  ...initialState,
  setPage: (currentPage) => set({ currentPage }),
  setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),
  setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
  setMatchStatus: (matchStatus) => set({ matchStatus, currentPage: 1 }),
  setType: (type) => set({ type, currentPage: 1 }),
  setIssuedFrom: (issuedFrom) => set({ issuedFrom, currentPage: 1 }),
  setIssuedTo: (issuedTo) => set({ issuedTo, currentPage: 1 }),
  setMultiple: (multiple) => set({ multiple, currentPage: 1 }),
  reset: () => set(initialState),
}));

export const usePermitReferencesListState = (): PermitReferencesListStateData =>
  usePermitReferencesListStore(
    useShallow((s) => ({
      currentPage: s.currentPage,
      pageSize: s.pageSize,
      searchQuery: s.searchQuery,
      matchStatus: s.matchStatus,
      type: s.type,
      issuedFrom: s.issuedFrom,
      issuedTo: s.issuedTo,
      multiple: s.multiple,
    })),
  );

export const usePermitReferencesListActions = (): PermitReferencesListStateActions =>
  usePermitReferencesListStore(
    useShallow((s) => ({
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      setSearchQuery: s.setSearchQuery,
      setMatchStatus: s.setMatchStatus,
      setType: s.setType,
      setIssuedFrom: s.setIssuedFrom,
      setIssuedTo: s.setIssuedTo,
      setMultiple: s.setMultiple,
      reset: s.reset,
    })),
  );
