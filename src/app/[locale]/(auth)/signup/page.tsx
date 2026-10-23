'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function SignUpPage() {
  const t = useTranslations('Auth');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4 text-text">
        <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-xl font-bold text-accent">
            ✓
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t('verifyTitle')}
          </h1>
          <p className="text-sm text-muted">{t('verifySubtitle')}</p>
          <div className="w-full pt-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              {t('logIn')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4 text-text">
      <Card className="flex w-full max-w-md flex-col gap-6 p-8">
        <div className="flex flex-col gap-1 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-accent">
              S
            </span>
            <span className="text-xl font-semibold tracking-tight">Saouti</span>
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-text">
            {t('signUp')}
          </h1>
          <p className="text-xs text-muted">{t('signUpSubtitle')}</p>
        </div>

        {error && (
          <div className="rounded-control border border-danger bg-surface-raised p-3 text-xs text-danger">
            {error}
          </div>
        )}

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

          <Input
            label={t('passwordLabel')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder={t('passwordHint')}
          />

          <Button
            type="submit"
            variant="primary"
            className="mt-2 w-full"
            disabled={loading}
          >
            {loading ? '...' : t('submitSignUp')}
          </Button>
        </form>

        <div className="text-center text-xs text-muted">
          <span>{t('alreadyHaveAccount')} </span>
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            {t('logIn')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
