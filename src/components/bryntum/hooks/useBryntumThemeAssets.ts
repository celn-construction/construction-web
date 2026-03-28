'use client';

import { useEffect } from 'react';

const FONT_AWESOME_LINK_ID = 'font-awesome';
const FONT_AWESOME_URL = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';

export function useBryntumThemeAssets() {
  useEffect(() => {
    if (document.getElementById(FONT_AWESOME_LINK_ID)) return;

    const link = document.createElement('link');
    link.id = FONT_AWESOME_LINK_ID;
    link.rel = 'stylesheet';
    link.href = FONT_AWESOME_URL;
    document.head.appendChild(link);
  }, []);
}
