'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const t = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4 text-text">
      <Card className="flex w-full max-w-md flex-col gap-6 p-8">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-medium tracking-tight text-text">
            {t('resetTitle')}
          </h1>
          <p className="text-xs text-muted">{t('resetSubtitle')}</p>
        </div>

        {submitted ? (
          <div className="flex flex-col gap-4 text-center">
            <div className="rounded-control border border-border bg-surface-raised p-3 text-xs text-text">
              {t('resetNotice')}
            </div>
            <Link href="/login">
              <Button variant="secondary" className="w-full">
                {t('logIn')}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label={t('emailLabel')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="name@company.com"
            />

            <Button
              type="submit"
              variant="primary"
              className="mt-2 w-full"
              disabled={loading}
            >
              {loading ? '...' : t('resetButton')}
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-muted">
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            ← {t('logIn')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
