'use client';

import * as React from 'react';
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  Box,
  type DialogProps as MuiDialogProps,
} from '@mui/material';
import { X } from 'lucide-react';

// Main Dialog component - maps open/onOpenChange to MUI's open/onClose
interface DialogProps extends Omit<MuiDialogProps, 'onClose'> {
  onOpenChange?: (open: boolean) => void;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, ...props }) => {
  const handleClose = () => {
    onOpenChange?.(false);
  };

  return (
    <MuiDialog open={!!open} onClose={handleClose} maxWidth="sm" fullWidth {...props}>
      {children}
    </MuiDialog>
  );
};

// DialogTrigger - not needed in MUI, but kept for API compatibility
const DialogTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({
  children,
}) => {
  return <>{children}</>;
};

// DialogContent - MUI handles this automatically, but we keep it for structure
const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return (
      <MuiDialogContent ref={ref} {...props}>
        {children}
      </MuiDialogContent>
    );
  }
);
DialogContent.displayName = 'DialogContent';

// DialogHeader - just a Box for layout
const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }} {...props}>
      {children}
    </Box>
  );
};
DialogHeader.displayName = 'DialogHeader';

// DialogFooter - maps to MUI DialogActions
const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => {
  return <DialogActions {...props}>{children}</DialogActions>;
};
DialogFooter.displayName = 'DialogFooter';

// DialogTitle
const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, ...props }, ref) => {
    return (
      <MuiDialogTitle ref={ref} {...props}>
        {children}
      </MuiDialogTitle>
    );
  }
);
DialogTitle.displayName = 'DialogTitle';

// DialogDescription
const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, ...props }, ref) => {
  return (
    <DialogContentText ref={ref} {...props}>
      {children}
    </DialogContentText>
  );
});
DialogDescription.displayName = 'DialogDescription';

// DialogClose - close button icon
const DialogClose: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <IconButton
      aria-label="close"
      sx={{
        position: 'absolute',
        right: 8,
        top: 8,
      }}
    >
      {children || <X className="h-4 w-4" />}
    </IconButton>
  );
};

// Kept for API compatibility but not used in MUI
const DialogPortal = DialogTrigger;
const DialogOverlay = DialogTrigger;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
