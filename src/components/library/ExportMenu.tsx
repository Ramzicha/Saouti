'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { IconDownload, IconFileText, IconFileTypeTxt } from '@tabler/icons-react';
import type { FilterState } from './PostFilters';

interface ExportMenuProps {
  filters: FilterState;
  searchQuery?: string;
  className?: string;
}

export function ExportMenu({
  filters,
  searchQuery,
  className = '',
}: ExportMenuProps) {
  const t = useTranslations('Library');
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleDownload = (format: 'markdown' | 'text') => {
    const params = new URLSearchParams();
    params.set('format', format);
    if (filters.platform) params.set('platform', filters.platform);
    if (filters.status) params.set('status', filters.status);
    if (filters.tag) params.set('tag', filters.tag);
    if (searchQuery) params.set('search', searchQuery);

    window.open(`/api/posts/export?${params.toString()}`, '_blank');
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-surface-elevated hover:bg-surface border border-border rounded-lg shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <IconDownload size={14} className="text-muted-foreground" />
        <span>{t('export')}</span>
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-2 w-52 bg-surface-elevated border border-border rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => handleDownload('markdown')}
            className="w-full text-start flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-surface hover:text-accent transition-colors"
          >
            <IconFileText size={16} className="text-accent" />
            <span>{t('exportMarkdown')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownload('text')}
            className="w-full text-start flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-surface hover:text-accent transition-colors"
          >
            <IconFileTypeTxt size={16} className="text-muted-foreground" />
            <span>{t('exportText')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
