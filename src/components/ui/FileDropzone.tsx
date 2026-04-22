'use client';

import { Box, Typography } from '@mui/material';
import { CloudArrowUp } from '@phosphor-icons/react';
import type { SxProps, Theme } from '@mui/material';
import type { DropzoneInputProps, DropzoneRootProps } from 'react-dropzone';

interface FileDropzoneProps {
  isDragActive: boolean;
  icon?: React.ReactNode;
  primaryText?: string;
  hintText?: string;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  /**
   * Pass getRootProps + getInputProps for standalone mode (the component is the dropzone root).
   * Omit both when embedding inside an existing dropzone root — only the visual is rendered.
   */
  getRootProps?: () => DropzoneRootProps;
  getInputProps?: () => DropzoneInputProps;
}

export default function FileDropzone({
  isDragActive,
  icon,
  primaryText = 'Drop your file here',
  hintText,
  disabled,
  sx,
  getRootProps,
  getInputProps,
}: FileDropzoneProps) {
  const isStandalone = !!getRootProps;
  const rootProps = getRootProps ? getRootProps() : {};
  const inputProps = getInputProps ? getInputProps() : null;

  return (
    <Box
      {...rootProps}
      sx={[
        isStandalone
          ? {
              flex: 1,
              borderRadius: '12px',
              border: '2px dashed',
              borderColor: isDragActive ? 'text.secondary' : 'divider',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'border-color 0.2s',
              bgcolor: isDragActive ? 'action.hover' : 'transparent',
              '&:hover': { borderColor: 'text.secondary' },
            }
          : {},
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          gap: isStandalone ? 1.25 : 0.75,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {inputProps && <input {...inputProps} />}

      {icon ?? <CloudArrowUp size={36} color="var(--text-secondary)" />}

      <Typography
        sx={{
          fontSize: isStandalone ? 14 : '0.7rem',
          fontWeight: isStandalone ? 600 : 400,
          color: 'text.primary',
        }}
      >
        {primaryText}
      </Typography>

      {isStandalone && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>or</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
            browse files
          </Typography>
        </Box>
      )}

      {hintText && (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{hintText}</Typography>
      )}
    </Box>
  );
}
