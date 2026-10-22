import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Saouti',
  description: 'AI-assisted professional voice generation platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
