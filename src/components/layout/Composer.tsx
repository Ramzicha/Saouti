'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { AgentChip } from '@/components/agent/AgentChip';
import { IconArrowUp } from '@tabler/icons-react';

export interface ComposerProps {
  initialValue?: string;
  onSend?: (text: string, platform: string) => void;
  className?: string;
}

export function Composer({
  initialValue = '',
  onSend,
  className,
}: ComposerProps) {
  const t = useTranslations('Composer');
  const [content, setContent] = useState(initialValue);
  const [selectedPlatform, setSelectedPlatform] = useState('LinkedIn');

  const platforms = ['LinkedIn', 'Twitter/X', 'Threads'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSend?.(content, selectedPlatform);
    setContent('');
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
          placeholder={t('placeholder')}
          rows={3}
          className="w-full resize-none border-none bg-transparent text-sm leading-relaxed text-text placeholder:text-muted focus:outline-none"
        />

        {/* Action Row: Agent chip, platform selection chips, send button */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <AgentChip agent="writer" action="ready" className="py-0.5" />

            <div
              className="flex items-center gap-1.5"
              role="group"
              aria-label="Target platforms"
            >
              {platforms.map((p) => (
                <Chip
                  key={p}
                  selected={selectedPlatform === p}
                  onClick={() => setSelectedPlatform(p)}
                  className="min-h-[30px] px-2.5 text-xs"
                >
                  {p}
                </Chip>
              ))}
            </div>
          </div>

          {/* 44px round primary send button */}
          <Button
            type="submit"
            variant="icon"
            ariaLabel={t('send')}
            disabled={!content.trim()}
          >
            <IconArrowUp size={20} stroke={2.5} aria-hidden="true" />
          </Button>
        </div>
      </form>

      {/* Required Disclaimer text */}
      <p className="pt-2 text-center text-[11px] text-muted">
        {t('disclaimer')}
      </p>
    </div>
  );
}
