'use client';

import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import {
  IconPlus,
  IconFolders,
  IconFileText,
  IconSettings,
  IconPalette,
  IconX,
} from '@tabler/icons-react';

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export function Sidebar({
  isMobileOpen = false,
  onCloseMobile,
  className,
}: SidebarProps) {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Accessible keyboard trap for mobile drawer (Escape closes drawer)
  useEffect(() => {
    if (!isMobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseMobile?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const navItems = [
    { label: t('newRun'), href: '/', icon: IconPlus },
    { label: t('library'), href: '/library', icon: IconFolders },
    { label: t('drafts'), href: '/drafts', icon: IconFileText },
    { label: 'Design Gallery', href: '/design', icon: IconPalette },
    { label: t('settings'), href: '/settings', icon: IconSettings },
  ];

  const recentRuns = [
    { id: '1', title: 'Why Antigravity Agentic Workflows Scale' },
    { id: '2', title: 'Announcing Saouti v0.2 Design System' },
    { id: '3', title: 'Bringing your own key for visible AI' },
  ];

  const sidebarContent = (
    <div className="flex h-full select-none flex-col justify-between bg-surface p-4">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Link href="/" className="group flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-on-accent">
              S
            </span>
            <span className="text-lg font-semibold tracking-tight text-text transition-colors group-hover:text-accent">
              Saouti
            </span>
          </Link>
          {isMobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex h-8 w-8 items-center justify-center rounded-control text-muted hover:text-text focus:outline-none md:hidden"
              aria-label="Close navigation menu"
            >
              <IconX size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav aria-label="Main Navigation">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => isMobileOpen && onCloseMobile?.()}
                    className={`flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-surface-raised font-semibold text-text'
                        : 'text-muted hover:bg-surface-raised hover:text-text'
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Recent Runs section */}
        <div className="flex flex-col gap-2 pt-2">
          <span className="px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted">
            {t('recentRuns')}
          </span>
          <ul className="flex flex-col gap-1">
            {recentRuns.map((run) => (
              <li key={run.id}>
                <button
                  type="button"
                  className="w-full truncate rounded-control px-2.5 py-1.5 text-start text-xs text-muted transition-colors hover:bg-surface-raised hover:text-text"
                >
                  {run.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Disclaimer/Info */}
      <div className="border-t border-border pt-4 text-center text-[11px] text-muted">
        Saouti v0.2 · Design System
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (fixed 240px wide) */}
      <aside
        className={`border-inline-end sticky top-0 hidden h-screen w-sidebar flex-shrink-0 border-border md:block ${
          className || ''
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (active when screen < 760px) */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          {/* Backdrop overlay */}
          <div
            className="backdrop-blur-xs fixed inset-0 bg-black/60 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div
            ref={drawerRef}
            className="border-inline-end animate-in slide-in-from-start relative z-10 h-full w-64 max-w-[80vw] border-border bg-surface shadow-xl duration-200"
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
