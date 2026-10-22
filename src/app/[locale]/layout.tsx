import React from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import {
  routing,
  getLocaleDirection,
  type SupportedLocale,
} from '@/i18n/routing';
import { ThemeProvider } from '@/components/common/ThemeProvider';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as SupportedLocale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = getLocaleDirection(locale);

  return (
    <div dir={dir} lang={locale} className="flex min-h-screen flex-col">
      <NextIntlClientProvider messages={messages}>
        <ThemeProvider>{children}</ThemeProvider>
      </NextIntlClientProvider>
    </div>
  );
}
