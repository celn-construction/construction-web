'use client';

import React from 'react';
import Header from '@/components/layout/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-[var(--bg-primary)] overflow-hidden transition-colors duration-150">
      <div className="flex flex-col h-screen">
        <Header />
        <main className="flex-1 p-4 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
