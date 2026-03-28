'use client';

import { useEffect } from 'react';

const BRYNTUM_THEME_LINK_ID = 'bryntum-theme';

function ensureStylesheet(id: string): HTMLLinkElement {
  const existing = document.getElementById(id);

  if (existing instanceof HTMLLinkElement) {
    return existing;
  }

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
  return link;
}

export function useBryntumThemeAssets() {
  useEffect(() => {
    const themeLink = ensureStylesheet(BRYNTUM_THEME_LINK_ID);
    themeLink.href = '/bryntum/stockholm-light.css';

    return () => {
      document.getElementById(BRYNTUM_THEME_LINK_ID)?.remove();
    };
  }, []);
}
