'use client';

import * as React from 'react';
import { FormLabel, type FormLabelProps } from '@mui/material';

const Label = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ ...props }, ref) => (
    <FormLabel
      ref={ref}
      {...props}
    />
  )
);

Label.displayName = 'Label';

export { Label };
