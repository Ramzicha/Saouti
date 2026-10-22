'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme switcher"
      className="inline-flex items-center gap-1 rounded-control border border-border bg-surface p-1"
    >
      <button
        type="button"
        onClick={() => setPreference('light')}
        aria-label="Light theme"
        aria-pressed={preference === 'light'}
        className={`flex h-8 w-8 items-center justify-center rounded-control transition-colors ${
          preference === 'light'
            ? 'border border-border bg-surface-raised text-accent'
            : 'text-muted hover:text-text'
        }`}
      >
        <IconSun size={18} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => setPreference('dark')}
        aria-label="Dark theme"
        aria-pressed={preference === 'dark'}
        className={`flex h-8 w-8 items-center justify-center rounded-control transition-colors ${
          preference === 'dark'
            ? 'border border-border bg-surface-raised text-accent'
            : 'text-muted hover:text-text'
        }`}
      >
        <IconMoon size={18} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => setPreference('system')}
        aria-label="System theme"
        aria-pressed={preference === 'system'}
        className={`flex h-8 w-8 items-center justify-center rounded-control transition-colors ${
          preference === 'system'
            ? 'border border-border bg-surface-raised text-accent'
            : 'text-muted hover:text-text'
        }`}
      >
        <IconDeviceDesktop size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
