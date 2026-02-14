'use client';

import { useEffect } from 'react';

const BRYNTUM_THEME_LINK_ID = 'bryntum-theme';
const FONT_AWESOME_LINK_ID = 'font-awesome';
const FONT_AWESOME_URL = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';

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

function removeElementById(id: string) {
  const element = document.getElementById(id);
  if (element) {
    element.remove();
  }
}

export function useBryntumThemeAssets(theme: string) {
  useEffect(() => {
    const fontAwesomeLink = ensureStylesheet(FONT_AWESOME_LINK_ID);
    fontAwesomeLink.href = FONT_AWESOME_URL;

    const themeLink = ensureStylesheet(BRYNTUM_THEME_LINK_ID);
    themeLink.href = `/bryntum/stockholm-${theme}.css`;
  }, [theme]);

  useEffect(() => {
    return () => {
      removeElementById(BRYNTUM_THEME_LINK_ID);
      removeElementById(FONT_AWESOME_LINK_ID);
    };
  }, []);
}
