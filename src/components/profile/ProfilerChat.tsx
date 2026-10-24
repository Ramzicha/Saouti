'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ChatMessage, ProfilerProposal } from '@/lib/profile/profiler-agent';
import { ProfilerProposalModal } from './ProfilerProposalModal';
import { KeySetupDialog } from '@/components/keys/KeySetupDialog';
import { BrandLogo } from '@/components/common/BrandLogo';
import {
  IconSend,
  IconRobot,
  IconUser,
  IconLoader2,
  IconAlertTriangle,
  IconArrowLeft,
  IconX,
} from '@tabler/icons-react';
import clsx from 'clsx';

interface ProfilerChatProps {
  onSwitchToWizard?: () => void;
}

export function ProfilerChat({ onSwitchToWizard }: ProfilerChatProps) {
  const t = useTranslations('Profiler');
  const locale = useLocale();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [proposal, setProposal] = useState<ProfilerProposal | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: t('greeting'),
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [messages.length, t]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setKeyError(null);

    const newHistory: ChatMessage[] = [
      ...messages,
      {
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch('/api/profile/profiler/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, locale }),
      });

      if (!res.ok) {
        const errData = await res.json();
        if (res.status === 429 || errData.error?.code === 'KEY_ERROR') {
          setKeyError(errData.error?.message || t('pausedKeyError'));
          return;
        }
        throw new Error(errData.error?.message || 'Chat turn failed');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);

      if (data.isComplete && data.proposedProfile) {
        setProposal(data.proposedProfile);
        setShowProposalModal(true);
      }
    } catch (err: unknown) {
      setKeyError(err instanceof Error ? err.message : 'Error communicating with Profiler');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmProposal = async () => {
    if (!proposal) return;
    setConfirming(true);

    try {
      const res = await fetch('/api/profile/profiler/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to activate profile');
      }

      router.push('/');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error confirming profile');
      setConfirming(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-card rounded-2xl border border-border/60 shadow-xl flex flex-col h-[750px] relative overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border/40 flex items-center justify-between bg-card/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            <IconRobot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{t('title')}</h2>
            <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>

        {onSwitchToWizard && (
          <button
            type="button"
            onClick={onSwitchToWizard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <IconArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Form</span>
          </button>
        )}
      </div>

      {/* Chat Messages Log */}
      <div
        aria-live="polite"
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
      >
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={clsx(
                'flex items-start gap-3 text-sm animate-in fade-in',
                isUser ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold',
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground border border-border',
                )}
              >
                {isUser ? <IconUser className="w-4 h-4" /> : <BrandLogo variant="icon" height={18} width={18} />}
              </div>
              <div
                className={clsx(
                  'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
                  isUser
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted/70 text-foreground border border-border/50 rounded-tl-none whitespace-pre-wrap',
                )}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground italic pl-11">
            <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{t('thinking')}</span>
          </div>
        )}

        {/* Quota / Key failure alert box */}
        {keyError && (
          <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <IconAlertTriangle className="w-4 h-4 shrink-0" />
              <span>{keyError}</span>
            </div>
            <p>
              Your interview transcript is saved safely. Update or verify your Gemini key to resume right where you left off.
            </p>
            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors"
            >
              {t('updateKey')}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleSend}
        className="p-3 sm:p-4 border-t border-border/40 bg-card/90 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || Boolean(keyError)}
          placeholder={t('inputPlaceholder')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || Boolean(keyError)}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>{t('send')}</span>
          <IconSend className="w-4 h-4" />
        </button>
      </form>

      {/* Proposal Modal */}
      <ProfilerProposalModal
        isOpen={showProposalModal}
        proposal={proposal}
        onClose={() => setShowProposalModal(false)}
        onConfirm={handleConfirmProposal}
        onEditInForm={() => {
          setShowProposalModal(false);
          onSwitchToWizard?.();
        }}
        confirming={confirming}
      />

      {/* In-context Key Setup Dialog Modal */}
      {showKeyModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-foreground">Update API Key</h3>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <KeySetupDialog
              onKeySaved={() => {
                setShowKeyModal(false);
                setKeyError(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
