'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconArrowBackUp } from '@tabler/icons-react';

interface UndoToastProps {
  isOpen: boolean;
  onUndo: () => void;
  onExpire: () => void;
  durationSeconds?: number;
}

export function UndoToast({
  isOpen,
  onUndo,
  onExpire,
  durationSeconds = 10,
}: UndoToastProps) {
  const t = useTranslations('Library');
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(durationSeconds);
      return;
    }

    setSecondsRemaining(durationSeconds);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, durationSeconds, onExpire]);

  if (!isOpen) return null;

  const progressPercentage = (secondsRemaining / durationSeconds) * 100;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 end-6 z-50 flex flex-col overflow-hidden bg-surface-elevated border border-border shadow-xl rounded-xl p-4 min-w-[320px] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-medium text-foreground">
          {t('postDeleted')}
        </div>

        <button
          type="button"
          onClick={onUndo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent/90 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <IconArrowBackUp size={16} />
          <span>{t('undo')} ({secondsRemaining}s)</span>
        </button>
      </div>

      {/* Countdown progress bar */}
      <div className="w-full bg-border/50 h-1 rounded-full mt-3 overflow-hidden">
        <div
          className="bg-accent h-full transition-all ease-linear duration-1000"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
