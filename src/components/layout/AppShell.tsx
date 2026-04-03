'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MobileDrawer from '@/components/layout/MobileDrawer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarCollapsed((prev) => !prev), []);

  // Trigger fade animation on route change
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setTransitioning(true);
      const timer = setTimeout(() => setTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Cmd+B (Mac) / Ctrl+B (Windows/Linux) to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: 'background.default',
        overflow: 'hidden',
        transition: 'background-color 0.15s',
        display: 'flex',
      }}
    >
      {/* Sidebar — desktop only */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      </Box>

      {/* Main content column — single instance, responsive */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
        }}
      >
        <Header onMenuOpen={openDrawer} />
        <Box
          component="main"
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
            overflowY: 'auto',
            animation: transitioning ? 'page-enter 0.3s ease' : 'none',
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
