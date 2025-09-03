import { useState, useEffect, useMemo } from 'react';
import { createAppTheme } from '../theme/theme';

type PaletteMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'protheus-theme-mode';

export const useAppTheme = () => {
  // Initialize theme from localStorage or system preference
  const getInitialTheme = (): PaletteMode => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as PaletteMode;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      return storedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };

  const [mode, setMode] = useState<PaletteMode>(getInitialTheme);

  // Create theme based on current mode
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  // Set specific mode
  const setThemeMode = (newMode: PaletteMode) => {
    setMode(newMode);
    localStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (event: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (!storedTheme) {
        setMode(event.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    theme,
    mode,
    toggleTheme,
    setThemeMode,
    isDarkMode: mode === 'dark',
  };
};