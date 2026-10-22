import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  variant?: 'interactive' | 'status' | 'tag';
  dotColor?: string;
  tagVariant?: 'ready' | 'in_review';
  children: React.ReactNode;
}

export function Chip({
  selected = false,
  variant = 'interactive',
  dotColor,
  tagVariant,
  className,
  children,
  ...props
}: ChipProps) {
  if (variant === 'status') {
    return (
      <div
        role="status"
        className={twMerge(
          clsx(
            'inline-flex select-none items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[13px] leading-tight text-text',
            className,
          ),
        )}
      >
        {dotColor && (
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{ backgroundColor: dotColor }}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </div>
    );
  }

  if (variant === 'tag') {
    const isReady = tagVariant === 'ready';
    return (
      <span
        className={twMerge(
          clsx(
            'inline-flex select-none items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
            isReady
              ? 'border-success bg-surface text-success'
              : 'border-agent-critic bg-surface text-agent-critic',
            className,
          ),
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={twMerge(
        clsx(
          'inline-flex min-h-[36px] cursor-pointer select-none items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors',
          selected
            ? 'border-accent bg-accent-soft text-accent'
            : 'border-border bg-surface text-text hover:border-accent hover:text-accent',
          className,
        ),
      )}
      aria-pressed={selected}
      {...props}
    >
      {dotColor && (
        <span
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </button>
  );
}
