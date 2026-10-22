import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex w-full flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-wider text-muted"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        dir="auto"
        className={twMerge(
          clsx(
            'rounded-control border border-border bg-surface px-3 py-2 text-sm text-text transition-colors',
            'placeholder:text-muted focus:border-accent',
            error && 'border-danger focus:border-danger',
            className,
          ),
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  id,
  className,
  ...props
}: TextareaProps) {
  const textareaId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex w-full flex-col gap-1">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-medium uppercase tracking-wider text-muted"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        dir="auto"
        className={twMerge(
          clsx(
            'rounded-control border border-border bg-surface px-3 py-2 text-sm text-text transition-colors',
            'resize-none placeholder:text-muted focus:border-accent',
            error && 'border-danger focus:border-danger',
            className,
          ),
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
