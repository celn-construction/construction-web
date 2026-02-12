'use client';

import { Search, Moon, Sun, Plus, Menu } from 'lucide-react';
import { Box, IconButton, Typography } from '@mui/material';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { useThemeStore } from '@/store/useThemeStore';
import { LogoIcon } from '@/components/ui/Logo';

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

export default function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Box
      component="header"
      sx={{
        bgcolor: 'background.default',
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        transition: 'colors 0.15s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconButton
          onClick={onMenuOpen}
          aria-label="Open menu"
          sx={{
            p: 0.5,
            '&:hover': {
              opacity: 0.7,
            },
          }}
        >
          <Menu style={{ width: 20, height: 20, color: 'var(--text-secondary)' }} />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LogoIcon size={16} />
          <Typography sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.875rem' }}>
            BuildTrack
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          sx={{
            p: 0.5,
            '&:hover': {
              opacity: 0.7,
            },
          }}
        >
          {theme === 'dark' ? (
            <Sun style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />
          ) : (
            <Moon style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />
          )}
        </IconButton>
        <IconButton
          sx={{
            p: 0.5,
            '&:hover': {
              opacity: 0.7,
            },
          }}
        >
          <Search style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />
        </IconButton>
        <Box
          component="button"
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'action.hover',
            borderRadius: '50%',
            overflow: 'hidden',
            cursor: 'pointer',
            border: 'none',
            p: 0,
          }}
        >
          <ImageWithFallback
            src="/images/avatar-1.jpg"
            alt="User"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </Box>
        <IconButton
          sx={{
            bgcolor: 'warm.main',
            color: 'white',
            p: 1,
            borderRadius: 1.5,
            '&:hover': {
              bgcolor: 'warm.hover',
            },
            transition: 'all 0.15s',
          }}
        >
          <Plus style={{ width: 20, height: 20 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
