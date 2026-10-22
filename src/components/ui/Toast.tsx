'use client';

import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ToastProps {
  message: string;
  duration?: number;
  onDismiss?: () => void;
  className?: string;
}

export function Toast({
  message,
  duration = 4000,
  onDismiss,
  className,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className={twMerge(
        clsx(
          'fixed bottom-6 left-1/2 z-50 -translate-x-1/2',
          'rounded-row border border-border bg-surface-raised px-4 py-2.5 text-sm text-text shadow-sm',
          'animate-in fade-in slide-in-from-bottom-2 transition-all duration-150',
          className,
        ),
      )}
    >
      {message}
    </div>
  );
}
