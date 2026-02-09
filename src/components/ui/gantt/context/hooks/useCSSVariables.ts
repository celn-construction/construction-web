import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Range } from '../../types';

export interface UseCSSVariablesOptions {
  range: Range;
  zoom: number;
  sidebarWidth: number;
}

/**
 * Computes CSS variables for Gantt chart dimensions based on range and zoom level
 * Returns an object suitable for inline styles with CSS custom properties
 */
export function useCSSVariables({
  range,
  zoom,
  sidebarWidth,
}: UseCSSVariablesOptions): CSSProperties {
  return useMemo(() => {
    const headerHeight = 60;
    const rowHeight = 36;
    let columnWidth = 50;

    if (range === 'monthly') {
      columnWidth = 150;
    } else if (range === 'quarterly') {
      columnWidth = 100;
    }

    return {
      '--gantt-zoom': `${zoom}`,
      '--gantt-column-width': `${(zoom / 100) * columnWidth}px`,
      '--gantt-header-height': `${headerHeight}px`,
      '--gantt-row-height': `${rowHeight}px`,
      '--gantt-sidebar-width': `${sidebarWidth}px`,
    } as CSSProperties;
  }, [range, zoom, sidebarWidth]);
}
