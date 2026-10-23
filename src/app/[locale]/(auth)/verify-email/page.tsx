'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function VerifyEmailPage() {
  const t = useTranslations('Auth');

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4 text-text">
      <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-xl font-bold text-accent">
          ✉
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t('verifyTitle')}
        </h1>
        <p className="text-sm text-muted">{t('verifySubtitle')}</p>
        <div className="flex w-full flex-col gap-2 pt-4">
          <Link href="/login" className="w-full">
            <Button variant="secondary" className="w-full">
              {t('logIn')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
