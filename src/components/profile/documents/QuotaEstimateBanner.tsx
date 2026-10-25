'use client';

import React from 'react';
import { IconCoins, IconInfoCircle } from '@tabler/icons-react';
import type { Document } from '@/lib/db/schema';

interface QuotaEstimateBannerProps {
  document: Document;
}

export function QuotaEstimateBanner({ document }: QuotaEstimateBannerProps) {
  const estimatedTokens = Math.max(document.pageCount * 800, 1000);

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/60 border border-border/50 text-xs text-muted-foreground">
      <IconCoins className="w-4 h-4 text-foreground shrink-0" />
      <div className="flex items-center gap-2 flex-wrap">
        <span>
          Estimated usage: <strong className="text-foreground">~{estimatedTokens.toLocaleString()} tokens</strong> ({document.pageCount} {document.pageCount === 1 ? 'page' : 'pages'})
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 text-[11px]">
          <IconInfoCircle className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Billed directly via your configured AI key with zero markup</span>
        </span>
      </div>
    </div>
  );
}
