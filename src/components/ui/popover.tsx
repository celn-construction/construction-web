'use client';

import * as React from 'react';
import { Popover as MuiPopover, type PopoverProps as MuiPopoverProps } from '@mui/material';

// Context to manage popover state
interface PopoverContextValue {
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PopoverContext = React.createContext<PopoverContextValue>({
  anchorEl: null,
  setAnchorEl: () => {},
  open: false,
  setOpen: () => {},
});

// Main Popover component
interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Popover: React.FC<PopoverProps> = ({ children, open: controlledOpen, onOpenChange }) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleSetOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [controlledOpen, onOpenChange]);

  return (
    <PopoverContext.Provider value={{ anchorEl, setAnchorEl, open, setOpen: handleSetOpen }}>
      {children}
    </PopoverContext.Provider>
  );
};

// PopoverTrigger - wraps the trigger element
interface PopoverTriggerProps {
  children?: React.ReactElement;
  asChild?: boolean;
  virtualRef?: React.RefObject<any>;
}

const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children, virtualRef }) => {
  const { setAnchorEl, setOpen, open } = React.useContext(PopoverContext);

  // Handle virtual ref (for positioning based on ref instead of element)
  React.useEffect(() => {
    if (virtualRef?.current) {
      setAnchorEl(virtualRef.current);
    }
  }, [virtualRef, setAnchorEl]);

  if (!children) return null;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);
  };

  return React.cloneElement(children, {
    onClick: handleClick,
  });
};

// PopoverAnchor - for positioning reference
const PopoverAnchor: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { setAnchorEl } = React.useContext(PopoverContext);

  React.useEffect(() => {
    if (children && React.isValidElement(children)) {
      // This is a simplified version - in real usage, you'd need a ref
      return;
    }
  }, [children]);

  return <>{children}</>;
};

// PopoverContent - the actual MUI Popover
interface PopoverContentProps extends Omit<MuiPopoverProps, 'open' | 'anchorEl'> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  collisionBoundary?: HTMLElement | null;
  collisionPadding?: { left?: number; right?: number; top?: number; bottom?: number };
  className?: string;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, align = 'center', side = 'bottom', sideOffset = 4, className, ...props }, ref) => {
    const { anchorEl, open, setOpen, setAnchorEl } = React.useContext(PopoverContext);

    const handleClose = () => {
      setOpen(false);
      setAnchorEl(null);
    };

    const anchorOrigin = {
      vertical: side === 'top' ? ('top' as const) : side === 'bottom' ? ('bottom' as const) : ('bottom' as const),
      horizontal: align === 'start' ? ('left' as const) : align === 'end' ? ('right' as const) : ('center' as const),
    };

    const transformOrigin = {
      vertical: side === 'top' ? ('bottom' as const) : side === 'bottom' ? ('top' as const) : ('top' as const),
      horizontal: align === 'start' ? ('left' as const) : align === 'end' ? ('right' as const) : ('center' as const),
    };

    return (
      <MuiPopover
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        sx={{
          '& .MuiPopover-paper': {
            width: 288, // w-72
            p: 2,
            mt: sideOffset / 8, // Convert px to theme spacing units
          },
        }}
        {...props}
      >
        <div ref={ref} className={className}>
          {children}
        </div>
      </MuiPopover>
    );
  }
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
