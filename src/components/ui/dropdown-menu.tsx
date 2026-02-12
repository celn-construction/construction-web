'use client';

import * as React from 'react';
import { Menu, MenuItem, Divider, type MenuProps } from '@mui/material';

// Context to manage menu state
interface DropdownMenuContextValue {
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({
  anchorEl: null,
  setAnchorEl: () => {},
  open: false,
  setOpen: () => {},
});

// Main DropdownMenu component
interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, open: controlledOpen, onOpenChange }) => {
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
    <DropdownMenuContext.Provider value={{ anchorEl, setAnchorEl, open, setOpen: handleSetOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  );
};

// DropdownMenuTrigger - wraps the trigger element
interface DropdownMenuTriggerProps {
  children: React.ReactElement;
  asChild?: boolean;
}

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ children }) => {
  const { setAnchorEl, setOpen, open } = React.useContext(DropdownMenuContext);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);
  };

  return React.cloneElement(children, {
    onClick: handleClick,
  });
};

// DropdownMenuContent - the actual MUI Menu
const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  Omit<MenuProps, 'open' | 'anchorEl'> & { sideOffset?: number }
>(({ children, sideOffset = 4, ...props }, ref) => {
  const { anchorEl, open, setOpen, setAnchorEl } = React.useContext(DropdownMenuContext);

  const handleClose = () => {
    setOpen(false);
    setAnchorEl(null);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      {...props}
    >
      {children}
    </Menu>
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

// DropdownMenuItem - maps to MUI MenuItem
interface DropdownMenuItemProps {
  children: React.ReactNode;
  inset?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const DropdownMenuItem = React.forwardRef<HTMLLIElement, DropdownMenuItemProps>(
  ({ children, destructive, disabled, onClick, ...props }, ref) => {
    const { setOpen, setAnchorEl } = React.useContext(DropdownMenuContext);

    const handleClick = () => {
      onClick?.();
      setOpen(false);
      setAnchorEl(null);
    };

    return (
      <MenuItem
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        sx={{
          ...(destructive && {
            color: 'error.main',
          }),
        }}
        {...props}
      >
        {children}
      </MenuItem>
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

// DropdownMenuSeparator - maps to MUI Divider
const DropdownMenuSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>((props, ref) => (
  <Divider sx={{ my: 0.5 }} />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
