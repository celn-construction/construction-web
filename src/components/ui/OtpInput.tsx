'use client';

import { MuiOtpInput } from 'mui-one-time-password-input';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

export default function OtpInput({ value, onChange, length = 6, autoFocus }: OtpInputProps) {
  return (
    <MuiOtpInput
      value={value}
      onChange={onChange}
      length={length}
      autoFocus={autoFocus}
      validateChar={(char) => /^\d$/.test(char)}
      TextFieldsProps={{
        type: 'tel',
        inputProps: {
          inputMode: 'numeric',
          autoComplete: 'one-time-code',
        },
        sx: {
          '& .MuiOutlinedInput-root': {
            bgcolor: 'input.background',
          },
          '& .MuiOutlinedInput-input': {
            fontSize: '1.5rem',
            fontWeight: 600,
            textAlign: 'center',
            p: 1.5,
          },
        },
      }}
      sx={{
        gap: 1.5,
        maxWidth: 400,
        mx: 'auto',
      }}
    />
  );
}
