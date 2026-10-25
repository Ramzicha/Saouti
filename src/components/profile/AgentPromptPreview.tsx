'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { IconCopy, IconCheck, IconLoader2, IconCode } from '@tabler/icons-react';

export function AgentPromptPreview() {
  const t = useTranslations('Profile');

  const [previewText, setPreviewText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPreview() {
      try {
        const res = await fetch('/api/profile/preview');
        if (res.ok) {
          const data = await res.json();
          setPreviewText(data.summaryMarkdown || '');
        }
      } catch (err) {
        console.error('Failed to load preview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPreview();
  }, []);

  const handleCopy = () => {
    if (!previewText) return;
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm gap-2">
        <IconLoader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span>Loading Agent System Prompt Preview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">
            {t('agentViewTitle')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            {t('agentViewDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input text-xs font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
        >
          {copied ? (
            <>
              <IconCheck className="w-3.5 h-3.5 text-green-500" />
              <span>{t('copied')}</span>
            </>
          ) : (
            <>
              <IconCopy className="w-3.5 h-3.5" />
              <span>{t('copyPrompt')}</span>
            </>
          )}
        </button>
      </div>

      <div className="relative rounded-xl border border-border bg-slate-950 p-4 sm:p-5 overflow-x-auto text-xs font-mono text-slate-100 shadow-inner">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
          <IconCode className="w-3.5 h-3.5" />
          <span>System Prompt Context: &lt;voice_profile&gt;</span>
        </div>
        <pre className="whitespace-pre leading-relaxed select-all">
          {previewText || 'No voice profile content available.'}
        </pre>
      </div>
    </div>
  );
}
