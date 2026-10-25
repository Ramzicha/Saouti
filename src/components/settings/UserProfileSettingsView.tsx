'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconUser,
  IconMail,
  IconLock,
  IconCamera,
  IconCheck,
  IconLoader2,
  IconAlertCircle,
  IconTrash,
  IconSparkles,
} from '@tabler/icons-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from '@/i18n/routing';

interface UserProfileData {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt?: string;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export function UserProfileSettingsView() {
  const tAuth = useTranslations('Auth');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Profile save states
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Avatar upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Account deletion states
  const [deleteCurrentPassword, setDeleteCurrentPassword] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name || '');
          setEmail(data.user.email || '');
          setAvatarUrl(data.user.avatarUrl || null);
        }
      }
    } catch {
      setProfileError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setSavingProfile(true);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, avatarUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'Failed to update profile');
      } else {
        setProfileSuccess(true);
        setProfile(data.user);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch {
      setProfileError('An unexpected network error occurred.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileError('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'Failed to upload avatar image');
      } else {
        setAvatarUrl(data.avatarUrl);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch {
      setProfileError('Failed to upload image file.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectPresetAvatar = async (presetUrl: string) => {
    setAvatarUrl(presetUrl);
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: presetUrl }),
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError('Failed to save avatar.');
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: null }),
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError('Failed to remove avatar.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password');
      } else {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch {
      setPasswordError('An unexpected network error occurred.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    setDeletingAccount(true);

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: deleteCurrentPassword,
          confirmationText: deleteConfirmationText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete account');
      } else {
        router.push('/login');
        router.refresh();
      }
    } catch {
      setDeleteError('An unexpected network error occurred.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const initials = (name || profile?.email || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground gap-2">
        <IconLoader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span>Loading profile settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Title & Intro */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profile & Account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal identity, email address, profile picture, and account security.
        </p>
      </div>

      {/* Global Alerts */}
      {profileError && (
        <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-3 text-sm">
          <IconAlertCircle className="w-5 h-5 shrink-0" />
          <span>{profileError}</span>
        </div>
      )}

      {profileSuccess && (
        <div className="p-4 rounded-xl border border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-3 text-sm animate-in fade-in duration-200">
          <IconCheck className="w-5 h-5 shrink-0" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* 1. Profile Picture Section */}
      <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border/70 space-y-6">
        <div className="flex items-center gap-2">
          <IconCamera className="w-5 h-5 text-foreground" />
          <h2 className="text-base font-semibold text-foreground">Profile Picture</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Preview */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border/80 bg-surface-raised flex items-center justify-center shadow-md">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'Profile avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-foreground tracking-wider">
                  {initials}
                </span>
              )}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-xs rounded-full flex items-center justify-center">
                <IconLoader2 className="w-6 h-6 animate-spin text-foreground" />
              </div>
            )}
          </div>

          {/* Upload and presets actions */}
          <div className="space-y-4 flex-1 text-center sm:text-start">
            <div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Upload a custom picture (PNG, JPG, WebP up to 5MB) or select a stylized avatar below.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarFileSelected}
                  className="hidden"
                  id="avatar_upload_input"
                />
                <label
                  htmlFor="avatar_upload_input"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-button text-on-button hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <IconCamera className="w-4 h-4" />
                  <span>Upload Photo</span>
                </label>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <IconTrash className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Curated Preset Avatars */}
            <div>
              <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Or pick a preset avatar
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPresetAvatar(preset)}
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-border hover:border-foreground/80 hover:scale-105 transition-all shadow-xs"
                    title={`Select avatar preset ${idx + 1}`}
                  >
                    <img
                      src={preset}
                      alt={`Preset ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Personal Information Section */}
      <form
        onSubmit={handleSaveProfile}
        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/70 space-y-6"
      >
        <div className="flex items-center gap-2">
          <IconUser className="w-5 h-5 text-foreground" />
          <h2 className="text-base font-semibold text-foreground">Personal Information</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="user_name"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Full Name
            </label>
            <input
              id="user_name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="user_email"
                className="text-xs font-semibold text-foreground"
              >
                Email Address
              </label>
              {profile?.emailVerified ? (
                <span className="text-[11px] font-semibold text-emerald-500 inline-flex items-center gap-1">
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="text-[11px] text-amber-500">Unverified</span>
              )}
            </div>
            <div className="relative">
              <input
                id="user_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-xs"
              />
              <IconMail className="w-4 h-4 text-muted-foreground absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-button text-on-button font-semibold text-xs shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {savingProfile ? (
              <IconLoader2 className="w-4 h-4 animate-spin" />
            ) : (
              <IconCheck className="w-4 h-4" />
            )}
            <span>Save Profile Changes</span>
          </button>
        </div>
      </form>

      {/* 3. Password & Security Section */}
      <form
        onSubmit={handlePasswordChange}
        className="p-6 sm:p-8 rounded-2xl bg-card border border-border/70 space-y-6"
      >
        <div className="flex items-center gap-2">
          <IconLock className="w-5 h-5 text-foreground" />
          <h2 className="text-base font-semibold text-foreground">Change Password</h2>
        </div>

        {passwordError && (
          <div className="p-3 rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs">
            {passwordError}
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 rounded-lg border border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400 text-xs flex items-center gap-2">
            <IconCheck className="w-4 h-4" />
            <span>Password updated successfully!</span>
          </div>
        )}

        <div className="space-y-4 max-w-md">
          <div>
            <label
              htmlFor="current_password"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Current Password
            </label>
            <input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-xs"
            />
          </div>

          <div>
            <label
              htmlFor="new_password"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              New Password
            </label>
            <input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-xs"
            />
          </div>

          <div>
            <label
              htmlFor="confirm_password"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Confirm New Password
            </label>
            <input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all shadow-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingPassword || !currentPassword || !newPassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-button text-on-button font-semibold text-xs shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {savingPassword && <IconLoader2 className="w-4 h-4 animate-spin" />}
            <span>Update Password</span>
          </button>
        </div>
      </form>

      {/* 4. Danger Zone: Delete Account */}
      <Card className="border-danger/30 flex flex-col gap-4 bg-surface p-6 sm:p-8 rounded-2xl">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-danger">
            {tAuth('deleteAccount')}
          </h3>
          <p className="text-xs leading-relaxed text-muted">
            {tAuth('deleteWarning')}
          </p>
        </div>

        {deleteError && (
          <div className="rounded-control border border-danger bg-surface-raised p-3 text-xs text-danger">
            {deleteError}
          </div>
        )}

        <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4 pt-2 max-w-md">
          <Input
            label={tAuth('passwordLabel')}
            type="password"
            value={deleteCurrentPassword}
            onChange={(e) => setDeleteCurrentPassword(e.target.value)}
            required
            placeholder="Enter current password"
          />

          <Input
            label={tAuth('typeDeleteToConfirm')}
            type="text"
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            required
            placeholder="DELETE"
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="border-danger bg-danger text-white hover:opacity-90"
              disabled={deletingAccount || !deleteCurrentPassword || !deleteConfirmationText}
            >
              {deletingAccount ? '...' : tAuth('confirmDeletion')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
