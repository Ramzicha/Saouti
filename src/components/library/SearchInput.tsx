'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { IconSearch, IconX } from '@tabler/icons-react';

interface SearchInputProps {
  value: string;
  onChange: (query: string) => void;
  className?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  className = '',
  debounceMs = 300,
}: SearchInputProps) {
  const t = useTranslations('Library');
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [localValue, debounceMs, onChange, value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="absolute start-3 pointer-events-none text-muted-foreground flex items-center">
        <IconSearch size={16} />
      </span>

      <input
        type="search"
        dir="auto"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="w-full ps-9 pe-9 py-2 text-sm bg-surface-elevated border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
        aria-label={t('searchPlaceholder')}
      />

      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute end-3 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}
