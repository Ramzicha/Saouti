'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconUser,
  IconSparkles,
  IconKey,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import clsx from 'clsx';

interface SettingsNavProps {
  activeTab: 'profile' | 'voice' | 'keys';
  locale?: string;
}

export function SettingsNav({ activeTab }: SettingsNavProps) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const isRtl = locale === 'ar';
  const BackIcon = isRtl ? IconChevronRight : IconChevronLeft;

  const tabs = [
    {
      id: 'profile',
      label: locale === 'fr' ? 'Profil' : locale === 'ar' ? 'الملف الشخصي' : 'Profile',
      sublabel: locale === 'fr' ? 'Nom, email, mot de passe & photo' : locale === 'ar' ? 'الاسم والبريد وكلمة المرور' : 'Name, email, password & picture',
      href: `/${locale}/settings/account`,
      icon: IconUser,
    },
    {
      id: 'voice',
      label: locale === 'fr' ? 'Profil Vocal' : locale === 'ar' ? 'نبرة الصوت' : 'Voice Profile',
      sublabel: locale === 'fr' ? 'Style, ton, plateformes & documents' : locale === 'ar' ? 'الأسلوب والنبرة والمستندات' : 'Style, tone, platforms & documents',
      href: `/${locale}/settings/profile`,
      icon: IconSparkles,
    },
    {
      id: 'keys',
      label: locale === 'fr' ? 'Clés API' : locale === 'ar' ? 'مفاتيح API' : 'API Keys',
      sublabel: locale === 'fr' ? 'Gemini, Tavily & modèles IA' : locale === 'ar' ? 'مزودات الذكاء الاصطناعي' : 'Gemini, Tavily & AI models',
      href: `/${locale}/settings/keys`,
      icon: IconKey,
    },
  ];

  return (
    <div className="space-y-5 pb-2">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <BackIcon className="w-4 h-4" aria-hidden="true" />
          <span>{locale === 'fr' ? 'Espace de travail' : locale === 'ar' ? 'مساحة العمل' : 'Workspace'}</span>
        </Link>
        <span className="text-muted-foreground/40 text-xs">/</span>
        <span className="text-xs font-semibold text-muted-foreground">
          {locale === 'fr' ? 'Paramètres' : locale === 'ar' ? 'الإعدادات' : 'Settings'}
        </span>
        <span className="text-muted-foreground/40 text-xs">/</span>
        <span className="text-xs font-semibold text-foreground">
          {tabs.find((t) => t.id === activeTab)?.label}
        </span>
      </div>

      {/* Main Settings Tabs Bar */}
      <nav
        aria-label="Settings navigation"
        className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border/70 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={clsx(
                'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 select-none',
                isActive
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <div className="flex flex-col text-start">
                <span>{tab.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
