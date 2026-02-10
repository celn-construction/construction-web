'use client';

import React, { useState, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileDrawer from '@/components/layout/MobileDrawer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="h-screen bg-[var(--bg-primary)] overflow-hidden transition-colors duration-150">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header />
          <main className="flex-1 p-4 overflow-x-hidden overflow-y-auto">{children}</main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col md:hidden h-screen">
        <MobileHeader onMenuOpen={openDrawer} />
        <main className="flex-1 p-4 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}
