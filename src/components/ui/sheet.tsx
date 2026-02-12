import * as React from "react"
import { Drawer, Box, IconButton, Typography, type DrawerProps } from '@mui/material'
import { X } from "lucide-react"

// Main Sheet component - maps to MUI Drawer
interface SheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Sheet: React.FC<SheetProps> = ({ children, open, onOpenChange }) => {
  return <>{children}</>;
};

// SheetTrigger - wrapper for trigger element
const SheetTrigger: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  return <>{children}</>;
};

// SheetClose - close button
const SheetClose: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// SheetContent - the actual Drawer
interface SheetContentProps extends Omit<DrawerProps, 'open' | 'onClose'> {
  children: React.ReactNode;
  overlay?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ children, overlay = true, open, onOpenChange, ...props }, ref) => {
    const handleClose = () => {
      onOpenChange?.(false);
    };

    return (
      <Drawer
        anchor="right"
        open={!!open}
        onClose={handleClose}
        ModalProps={{
          keepMounted: false,
          ...(overlay ? {} : { hideBackdrop: true }),
        }}
        PaperProps={{
          sx: {
            width: { xs: '75%', sm: 400 },
            p: 3,
          },
        }}
        {...props}
      >
        <Box ref={ref}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
            }}
          >
            <X className="h-4 w-4" />
          </IconButton>
          {children}
        </Box>
      </Drawer>
    );
  }
);
SheetContent.displayName = "SheetContent";

// SheetHeader - layout component
const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  ...props
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      textAlign: { xs: 'center', sm: 'left' },
      mb: 2,
    }}
    {...props}
  >
    {children}
  </Box>
);
SheetHeader.displayName = "SheetHeader";

// SheetTitle
const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ children, ...props }, ref) => (
  <Typography ref={ref} variant="h6" component="h2" {...props}>
    {children}
  </Typography>
));
SheetTitle.displayName = "SheetTitle";

// SheetDescription
const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, ...props }, ref) => (
  <Typography ref={ref} variant="body2" color="text.secondary" {...props}>
    {children}
  </Typography>
));
SheetDescription.displayName = "SheetDescription";

// Placeholder for API compatibility
const SheetPortal = SheetTrigger;
const SheetOverlay = SheetTrigger;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
}
