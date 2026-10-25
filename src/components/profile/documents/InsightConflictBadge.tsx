'use client';

import React from 'react';
import { IconAlertTriangle, IconUserCheck, IconFileCheck } from '@tabler/icons-react';
import type { ConflictResult } from '@/lib/documents/conflict-detector';

interface InsightConflictBadgeProps {
  conflict: ConflictResult;
  onUseProfile?: () => void;
  onUseProposal?: () => void;
}

export function InsightConflictBadge({
  conflict,
  onUseProfile,
  onUseProposal,
}: InsightConflictBadgeProps) {
  return (
    <div className="mt-2.5 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 text-xs space-y-2">
      <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
        <IconAlertTriangle className="w-4 h-4 shrink-0" />
        <span>Profile Discrepancy Detected ({conflict.field})</span>
      </div>

      <p className="text-muted-foreground text-[11px] leading-relaxed">
        {conflict.resolutionHint}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
        <div className="p-2 rounded-lg bg-card/80 border border-border/50">
          <span className="font-semibold text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">
            Current Profile:
          </span>
          <span className="text-foreground font-medium">{conflict.profileValue}</span>
          {onUseProfile && (
            <button
              type="button"
              onClick={onUseProfile}
              className="mt-1.5 flex items-center gap-1 text-[11px] text-foreground hover:underline font-semibold"
            >
              <IconUserCheck className="w-3 h-3" />
              <span>Keep profile</span>
            </button>
          )}
        </div>

        <div className="p-2 rounded-lg bg-card/80 border border-border/50">
          <span className="font-semibold text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">
            Document Proposal:
          </span>
          <span className="text-foreground font-medium line-clamp-2">
            {conflict.documentValue}
          </span>
          {onUseProposal && (
            <button
              type="button"
              onClick={onUseProposal}
              className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold"
            >
              <IconFileCheck className="w-3 h-3" />
              <span>Use document</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
