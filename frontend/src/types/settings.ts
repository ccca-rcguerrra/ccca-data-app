import type { AppLocale } from '@/i18n/supported-locales';

/** Input mode for refinement processing parameters (cleaning/simplification/smooth). */
export type ProcessingControlsMode = 'buttons' | 'slider';

// Tipos para configurações da aplicação
export interface AppSettings {
  // Configurações de interface
  theme: 'light' | 'dark';
  language: AppLocale;
  languageManuallySelected: boolean;
  sidebarCollapsed: boolean;
  sidebarManuallyCollapsed: boolean; // Track if user manually collapsed the sidebar
  /** Input mode for the refinement "Processing Parameters" controls. */
  processingControlsMode: ProcessingControlsMode;
}

// Tipos para ações da store
export interface SettingsActions {
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  setTheme: (theme: AppSettings['theme']) => void;
  setLanguage: (language: AppSettings['language']) => void;
  setDefaultLanguage: (language: AppSettings['language']) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarManuallyCollapsed: (manuallyCollapsed: boolean) => void;
  setProcessingControlsMode: (mode: ProcessingControlsMode) => void;
}

// Tipo completo da store
export interface SettingsState extends AppSettings, SettingsActions { }
