'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function AccountSettingsPage() {
  const t = useTranslations('Auth');
  const router = useRouter();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, confirmationText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete account');
      } else {
        router.push('/login');
        router.refresh();
      }
    } catch {
      setError('An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-text">
      <Sidebar
        isMobileOpen={mobileDrawerOpen}
        onCloseMobile={() => setMobileDrawerOpen(false)}
      />

      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Account Settings"
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex max-w-workspace flex-col gap-8 pb-12">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-text">
                Security & Account
              </h2>
              <p className="pt-1 text-sm text-muted">
                Manage your credentials, data export, and account retention.
              </p>
            </div>

            {/* Danger Zone: Account Deletion */}
            <Card className="border-danger/30 flex flex-col gap-4 bg-surface">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-danger">
                  {t('deleteAccount')}
                </h3>
                <p className="text-xs leading-relaxed text-muted">
                  {t('deleteWarning')}
                </p>
              </div>

              {error && (
                <div className="rounded-control border border-danger bg-surface-raised p-3 text-xs text-danger">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleDelete}
                className="flex flex-col gap-4 pt-2"
              >
                <Input
                  label={t('passwordLabel')}
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                />

                <Input
                  label={t('typeDeleteToConfirm')}
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  required
                  placeholder="DELETE"
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="border-danger bg-danger text-white hover:opacity-90"
                    disabled={loading || !currentPassword || !confirmationText}
                  >
                    {loading ? '...' : t('confirmDeletion')}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
