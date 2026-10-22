import type { Metadata } from 'next';
import React from 'react';
import { cookies } from 'next/headers';
import { parseThemeCookie, THEME_COOKIE_NAME } from '@/lib/theme';
import { inter, instrumentSerif, notoSansArabic } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saouti',
  description: 'AI-assisted professional voice generation platform',
};

// Zero-flash inline script to check OS preference when preference === 'system'
const themeScript = `
(function() {
  try {
    var stored = document.cookie.match(/saouti-theme=([^;]+)/);
    var pref = stored ? stored[1] : 'system';
    var theme = pref;
    if (pref === 'system' || !pref) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawTheme = cookieStore.get(THEME_COOKIE_NAME)?.value;
  const initialPref = parseThemeCookie(rawTheme);
  // If explicitly light or dark, render on the HTML tag server-side. If system, default to dark and let blocking script verify.
  const serverTheme = initialPref === 'light' ? 'light' : 'dark';

  return (
    <html
      lang="en"
      data-theme={serverTheme}
      className={`${inter.variable} ${instrumentSerif.variable} ${notoSansArabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg text-text antialiased selection:bg-accent-soft selection:text-accent">
        {children}
      </body>
    </html>
  );
}
