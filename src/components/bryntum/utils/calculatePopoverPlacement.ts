import { ESTIMATED_POPOVER_HEIGHT, POPOVER_GAP, POPOVER_WIDTH } from '../constants';
import type { PopoverPlacement } from '../types';

type PlacementInput = {
  rect: DOMRect;
  viewportWidth: number;
  viewportHeight: number;
};

export function calculatePopoverPlacement({
  rect,
  viewportWidth,
  viewportHeight,
}: PlacementInput): PopoverPlacement {
  const shouldFlipLeft = viewportWidth - rect.right < POPOVER_WIDTH + POPOVER_GAP;
  const anchorLeft = shouldFlipLeft ? rect.left - POPOVER_GAP : rect.right + POPOVER_GAP;
  const horizontalOrigin = shouldFlipLeft ? 'right' : 'left';
  const paperMargin = shouldFlipLeft ? '0 8px 0 0' : '0 0 0 8px';

  let anchorTop = rect.top + rect.height / 2;
  let verticalOrigin: 'center' | 'top' | 'bottom' = 'center';

  if (anchorTop - ESTIMATED_POPOVER_HEIGHT / 2 < 0) {
    anchorTop = rect.top;
    verticalOrigin = 'top';
  } else if (anchorTop + ESTIMATED_POPOVER_HEIGHT / 2 > viewportHeight) {
    anchorTop = rect.bottom;
    verticalOrigin = 'bottom';
  }

  return {
    anchorPosition: {
      top: anchorTop,
      left: anchorLeft,
    },
    transformOrigin: {
      vertical: verticalOrigin,
      horizontal: horizontalOrigin,
    },
    paperMargin,
  };
}

export function createFallbackPopoverPlacement(clientX: number, clientY: number): PopoverPlacement {
  return {
    anchorPosition: { top: clientY, left: clientX },
    transformOrigin: { vertical: 'center', horizontal: 'left' },
    paperMargin: '0 0 0 8px',
  };
}
