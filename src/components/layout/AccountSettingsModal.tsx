'use client';

import { useState } from 'react';
import { X, User, Settings, CreditCard, LifeBuoy } from 'lucide-react';
import { Dialog, Box, IconButton, Typography } from '@mui/material';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Settings },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'help', label: 'Help & Support', icon: LifeBuoy },
] as const;

type TabId = (typeof tabs)[number]['id'];

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountSettingsModal({ open, onOpenChange }: AccountSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 720,
          height: 520,
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
        },
      }}
    >
      {/* Left sidebar */}
      <Box
        sx={{
          width: 200,
          bgcolor: 'background.default',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          py: 2,
          px: 1,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color: 'text.disabled',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            px: 1,
            pb: 1,
            userSelect: 'none',
          }}
        >
          Settings
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Box
                key={tab.id}
                component="button"
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.25,
                  py: 0.875,
                  borderRadius: '8px',
                  border: 'none',
                  bgcolor: isActive ? 'action.selected' : 'transparent',
                  color: isActive ? 'text.primary' : 'text.secondary',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': {
                    bgcolor: isActive ? 'action.selected' : 'action.hover',
                    color: 'text.primary',
                  },
                }}
              >
                <tab.icon style={{ width: 15, height: 15 }} />
                <Typography
                  sx={{
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 550 : 400,
                    lineHeight: 1,
                  }}
                >
                  {tab.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Right content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {tabs.find((t) => t.id === activeTab)?.label}
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            <X style={{ width: 18, height: 18 }} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, px: 3, py: 3, overflow: 'auto' }}>
          <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            {tabs.find((t) => t.id === activeTab)?.label} settings will appear here.
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
