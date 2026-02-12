'use client';

import * as React from 'react';
import { TextField, type TextFieldProps } from '@mui/material';

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  // Preserve same interface as before for backwards compatibility
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ ...props }, ref) => {
    return (
      <TextField
        inputRef={ref}
        variant="outlined"
        size="small"
        fullWidth
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
