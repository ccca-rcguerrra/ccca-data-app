// Configurações da aplicação
export const APP_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
  /** Request timeout in ms (used for all API calls) */
  API_TIMEOUT: 1200000,
} as const;
