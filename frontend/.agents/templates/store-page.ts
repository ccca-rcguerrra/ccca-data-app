import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface PageState {
  hydratedId: number | null;
  activeTab: string;
  isDrawerOpen: boolean;
}

interface PageActions {
  setHydratedId: (id: number | null) => void;
  setActiveTab: (tab: string) => void;
  toggleDrawer: () => void;
  reset: () => void;
}

type PageStore = PageState & PageActions;

const initialState: PageState = {
  hydratedId: null,
  activeTab: 'default',
  isDrawerOpen: false,
};

export const usePageStore = create<PageStore>()((set) => ({
  ...initialState,
  setHydratedId: (id) => set({ hydratedId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
  reset: () => set({ ...initialState }),
}));

export const usePageState = () =>
  usePageStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      isDrawerOpen: s.isDrawerOpen,
    })),
  );

export const usePageActions = () =>
  usePageStore(
    useShallow((s) => ({
      setActiveTab: s.setActiveTab,
      toggleDrawer: s.toggleDrawer,
    })),
  );
