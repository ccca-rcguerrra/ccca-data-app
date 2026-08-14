import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/**
 * Filters for users list (API params + local-only filters)
 */
export interface UsersManagementFilters {
  teams: number[];
  biomes: string[];
  profile: string;
  status: string;
  institution: string;
  page: number;
  limit: number;
}

/**
 * Users Management state data
 */
export interface UsersManagementStateData {
  /** Hydration control (for list context, typically null) */
  hydratedId: number | null;

  /** Pagination */
  currentPage: number;
  pageSize: number;

  /** Search (debounced in controller) */
  searchQuery: string;

  /** Filters */
  filters: Omit<UsersManagementFilters, 'page' | 'limit'>;

  /** Sort */
  sortBy: string;
  sortDir: 'asc' | 'desc';

  /** Selection */
  selectedUserIds: Set<string>;

  /** User form modal (create/edit) */
  userModalOpen: boolean;
  userModalMode: 'create' | 'edit' | null;
  userModalUserId: number | null;
}

/**
 * Users Management actions
 */
export interface UsersManagementStateActions {
  setHydratedId: (id: number | null) => void;

  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;

  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<UsersManagementFilters>) => void;
  clearFilters: () => void;
  setSortBy: (field: string) => void;
  setSortDir: (dir: 'asc' | 'desc') => void;

  toggleUserSelection: (userId: string) => void;
  toggleSelectAll: (userIds: string[]) => void;
  clearSelection: () => void;

  openUserModalCreate: () => void;
  openUserModalEdit: (userId: number) => void;
  closeUserModal: () => void;

  reset: () => void;
}

export type UsersManagementState = UsersManagementStateData & UsersManagementStateActions;

const initialFilters: Omit<UsersManagementFilters, 'page' | 'limit'> = {
  teams: [],
  biomes: [],
  profile: 'all',
  status: 'all',
  institution: '',
};

const initialState: UsersManagementStateData = {
  hydratedId: null,
  currentPage: 1,
  pageSize: 10,
  searchQuery: '',
  filters: { ...initialFilters },
  sortBy: 'name',
  sortDir: 'asc',
  selectedUserIds: new Set(),
  userModalOpen: false,
  userModalMode: null,
  userModalUserId: null,
};

export const useUsersManagementStore = create<UsersManagementState>((set, get) => ({
  ...initialState,

  setHydratedId: (id) => set({ hydratedId: id }),

  setPage: (page) => set({ currentPage: page }),

  setPageSize: (size) =>
    set({ pageSize: size, currentPage: 1 }),

  goToNextPage: () => {
    const { currentPage } = get();
    set({ currentPage: currentPage + 1 });
  },

  goToPreviousPage: () => {
    const { currentPage } = get();
    if (currentPage > 1) set({ currentPage: currentPage - 1 });
  },

  setSearchQuery: (query) =>
    set({ searchQuery: query, currentPage: 1 }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      currentPage: 1,
    })),

  clearFilters: () =>
    set({ filters: { ...initialFilters }, currentPage: 1 }),

  setSortBy: (field) =>
    set({ sortBy: field, currentPage: 1 }),

  setSortDir: (dir) =>
    set({ sortDir: dir, currentPage: 1 }),

  toggleUserSelection: (userId) =>
    set((state) => {
      const next = new Set(state.selectedUserIds);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return { selectedUserIds: next };
    }),

  toggleSelectAll: (userIds) =>
    set((state) => {
      const next = new Set(state.selectedUserIds);
      const allSelected = userIds.every((id) => next.has(id));
      if (allSelected) userIds.forEach((id) => next.delete(id));
      else userIds.forEach((id) => next.add(id));
      return { selectedUserIds: next };
    }),

  clearSelection: () => set({ selectedUserIds: new Set() }),

  openUserModalCreate: () =>
    set({ userModalOpen: true, userModalMode: 'create', userModalUserId: null }),

  openUserModalEdit: (userId) =>
    set({ userModalOpen: true, userModalMode: 'edit', userModalUserId: userId }),

  closeUserModal: () =>
    set({ userModalOpen: false, userModalMode: null, userModalUserId: null }),

  reset: () => set(() => ({ ...initialState, selectedUserIds: new Set() })),
}));

export const useUsersManagementState = (): UsersManagementStateData =>
  useUsersManagementStore(
    useShallow((s) => ({
      hydratedId: s.hydratedId,
      currentPage: s.currentPage,
      pageSize: s.pageSize,
      searchQuery: s.searchQuery,
      filters: s.filters,
      sortBy: s.sortBy,
      sortDir: s.sortDir,
      selectedUserIds: s.selectedUserIds,
      userModalOpen: s.userModalOpen,
      userModalMode: s.userModalMode,
      userModalUserId: s.userModalUserId,
    }))
  );

export const useUsersManagementActions = (): UsersManagementStateActions =>
  useUsersManagementStore(
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
      toggleUserSelection: s.toggleUserSelection,
      toggleSelectAll: s.toggleSelectAll,
      clearSelection: s.clearSelection,
      openUserModalCreate: s.openUserModalCreate,
      openUserModalEdit: s.openUserModalEdit,
      closeUserModal: s.closeUserModal,
      reset: s.reset,
    }))
  );
