'use client';

import { useEffect } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useThemeStore } from '@/store/useThemeStore';
import { lightTheme, darkTheme } from '@/theme/theme';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // Apply .dark class on <html> for CSS variables (needed by SVAR/Bryntum Gantt)
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Handle system preference on initial load
  useEffect(() => {
    const stored = localStorage.getItem('theme-storage');
    if (!stored) {
      // Check system preference if no stored preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setTheme('dark');
      }
    }
  }, [setTheme]);

  const muiTheme = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
