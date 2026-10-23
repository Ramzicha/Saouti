'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { IconSparkles, IconX, IconLoader2 } from '@tabler/icons-react';

export interface ImageRegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { instruction: string; aspectRatio: string }) => Promise<void>;
  currentAspectRatio?: string | undefined;
}

export const ImageRegenerateModal: React.FC<ImageRegenerateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentAspectRatio = '16:9',
}) => {
  const t = useTranslations('Visuals');
  const [instruction, setInstruction] = useState('');
  const [aspectRatio, setAspectRatio] = useState(currentAspectRatio);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) {
      setError(t('refinementLabel'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        instruction: instruction.trim(),
        aspectRatio,
      });
      setInstruction('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regeneration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="regenerate-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
            <IconSparkles className="h-4 w-4 text-primary-500" />
            <span id="regenerate-modal-title">{t('regenerateImage')}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block font-medium text-foreground mb-1.5">
              {t('refinementLabel')}
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder={t('refinementPlaceholder')}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1.5">
              {t('aspectRatio')}
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="4:5">4:5 (Portrait)</option>
              <option value="9:16">9:16 (Story)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-elevated transition-colors"
            >
              {t('cancelGeneration')}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !instruction.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 font-medium text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t('regenerating')}</span>
                </>
              ) : (
                <>
                  <IconSparkles className="h-3.5 w-3.5" />
                  <span>{t('submitRegenerate')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
