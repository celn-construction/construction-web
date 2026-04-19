'use client';

import { forwardRef } from 'react';
import {
  Button as MuiButton,
  type ButtonProps as MuiButtonProps,
} from '@mui/material';
import { IBeamLoader } from './IBeamLoader';

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
    const spinner = <IBeamLoader size={spinnerSize} color="currentColor" />;

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
