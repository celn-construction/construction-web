'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X } from 'lucide-react';
import { Box, Typography, IconButton, CircularProgress, SxProps, Theme } from '@mui/material';

export interface ImageDropzoneProps {
  value?: string;
  onChange: (imageUrl: string | undefined) => void;
  sx?: SxProps<Theme>;
  disabled?: boolean;
}

export function ImageDropzone({
  value,
  onChange,
  sx,
  disabled = false,
}: ImageDropzoneProps) {
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsLoading(true);

      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onChange(result);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
    disabled: disabled || isLoading,
  });

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(undefined);
    },
    [onChange]
  );

  if (value) {
    return (
      <Box
        sx={{
          position: 'relative',
          '&:hover .remove-button': { opacity: 1 },
          ...sx,
        }}
      >
        <Box
          component="img"
          src={value}
          alt="Cover"
          sx={{
            width: '100%',
            height: 128,
            objectFit: 'cover',
            borderRadius: 2,
          }}
        />
        <IconButton
          className="remove-button"
          onClick={handleRemove}
          disabled={disabled}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
            opacity: 0,
            transition: 'opacity 0.2s',
            color: 'white',
          }}
        >
          <X className="w-4 h-4" />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      {...getRootProps()}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 2,
        border: 2,
        borderStyle: 'dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        bgcolor: isDragActive ? 'action.hover' : 'transparent',
        opacity: disabled || isLoading ? 0.5 : 1,
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: disabled || isLoading ? 'divider' : 'text.secondary',
        },
        ...sx,
      }}
    >
      <input {...getInputProps()} />
      <ImagePlus className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {isDragActive ? 'Drop image here' : 'Drag & drop or click'}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
          PNG, JPG, GIF up to 5MB
        </Typography>
      </Box>
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: 2,
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
}

export default ImageDropzone;
