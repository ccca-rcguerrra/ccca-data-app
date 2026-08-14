import { persist } from 'zustand/middleware';
import { create } from 'zustand';

import type { AppSettings, SettingsActions } from '@/types/settings';
import { StorageService } from '@/services/storage/storage.service';
import { DEFAULT_LOCALE } from '@/i18n/supported-locales';
import { STORAGE_KEYS } from '@/constants';

/**
 * Configurações padrão da aplicação.
 */
const defaultSettings: AppSettings = {
  theme: 'light',
  language: DEFAULT_LOCALE,
  languageManuallySelected: false,
  sidebarCollapsed: false,
  sidebarManuallyCollapsed: false,
  processingControlsMode: 'buttons',
};

/**
 * Estado e ações do domínio de configurações.
 */
export interface SettingsStore extends AppSettings, SettingsActions {}

/**
 * Store de configurações isolada.
 * Responsável por preferências persistentes do usuário.
 */
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateSettings: (newSettings) => {
        set((state) => ({
          ...state,
          ...newSettings,
        }));
      },

      resetSettings: () => {
        set({
          ...defaultSettings,
        });
      },

      setTheme: (theme) => {
        set({ theme });
      },

      setLanguage: (language) => {
        set({ language, languageManuallySelected: true });
      },

      setDefaultLanguage: (language) => {
        set((state) => {
          if (state.languageManuallySelected) return state;
          return { language };
        });
      },

      toggleSidebar: () => {
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
          sidebarManuallyCollapsed: !state.sidebarCollapsed,
        }));
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      setSidebarManuallyCollapsed: (manuallyCollapsed) => {
        set({ sidebarManuallyCollapsed: manuallyCollapsed });
      },

      setProcessingControlsMode: (mode) => {
        set({ processingControlsMode: mode });
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: StorageService.createPersistStorage(),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        languageManuallySelected: state.languageManuallySelected,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarManuallyCollapsed: state.sidebarManuallyCollapsed,
        processingControlsMode: state.processingControlsMode,
      }),
    }
  )
);
