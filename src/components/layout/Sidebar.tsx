'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { BrandLogo } from '@/components/common/BrandLogo';
import {
  IconPlus,
  IconCompass,
  IconFolders,
  IconFileText,
  IconSettings,
  IconX,
  IconLogout,
} from '@tabler/icons-react';

import { formatChatTitle } from '@/lib/agent-engine/chat-title';

interface CurrentUserData {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  industry?: string | null;
  initials: string;
}

export interface SidebarChatSession {
  id: string;
  title: string;
  createdAt?: string | undefined;
}

export interface SidebarRunItem {
  id: string;
  chatId?: string;
  title?: string;
  topicBrief: string;
  status?: string;
  createdAt?: string;
}

export interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  currentChatId?: string | null;
  onSelectChat?: (chatId: string) => void;
  onNewRun?: () => void;
  chats?: SidebarChatSession[];
  // Backwards compatibility props
  currentRunId?: string | null;
  onSelectRun?: (runId: string) => void;
  runs?: SidebarRunItem[];
  className?: string;
}

export function Sidebar({
  isMobileOpen = false,
  onCloseMobile,
  currentChatId,
  onSelectChat,
  onNewRun,
  chats: chatsProp,
  currentRunId,
  onSelectRun,
  runs: runsProp,
  className,
}: SidebarProps) {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);
  const [internalRuns, setInternalRuns] = useState<SidebarRunItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch recent runs if not provided by parent
  useEffect(() => {
    if (chatsProp || runsProp) return;
    let isMounted = true;
    fetch('/api/runs')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.runs) {
          setInternalRuns(data.runs);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [chatsProp, runsProp, pathname]);

  const displayChats: SidebarChatSession[] = useMemo(() => {
    if (chatsProp) return chatsProp;
    const sourceRuns = runsProp ?? internalRuns;
    const map = new Map<string, SidebarChatSession>();
    for (const r of sourceRuns) {
      const cId = r.chatId || r.id;
      if (!map.has(cId)) {
        map.set(cId, {
          id: cId,
          title: r.title || formatChatTitle(r.topicBrief),
          createdAt: r.createdAt,
        });
      }
    }
    // Return sorted with newest chat first
    return Array.from(map.values()).reverse();
  }, [chatsProp, runsProp, internalRuns]);

  const activeSelectedId = currentChatId ?? currentRunId;
  const handleSelect = onSelectChat ?? onSelectRun;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

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
    { label: t('explore'), href: '/explore', icon: IconCompass },
    { label: t('library'), href: '/library', icon: IconFolders },
    { label: t('drafts'), href: '/drafts', icon: IconFileText },
    { label: t('settings'), href: '/settings', icon: IconSettings },
  ];

  const sidebarContent = (
    <div className="flex h-full select-none flex-col bg-surface p-4 overflow-hidden">
      {/* Top Header & Navigation */}
      <div className="flex flex-col gap-5 shrink-0">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Link href="/" className="group flex items-center transition-opacity hover:opacity-90">
            <BrandLogo height={42} />
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
              const isNewRunItem = item.href === '/';
              const isActive = isNewRunItem
                ? pathname === '/' && !activeSelectedId
                : item.href === '/explore'
                  ? pathname.startsWith('/explore')
                  : pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      if (isNewRunItem && onNewRun) {
                        e.preventDefault();
                        onNewRun();
                      }
                      if (isMobileOpen) onCloseMobile?.();
                    }}
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
      </div>

      {/* Recent Runs section (Takes all remaining height until bottom profile footer) */}
      <div className="flex flex-1 flex-col gap-2 pt-4 min-h-0 overflow-hidden">
        <span className="px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted shrink-0">
          {t('recentRuns')}
        </span>
        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pr-1">
          {displayChats.length === 0 ? (
            <li className="px-2.5 py-1 text-xs text-muted/60 italic">
              No recent chats
            </li>
          ) : (
            displayChats.map((chat) => {
              const isSelected = activeSelectedId === chat.id;

              return (
                <li key={chat.id}>
                  <Link
                    href={`/?chatId=${chat.id}`}
                    onClick={(e) => {
                      if (handleSelect) {
                        e.preventDefault();
                        handleSelect(chat.id);
                      }
                      if (isMobileOpen) onCloseMobile?.();
                    }}
                    className={`w-full truncate rounded-control px-2.5 py-1.5 text-start text-xs transition-colors flex items-center justify-between group ${
                      isSelected
                        ? 'bg-surface-raised font-semibold text-text shadow-2xs'
                        : 'text-muted hover:bg-surface-raised hover:text-text'
                    }`}
                    title={chat.title}
                  >
                    <span className="truncate flex-1 me-2">{chat.title}</span>
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    )}
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Bottom User Profile Section */}
      <div className="border-t border-border pt-3 mt-3 shrink-0">
        <div className="flex items-center justify-between rounded-xl p-1.5 transition-colors hover:bg-surface-raised">
          <Link
            href="/settings/account"
            onClick={() => isMobileOpen && onCloseMobile?.()}
            className="flex min-w-0 flex-1 items-center gap-2.5"
            title="View profile settings"
          >
            {/* Profile Avatar / Picture */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised border border-border font-semibold text-foreground overflow-hidden shadow-xs">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name || 'User avatar'}
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <span className="text-xs font-bold tracking-wider">
                  {currentUser?.initials || 'U'}
                </span>
              )}
              <span
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-emerald-500"
                title="Active"
              />
            </div>

            {/* Name & Role / Details */}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-semibold text-text">
                {currentUser?.name || 'Loading...'}
              </span>
              <span className="truncate text-[11px] text-muted">
                {currentUser?.role || currentUser?.email || 'Logged in'}
              </span>
            </div>
          </Link>

          {/* Quick Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-danger focus:outline-none"
          >
            <IconLogout size={15} aria-hidden="true" />
          </button>
        </div>
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
