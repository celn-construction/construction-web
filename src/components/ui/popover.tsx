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
  children: React.ReactElement;
  asChild?: boolean;
}

const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ children }) => {
  const { setAnchorEl, setOpen, open } = React.useContext(PopoverContext);

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
  sideOffset?: number;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, align = 'center', sideOffset = 4, ...props }, ref) => {
    const { anchorEl, open, setOpen, setAnchorEl } = React.useContext(PopoverContext);

    const handleClose = () => {
      setOpen(false);
      setAnchorEl(null);
    };

    const anchorOrigin = {
      vertical: 'bottom' as const,
      horizontal: align === 'start' ? 'left' as const : align === 'end' ? 'right' as const : 'center' as const,
    };

    const transformOrigin = {
      vertical: 'top' as const,
      horizontal: align === 'start' ? 'left' as const : align === 'end' ? 'right' as const : 'center' as const,
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
        {children}
      </MuiPopover>
    );
  }
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
