import { useEffect } from 'react';
import { useSettingsStore } from '../stores';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * App theme provider: applies light/dark class to document root.
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  return <>{children}</>;
};
