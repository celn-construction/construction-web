'use client';

import React, { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileDrawer from '@/components/layout/MobileDrawer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: 'background.default',
        overflow: 'hidden',
        transition: 'background-color 0.15s',
      }}
    >
      {/* Desktop Layout */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          height: '100vh',
        }}
      >
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <Header />
          <Box
            component="main"
            sx={{
              flex: 1,
              p: 2,
              overflowX: 'hidden',
              overflowY: 'auto',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>

      {/* Mobile Layout */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          flexDirection: 'column',
          height: '100vh',
        }}
      >
        <MobileHeader onMenuOpen={openDrawer} />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 2,
            overflowX: 'hidden',
            overflowY: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile Drawer Overlay */}
      <MobileDrawer isOpen={drawerOpen} onClose={closeDrawer} />
    </Box>
  );
}
