'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';

interface SettingsShellProps {
  title?: string;
  children: React.ReactNode;
}

export function SettingsShell({ title = 'Settings', children }: SettingsShellProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
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

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 max-w-5xl w-full mx-auto pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
