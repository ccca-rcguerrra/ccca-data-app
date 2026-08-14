import { create } from 'zustand';

/**
 * Views conhecidas da UI.
 * Ajuste conforme teu app.
 */
export type AppView = 'dashboard' | 'alerts' | 'settings';

/**
 * Estado do domínio de UI global.
 */
export interface AppState {
  isLoading: boolean;
  error: string | null;
  currentView: AppView;
}

/**
 * Ações do domínio de UI global.
 */
export interface AppActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentView: (view: AppView) => void;
  clearError: () => void;
}

/**
 * Store de UI isolada.
 * Não é persistida porque é estado transitório.
 */
export const useAppStore = create<AppState & AppActions>()((set) => ({
  isLoading: false,
  error: null,
  currentView: 'dashboard',

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setCurrentView: (view) => set({ currentView: view }),
  clearError: () => set({ error: null }),
}));

