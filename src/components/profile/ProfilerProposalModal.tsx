'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ProfilerProposal } from '@/lib/profile/profiler-agent';
import { IconCheck, IconPencil, IconX } from '@tabler/icons-react';

interface ProfilerProposalModalProps {
  isOpen: boolean;
  proposal: ProfilerProposal | null;
  onClose: () => void;
  onConfirm: () => void;
  onEditInForm: () => void;
  confirming?: boolean;
}

export function ProfilerProposalModal({
  isOpen,
  proposal,
  onClose,
  onConfirm,
  onEditInForm,
  confirming = false,
}: ProfilerProposalModalProps) {
  const t = useTranslations('Profiler');

  if (!isOpen || !proposal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <div>
            <h2
              id="proposal-modal-title"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              {t('proposalTitle')}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t('proposalSubtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm divide-y divide-border/40">
          <div className="pt-3 space-y-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Identity
            </span>
            <p className="font-medium text-foreground">
              {proposal.role} · {proposal.industry}
            </p>
            {proposal.positioning && (
              <p className="text-xs text-muted-foreground italic">
                &ldquo;{proposal.positioning}&rdquo;
              </p>
            )}
            {proposal.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {proposal.expertise.map((exp, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-foreground"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 space-y-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Principles & Red Lines
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground">Values:</span>{' '}
                {proposal.values.join(', ') || 'Clarity, substance'}
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">Tone Red Lines:</span>{' '}
                {proposal.toneRedLines.join(', ') || 'No corporate platitudes'}
              </div>
            </div>
          </div>

          <div className="pt-3 space-y-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Audience & Objective
            </span>
            <p className="text-xs text-foreground">
              <span className="font-semibold">Persona:</span>{' '}
              {proposal.targetAudience || 'Industry peers & decision makers'}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              <span className="font-semibold">Primary Goal:</span>{' '}
              {proposal.primaryObjective} · Level {proposal.expertiseLevel}
            </p>
          </div>

          <div className="pt-3 space-y-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Voice Style & Platforms
            </span>
            <p className="text-xs text-foreground">
              Formality {proposal.formality}/5 · {proposal.length} length · {proposal.emoji} emojis ·{' '}
              {proposal.hookStyle} hooks
            </p>
            <div className="flex gap-2 pt-1">
              {proposal.platforms.map((plat) => (
                <span
                  key={plat}
                  className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary"
                >
                  {plat}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border/40">
          <button
            type="button"
            onClick={onEditInForm}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-input text-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            <IconPencil className="w-4 h-4" />
            <span>{t('editInForm')}</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirming}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md"
          >
            <IconCheck className="w-4 h-4" />
            <span>{confirming ? 'Activating...' : t('acceptSave')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
