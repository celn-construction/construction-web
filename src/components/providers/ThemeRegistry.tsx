'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme } from '@/theme/theme';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
