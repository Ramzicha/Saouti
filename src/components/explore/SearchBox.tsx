'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { IconSearch, IconX, IconPlus, IconLoader2 } from '@tabler/icons-react';

interface SearchBoxProps {
  value: string;
  onSearch: (query: string) => void;
  onAddToTopics?: (phrase: string) => void;
  isExistingTopic?: boolean;
  isLoading?: boolean;
}

export function SearchBox({
  value,
  onSearch,
  onAddToTopics,
  isExistingTopic = false,
  isLoading = false,
}: SearchBoxProps) {
  const t = useTranslations('Explore');
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative flex items-center gap-2">
      <div className="relative flex-1">
        <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-border focus:border-foreground/40 transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <IconX className="w-4 h-4" />
          </button>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-button text-on-button text-xs font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-border disabled:opacity-50 transition-all shrink-0"
      >
        {isLoading ? (
          <IconLoader2 className="w-4 h-4 animate-spin" />
        ) : (
          <span>Search</span>
        )}
      </button>

      {/* Show "Add to my topics" when user entered an ad-hoc search that isn't saved yet */}
      {query.trim().length >= 2 && !isExistingTopic && onAddToTopics && (
        <button
          type="button"
          onClick={() => onAddToTopics(query.trim())}
          className="hidden sm:inline-flex items-center gap-1 px-3 py-2.5 rounded-xl border border-border text-xs font-medium text-foreground bg-surface hover:bg-surface-raised transition-colors shrink-0"
          title="Save this search phrase as a permanent topic"
        >
          <IconPlus className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Save Topic</span>
        </button>
      )}
    </form>
  );
}
