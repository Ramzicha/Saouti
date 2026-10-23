'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('invalidCredentials'));
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

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
            {t('logIn')}
          </h1>
          <p className="text-xs text-muted">{t('logInSubtitle')}</p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-control border border-danger bg-surface-raised p-3 text-xs text-danger"
          >
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

          <div className="flex flex-col gap-1">
            <Input
              label={t('passwordLabel')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div className="flex justify-end pt-1">
              <Link
                href="/forgot-password"
                className="text-xs text-muted transition-colors hover:text-accent"
              >
                {t('forgotPassword')}
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="mt-2 w-full"
            disabled={loading}
          >
            {loading ? '...' : t('submitLogIn')}
          </Button>
        </form>

        <div className="text-center text-xs text-muted">
          <span>{t('dontHaveAccount')} </span>
          <Link
            href="/signup"
            className="font-medium text-accent hover:underline"
          >
            {t('signUp')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
