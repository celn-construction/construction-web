'use client';

import { useEffect } from 'react';
import { useThemeMode } from '@/components/providers/ThemeRegistry';

const FONT_AWESOME_LINK_ID = 'font-awesome';
const FONT_AWESOME_URL = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';

const BRYNTUM_DARK_LINK_ID = 'bryntum-dark-theme';
const BRYNTUM_DARK_URL = '/bryntum/stockholm-dark.css';

export function useBryntumThemeAssets() {
  const { mode } = useThemeMode();

  // Font Awesome (used by Bryntum icons) — loaded once, stays.
  useEffect(() => {
    if (document.getElementById(FONT_AWESOME_LINK_ID)) return;
    const link = document.createElement('link');
    link.id = FONT_AWESOME_LINK_ID;
    link.rel = 'stylesheet';
    link.href = FONT_AWESOME_URL;
    document.head.appendChild(link);
  }, []);

  // Bryntum dark theme — injected after the statically-bundled gantt.css so
  // its rules win on equal specificity. Removed when switching back to light.
  useEffect(() => {
    const existing = document.getElementById(BRYNTUM_DARK_LINK_ID);

    if (mode === 'dark') {
      if (existing) return;
      const link = document.createElement('link');
      link.id = BRYNTUM_DARK_LINK_ID;
      link.rel = 'stylesheet';
      link.href = BRYNTUM_DARK_URL;
      document.head.appendChild(link);
    } else if (existing) {
      existing.remove();
    }
  }, [mode]);
}
