'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  IconCalendar,
  IconLanguage,
  IconClock,
  IconAdjustmentsHorizontal,
} from '@tabler/icons-react';

export interface ExploreFilters {
  freshness: 'day' | 'week' | 'month';
  language?: 'en' | 'fr' | 'ar' | undefined;
}

interface ExploreFiltersBarProps {
  filters: ExploreFilters;
  onChange: (filters: ExploreFilters) => void;
  className?: string | undefined;
}

export function ExploreFiltersBar({
  filters,
  onChange,
  className = '',
}: ExploreFiltersBarProps) {
  const t = useTranslations('Explore');

  const freshnessOptions: Array<{ id: 'day' | 'week' | 'month'; label: string }> = [
    { id: 'day', label: 'Past 24h' },
    { id: 'week', label: 'Past Week' },
    { id: 'month', label: 'Past Month' },
  ];

  const languageOptions: Array<{ id: 'en' | 'fr' | 'ar' | undefined; label: string }> = [
    { id: undefined, label: 'All Languages' },
    { id: 'en', label: 'English' },
    { id: 'fr', label: 'Français' },
    { id: 'ar', label: 'العربية' },
  ];

  return (
    <div
      className={`flex items-center justify-between gap-3 flex-wrap py-2 text-xs border-b border-border/40 ${className}`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Freshness Toggle Group */}
        <div className="flex items-center gap-1.5 bg-surface border border-border p-1 rounded-xl">
          <span className="text-[11px] font-semibold text-muted-foreground px-2 flex items-center gap-1">
            <IconClock className="w-3 h-3" />
            <span>Time:</span>
          </span>
          {freshnessOptions.map((opt) => {
            const isSelected = filters.freshness === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ ...filters, freshness: opt.id })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-1.5 bg-surface border border-border p-1 rounded-xl">
          <span className="text-[11px] font-semibold text-muted-foreground px-2 flex items-center gap-1">
            <IconLanguage className="w-3 h-3" />
            <span>Language:</span>
          </span>
          {languageOptions.map((opt) => {
            const isSelected = filters.language === opt.id;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onChange({ ...filters, language: opt.id })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
