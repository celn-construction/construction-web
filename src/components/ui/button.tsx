'use client';

import { forwardRef } from 'react';
import {
  Button as MuiButton,
  CircularProgress,
  type ButtonProps as MuiButtonProps,
} from '@mui/material';

const spinnerSizeMap = {
  small: 14,
  medium: 16,
  large: 18,
} as const;

export interface ButtonProps extends MuiButtonProps {
  loading?: boolean;
  loadingPosition?: 'start' | 'end';
  component?: React.ElementType;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      loading,
      loadingPosition = 'end',
      disabled,
      startIcon,
      endIcon,
      size = 'medium',
      children,
      sx: sxProp,
      ...rest
    },
    ref,
  ) => {
    const spinnerSize = spinnerSizeMap[size];
    const spinner = (
      <CircularProgress size={spinnerSize} sx={{ color: 'inherit' }} />
    );

    return (
      <MuiButton
        ref={ref}
        size={size}
        disabled={disabled}
        aria-disabled={disabled || loading || undefined}
        sx={{
          ...(loading && !disabled && {
            pointerEvents: 'none',
            opacity: 0.85,
          }),
          ...sxProp,
        }}
        startIcon={loadingPosition === 'start' && loading ? spinner : startIcon}
        endIcon={loadingPosition === 'end' && loading ? spinner : endIcon}
        {...rest}
      >
        {children}
      </MuiButton>
    );
  },
);

Button.displayName = 'Button';
export { Button };
