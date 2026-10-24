'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { IconFilter } from '@tabler/icons-react';

export interface FilterState {
  platform?: 'linkedin' | 'x' | 'reddit' | 'instagram' | 'facebook' | undefined;
  status?: 'draft' | 'ready' | 'posted' | undefined;
  tag?: string | undefined;
}

interface PostFiltersProps {
  filters: FilterState;
  onChange: (updated: FilterState) => void;
  availableTags?: Array<{ id: string; name: string }> | undefined;
  savedOnly?: boolean | undefined;
  className?: string;
}

export function PostFilters({
  filters,
  onChange,
  availableTags = [],
  savedOnly = false,
  className = '',
}: PostFiltersProps) {
  const t = useTranslations('Library');

  const platforms = [
    { value: '', label: t('allPlatforms') },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'x', label: 'X' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
  ];

  const statuses = savedOnly
    ? [
        { value: '', label: t.has('allSaved') ? t('allSaved') : 'All Saved' },
        { value: 'ready', label: t.has('statusReady') ? t('statusReady') : 'Ready' },
        { value: 'posted', label: t.has('statusPosted') ? t('statusPosted') : 'Posted' },
      ]
    : [
        { value: '', label: t.has('allStatuses') ? t('allStatuses') : 'All statuses' },
        { value: 'draft', label: t.has('statusDraft') ? t('statusDraft') : 'Draft' },
        { value: 'ready', label: t.has('statusReady') ? t('statusReady') : 'Ready' },
        { value: 'posted', label: t.has('statusPosted') ? t('statusPosted') : 'Posted' },
      ];



  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as FilterState['platform'];
    onChange({ ...filters, platform: val || undefined });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as FilterState['status'];
    onChange({ ...filters, status: val || undefined });
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange({ ...filters, tag: val || undefined });
  };

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
        <IconFilter size={15} />
      </span>

      {/* Platform Select */}
      <select
        value={filters.platform || ''}
        onChange={handlePlatformChange}
        className="px-3 py-1.5 text-xs font-medium bg-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Filter by platform"
      >
        {platforms.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Status Select: Only show if not locked to draft */}
      {filters.status !== 'draft' && (
        <select
          value={filters.status || ''}
          onChange={handleStatusChange}
          className="px-3 py-1.5 text-xs font-medium bg-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Filter by status"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      )}


      {/* Tag Select */}
      {availableTags.length > 0 && (
        <select
          value={filters.tag || ''}
          onChange={handleTagChange}
          className="px-3 py-1.5 text-xs font-medium bg-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Filter by tag"
        >
          <option value="">{t('allTags')}</option>
          {availableTags.map((tg) => (
            <option key={tg.id} value={tg.name}>
              #{tg.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
