'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { IconLanguage } from '@tabler/icons-react';

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as 'en' | 'fr' | 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-2 py-1 text-sm text-text">
      <IconLanguage size={16} className="text-muted" aria-hidden="true" />
      <label htmlFor="locale-switcher" className="sr-only">
        Language
      </label>
      <select
        id="locale-switcher"
        value={currentLocale}
        onChange={handleLocaleChange}
        className="cursor-pointer border-none bg-transparent text-xs font-medium text-text focus:outline-none"
      >
        <option value="en" className="bg-surface text-text">
          English
        </option>
        <option value="fr" className="bg-surface text-text">
          Français
        </option>
        <option value="ar" className="bg-surface text-text">
          العربية
        </option>
      </select>
    </div>
  );
}
