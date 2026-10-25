'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';

interface ExploreShellProps {
  title?: string;
  children: React.ReactNode;
}

export function ExploreShell({ title = 'Explore', children }: ExploreShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Persistent Sidebar & Mobile Navigation Drawer */}
      <Sidebar
        isMobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title={title}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
