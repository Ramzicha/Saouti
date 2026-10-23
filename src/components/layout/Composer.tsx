'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { AgentChip } from '@/components/agent/AgentChip';
import { IconArrowUp, IconPlayerStop, IconBolt } from '@tabler/icons-react';

export interface ComposerProps {
  initialValue?: string | undefined;
  onSend?: ((text: string, platforms: string[] | string, skipCritic?: boolean) => void) | undefined;
  onCancel?: (() => void) | undefined;
  isGenerating?: boolean | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
  disabledMessage?: string | undefined;
}

export function Composer({
  initialValue = '',
  onSend,
  onCancel,
  isGenerating = false,
  className,
  disabled = false,
  disabledMessage,
}: ComposerProps) {
  const t = useTranslations('Composer');
  const [content, setContent] = useState(initialValue);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'x']);
  const [skipCritic, setSkipCritic] = useState(false);

  const availablePlatforms: Array<{ id: string; label: string }> = [
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'x', label: 'X (Twitter)' },
    { id: 'reddit', label: 'Reddit' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook', label: 'Facebook' },
  ];

  const togglePlatform = (platformId: string) => {
    if (disabled || isGenerating) return;
    if (selectedPlatforms.includes(platformId)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platformId));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isGenerating) return;
    const textToSend = content;
    setContent('');
    onSend?.(textToSend, selectedPlatforms, skipCritic);
  };

  return (
    <div
      className={`mx-auto w-full max-w-composer select-none px-4 pb-4 ${className || ''}`}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-composer border border-border bg-surface p-4 shadow-sm transition-all focus-within:border-accent"
      >
        {/* Multiline textarea input with dir="auto" */}
        <textarea
          dir="auto"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={disabledMessage || t('placeholder')}
          rows={3}
          disabled={disabled || isGenerating}
          className="w-full resize-none border-none bg-transparent text-sm leading-relaxed text-text placeholder:text-muted focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Action Row: Agent chip, platform selection chips, skip critic option, send/cancel button */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <AgentChip
              agent="writer"
              action={isGenerating ? 'orchestrating pipeline' : 'ready'}
              isWorking={isGenerating}
              className="py-0.5"
            />

            {/* Target platform toggle chips */}
            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Target platforms"
            >
              {availablePlatforms.map((p) => (
                <Chip
                  key={p.id}
                  selected={selectedPlatforms.includes(p.id)}
                  onClick={() => togglePlatform(p.id)}
                  className="min-h-[30px] px-2.5 text-xs"
                >
                  {p.label}
                </Chip>
              ))}
            </div>

            {/* Fast Draft (Skip Critic) toggle */}
            <button
              type="button"
              onClick={() => !disabled && !isGenerating && setSkipCritic(!skipCritic)}
              disabled={disabled || isGenerating}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                skipCritic
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-border text-muted hover:text-text hover:border-text/30'
              }`}
              title="Fast Draft: Writer followed directly by Art Director in 2 calls"
            >
              <IconBolt size={14} className={skipCritic ? 'text-accent' : 'text-muted'} />
              <span>Fast Draft</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                className="gap-1.5 text-xs font-medium text-danger hover:bg-danger/10 border-danger/30"
              >
                <IconPlayerStop size={16} />
                <span>Cancel Run</span>
              </Button>
            ) : (
              <Button
                type="submit"
                variant="icon"
                ariaLabel={t('send')}
                disabled={disabled || !content.trim() || selectedPlatforms.length === 0}
              >
                <IconArrowUp size={20} stroke={2.5} aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Required Disclaimer text */}
      <p className="pt-2 text-center text-[11px] text-muted">
        {t('disclaimer')}
      </p>
    </div>
  );
}
