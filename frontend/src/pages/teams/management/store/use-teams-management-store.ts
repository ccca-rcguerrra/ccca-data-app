import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/**
 * Filters for teams list (API params + local-only filters)
 */
export interface TeamsManagementFilters {
  biomes: string[];
  institution: string;
  status: string;
  page: number;
  limit: number;
}

/**
 * Teams Management state data
 */
export interface TeamsManagementStateData {
  hydratedId: number | null;
  currentPage: number;
  pageSize: number;
  searchQuery: string;
  filters: Omit<TeamsManagementFilters, 'page' | 'limit'>;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  /** Team form modal (create/edit) – same pattern as users */
  teamModalOpen: boolean;
  teamModalMode: 'create' | 'edit' | null;
  teamModalTeamId: string | null;
}

/**
 * Teams Management actions
 */
export interface TeamsManagementStateActions {
  setHydratedId: (id: number | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<TeamsManagementFilters>) => void;
  clearFilters: () => void;
  setSortBy: (field: string) => void;
  setSortDir: (dir: 'asc' | 'desc') => void;
  openTeamModalCreate: () => void;
  openTeamModalEdit: (teamId: string) => void;
  closeTeamModal: () => void;
  reset: () => void;
}

export type TeamsManagementState = TeamsManagementStateData & TeamsManagementStateActions;

const initialFilters: Omit<TeamsManagementFilters, 'page' | 'limit'> = {
  biomes: [],
  institution: 'all',
  status: 'all',
};

const initialState: TeamsManagementStateData = {
  hydratedId: null,
  currentPage: 1,
  pageSize: 12,
  searchQuery: '',
  filters: { ...initialFilters },
  sortBy: 'name',
  sortDir: 'asc',
  teamModalOpen: false,
  teamModalMode: null,
  teamModalTeamId: null,
};

export const useTeamsManagementStore = create<TeamsManagementState>((set, get) => ({
  ...initialState,

  setHydratedId: (id) => set({ hydratedId: id }),

  setPage: (page) => set({ currentPage: page }),

  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),

  goToNextPage: () => {
    const { currentPage } = get();
    set({ currentPage: currentPage + 1 });
  },

  goToPreviousPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) set({ currentPage: currentPage - 1 });
  },

  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1,
    })),

  clearFilters: () => set({ filters: { ...initialFilters }, currentPage: 1 }),

  setSortBy: (field) => set({ sortBy: field, currentPage: 1 }),

  setSortDir: (dir) => set({ sortDir: dir, currentPage: 1 }),

  openTeamModalCreate: () =>
    set({
      teamModalOpen: true,
      teamModalMode: 'create',
      teamModalTeamId: null,
    }),

  openTeamModalEdit: (teamId) =>
    set({
      teamModalOpen: true,
      teamModalMode: 'edit',
      teamModalTeamId: teamId,
    }),

  closeTeamModal: () =>
    set({
      teamModalOpen: false,
      teamModalMode: null,
      teamModalTeamId: null,
    }),

  reset: () => set(() => ({ ...initialState })),
}));

export const useTeamsManagementState = (): TeamsManagementStateData =>
  useTeamsManagementStore(
    useShallow((s) => ({
      hydratedId: s.hydratedId,
      currentPage: s.currentPage,
      pageSize: s.pageSize,
      searchQuery: s.searchQuery,
      filters: s.filters,
      sortBy: s.sortBy,
      sortDir: s.sortDir,
      teamModalOpen: s.teamModalOpen,
      teamModalMode: s.teamModalMode,
      teamModalTeamId: s.teamModalTeamId,
    }))
  );

export const useTeamsManagementActions = (): TeamsManagementStateActions =>
  useTeamsManagementStore(
    useShallow((s) => ({
      setHydratedId: s.setHydratedId,
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      goToNextPage: s.goToNextPage,
      goToPreviousPage: s.goToPreviousPage,
      setSearchQuery: s.setSearchQuery,
      setFilters: s.setFilters,
      clearFilters: s.clearFilters,
      setSortBy: s.setSortBy,
      setSortDir: s.setSortDir,
      openTeamModalCreate: s.openTeamModalCreate,
      openTeamModalEdit: s.openTeamModalEdit,
      closeTeamModal: s.closeTeamModal,
      reset: s.reset,
    }))
  );
