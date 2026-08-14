import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import QueryProvider from "./providers/query-provider";
import { ThemeProvider } from "./providers/theme-provider";
import { WebSocketProvider } from "./providers/websocket-provider";
import { routes } from "./routes";
import { useLanguageSync } from "./hooks/use-language-sync";
import { useAppConfig } from "./hooks/api/use-app-config";
import { useDocumentTitle } from "./hooks/use-document-title";
import 'maplibre-gl/dist/maplibre-gl.css';
import './i18n';
import './utils/numbro';

/**
 * Warms the AppConfig cache as soon as the user is authenticated.
 * Renders nothing — just primes React Query so screens read it from cache.
 */
function AppConfigBootstrap() {
  useLanguageSync();
  useAppConfig();
  return null;
}

/** Sets the browser tab title from public initiative metadata. */
function DocumentTitleBootstrap() {
  useDocumentTitle();
  return null;
}

/**
 * Main App component.
 * @returns A React component representing the main application.
 */
function App() {
  return (
    <QueryProvider>
      <DocumentTitleBootstrap />
      <AppConfigBootstrap />
      <WebSocketProvider>
        <ThemeProvider>
          <RouterProvider router={routes} />
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </WebSocketProvider>
    </QueryProvider>
  );
}

export default App;
