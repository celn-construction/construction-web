"use client"

import * as React from "react"
import { Menu, MenuItem, Divider, ListSubheader, Box } from '@mui/material'

// Context to manage context menu state
interface ContextMenuContextValue {
  contextMenu: { mouseX: number; mouseY: number } | null;
  setContextMenu: (value: { mouseX: number; mouseY: number } | null) => void;
}

const ContextMenuContext = React.createContext<ContextMenuContextValue>({
  contextMenu: null,
  setContextMenu: () => {},
});

// Main ContextMenu component
const ContextMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contextMenu, setContextMenu] = React.useState<{ mouseX: number; mouseY: number } | null>(null);

  return (
    <ContextMenuContext.Provider value={{ contextMenu, setContextMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
};

// ContextMenuTrigger - wraps the element that triggers the menu on right-click
const ContextMenuTrigger: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { contextMenu, setContextMenu } = React.useContext(ContextMenuContext);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 }
        : null
    );
  };

  return React.cloneElement(children, {
    onContextMenu: handleContextMenu,
  });
};

// ContextMenuContent - the actual MUI Menu
const ContextMenuContent = React.forwardRef<
  HTMLDivElement,
  { children: React.ReactNode }
>(({ children, ...props }, ref) => {
  const { contextMenu, setContextMenu } = React.useContext(ContextMenuContext);

  const handleClose = () => {
    setContextMenu(null);
  };

  return (
    <Menu
      open={contextMenu !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
      {...props}
    >
      {children}
    </Menu>
  );
});
ContextMenuContent.displayName = 'ContextMenuContent';

// ContextMenuItem - maps to MUI MenuItem
const ContextMenuItem = React.forwardRef<
  HTMLLIElement,
  { children: React.ReactNode; inset?: boolean; disabled?: boolean; onClick?: () => void; className?: string; asChild?: boolean }
>(({ children, disabled, onClick, className, asChild, ...props }, ref) => {
  const { setContextMenu } = React.useContext(ContextMenuContext);

  const handleClick = () => {
    onClick?.();
    setContextMenu(null);
  };

  // If asChild, render children directly
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      className,
    });
  }

  return (
    <MenuItem ref={ref} onClick={handleClick} disabled={disabled} className={className} {...props}>
      {children}
    </MenuItem>
  );
});
ContextMenuItem.displayName = 'ContextMenuItem';

// ContextMenuCheckboxItem - MenuItem with checkbox
const ContextMenuCheckboxItem = React.forwardRef<
  HTMLLIElement,
  { children: React.ReactNode; checked?: boolean; onCheckedChange?: (checked: boolean) => void }
>(({ children, checked, onCheckedChange, ...props }, ref) => {
  const { setContextMenu } = React.useContext(ContextMenuContext);

  const handleClick = () => {
    onCheckedChange?.(!checked);
    setContextMenu(null);
  };

  return (
    <MenuItem ref={ref} onClick={handleClick} {...props}>
      {checked && <Box component="span" sx={{ mr: 1 }}>✓</Box>}
      {children}
    </MenuItem>
  );
});
ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem';

// ContextMenuRadioItem - MenuItem with radio
const ContextMenuRadioItem = ContextMenuCheckboxItem;

// ContextMenuLabel - maps to ListSubheader
const ContextMenuLabel = React.forwardRef<
  HTMLLIElement,
  { children: React.ReactNode; inset?: boolean }
>(({ children, ...props }, ref) => (
  <ListSubheader {...props}>{children}</ListSubheader>
));
ContextMenuLabel.displayName = 'ContextMenuLabel';

// ContextMenuSeparator - maps to Divider
const ContextMenuSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>((props, ref) => <Divider sx={{ my: 0.5 }} />);
ContextMenuSeparator.displayName = 'ContextMenuSeparator';

// ContextMenuShortcut - for keyboard shortcuts display
const ContextMenuShortcut: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  children,
  ...props
}) => {
  return (
    <Box component="span" sx={{ ml: 'auto', fontSize: '0.75rem', opacity: 0.6 }} {...props}>
      {children}
    </Box>
  );
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

// Placeholder components for API compatibility
const ContextMenuGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const ContextMenuPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const ContextMenuSub = ContextMenu;
const ContextMenuSubContent = ContextMenuContent;
const ContextMenuSubTrigger = ContextMenuItem;
const ContextMenuRadioGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
