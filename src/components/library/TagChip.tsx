'use client';

import React from 'react';
import { IconX } from '@tabler/icons-react';

interface TagChipProps {
  id: string;
  name: string;
  color?: string;
  onRemove?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
}

export function TagChip({
  name,
  color = '#6366f1',
  onRemove,
  onClick,
  isSelected = false,
}: TagChipProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'bg-accent text-white shadow-xs'
          : 'bg-surface-elevated text-foreground hover:bg-surface border border-border'
      }`}
      style={{
        borderColor: isSelected ? undefined : color,
      }}
    >
      <span>#{name}</span>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Remove tag ${name}`}
        >
          <IconX size={12} />
        </button>
      )}
    </span>
  );
}
