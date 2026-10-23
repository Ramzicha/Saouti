'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function ResetPasswordPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4 text-text">
      <Card className="flex w-full max-w-md flex-col gap-6 p-8">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-medium tracking-tight text-text">
            {t('newPasswordLabel')}
          </h1>
          <p className="text-xs text-muted">{t('passwordHint')}</p>
        </div>

        {error && (
          <div className="rounded-control border border-danger bg-surface-raised p-3 text-xs text-danger">
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-text">
              Your password has been successfully updated.
            </p>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              {t('logIn')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label={t('newPasswordLabel')}
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
              disabled={loading || !token}
            >
              {loading ? '...' : t('updatePasswordButton')}
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
