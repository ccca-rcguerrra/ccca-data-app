import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';

export interface PeopleListStateData {
  currentPage: number;
  pageSize: number;
  searchQuery: string;
}

export interface PeopleListStateActions {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSearchQuery: (searchQuery: string) => void;
  reset: () => void;
}

export type PeopleListState = PeopleListStateData & PeopleListStateActions;

const initialState: PeopleListStateData = {
  currentPage: 1,
  pageSize: 20,
  searchQuery: '',
};

export const usePeopleListStore = create<PeopleListState>((set) => ({
  ...initialState,
  setPage: (currentPage) => set({ currentPage }),
  setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),
  setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
  reset: () => set(initialState),
}));

export const usePeopleListState = (): PeopleListStateData =>
  usePeopleListStore(
    useShallow((s) => ({
      currentPage: s.currentPage,
      pageSize: s.pageSize,
      searchQuery: s.searchQuery,
    })),
  );

export const usePeopleListActions = (): PeopleListStateActions =>
  usePeopleListStore(
    useShallow((s) => ({
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      setSearchQuery: s.setSearchQuery,
      reset: s.reset,
    })),
  );
