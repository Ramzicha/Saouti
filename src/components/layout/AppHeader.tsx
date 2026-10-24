'use client';

import React from 'react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { LocaleSwitcher } from '@/components/common/LocaleSwitcher';
import { IconMenu2 } from '@tabler/icons-react';
import { BrandLogo } from '@/components/common/BrandLogo';

export interface AppHeaderProps {
  title?: string;
  onOpenMobileDrawer?: () => void;
  className?: string;
}

export function AppHeader({
  title = 'Saouti',
  onOpenMobileDrawer,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-30 flex h-header w-full select-none items-center justify-between border-b border-border bg-surface px-4 sm:px-6 ${
        className || ''
      }`}
    >
      {/* Start: Mobile drawer toggle & Page Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileDrawer && (
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-control text-muted hover:text-text focus:outline-none md:hidden"
            aria-label="Open navigation menu"
          >
            <IconMenu2 size={20} aria-hidden="true" />
          </button>
        )}
        {title === 'Saouti' ? (
          <div className="md:hidden flex items-center">
            <BrandLogo height={32} />
          </div>
        ) : (
          <h1 className="text-base font-semibold tracking-tight text-text sm:text-lg">
            {title}
          </h1>
        )}
      </div>

      {/* End: Preferences Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
    </header>
  );
}
