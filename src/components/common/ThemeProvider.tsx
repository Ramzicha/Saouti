'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type Theme,
  type ThemePreference,
  parseThemeCookie,
  resolveTheme,
  setThemeCookie,
} from '@/lib/theme';

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  initialPreference = 'system',
  children,
}: {
  initialPreference?: ThemePreference;
  children: React.ReactNode;
}) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(initialPreference);
  const [systemIsDark, setSystemIsDark] = useState<boolean>(true);

  useEffect(() => {
    // Read preference from cookie if available
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/saouti-theme=([^;]+)/);
      if (match && match[1]) {
        setPreferenceState(parseThemeCookie(match[1]));
      }

      // Check OS preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemIsDark(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => {
        setSystemIsDark(e.matches);
      };

      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  const theme = resolveTheme(preference, systemIsDark);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const setPreference = (newPref: ThemePreference) => {
    setPreferenceState(newPref);
    setThemeCookie(newPref);
  };

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
