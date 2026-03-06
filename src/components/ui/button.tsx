'use client';

import * as React from 'react';
import { Button as MuiButton, IconButton, CircularProgress, type ButtonProps as MuiButtonProps } from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
    // Map custom variants to MUI variants
    const muiVariant =
      variant === 'secondary' ? 'contained' :
      variant === 'outline' ? 'outlined' :
      variant === 'ghost' ? 'text' :
      variant === 'destructive' ? 'contained' : 'contained';

    // Map custom sizes to MUI sizes
    const muiSize =
      size === 'sm' ? 'small' :
      size === 'lg' ? 'large' :
      'medium';

    // Handle icon button separately
    if (size === 'icon') {
      return (
        <IconButton
          ref={ref}
          disabled={disabled || loading}
          color={variant === 'destructive' ? 'error' : variant === 'secondary' ? 'secondary' : 'default'}
          {...props}
        >
          {loading ? <CircularProgress size={20} /> : children}
        </IconButton>
      );
    }

    return (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        size={muiSize}
        color={variant === 'destructive' ? 'error' : variant === 'secondary' ? 'secondary' : 'primary'}
        disabled={disabled || loading}
        startIcon={loading ? <CircularProgress size={16} /> : undefined}
        {...props}
      >
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

export { Button };
