import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md';
  ariaLabel?: string;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  ariaLabel,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none';

  const variantClasses = {
    primary:
      'bg-button text-on-button border border-button hover:opacity-90 active:opacity-100 rounded-control min-h-[44px] px-3.5 text-[13px]',
    secondary:
      'bg-surface-raised text-text border border-border hover:border-accent hover:text-accent rounded-control min-h-[44px] px-3.5 text-[13px]',
    icon: 'bg-button text-on-button hover:opacity-90 active:opacity-100 rounded-full w-[44px] h-[44px] p-0 flex items-center justify-center',
  };

  const sizeClasses = {
    sm: 'min-h-[36px] px-2.5 text-xs',
    md: '',
  };

  return (
    <button
      className={twMerge(
        clsx(
          baseClasses,
          variantClasses[variant],
          variant !== 'icon' && size === 'sm' && sizeClasses.sm,
          className,
        ),
      )}
      aria-label={ariaLabel || (variant === 'icon' ? 'action' : undefined)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
