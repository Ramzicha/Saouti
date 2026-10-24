'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  IconFileTypePdf,
  IconDownload,
  IconTrash,
  IconSparkles,
  IconCheck,
  IconAlertTriangle,
  IconLoader2,
  IconListDetails,
} from '@tabler/icons-react';
import type { Document } from '@/lib/db/schema';
import { QuotaEstimateBanner } from './QuotaEstimateBanner';

interface DocumentListProps {
  documents: Document[];
  onTriggerExtract: (doc: Document) => void;
  onOpenReview: (doc: Document) => void;
  onRequestDelete: (doc: Document) => void;
  extractingDocId?: string | null;
}

export function DocumentList({
  documents,
  onTriggerExtract,
  onOpenReview,
  onRequestDelete,
  extractingDocId,
}: DocumentListProps) {
  const t = useTranslations('Documents');

  if (documents.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (doc: Document) => {
    const isExtracting = extractingDocId === doc.id || doc.status === 'processing';

    if (isExtracting) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{t('statusProcessing')}</span>
        </span>
      );
    }

    if (doc.status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
          <IconCheck className="w-3.5 h-3.5" />
          <span>{t('statusCompleted')}</span>
        </span>
      );
    }

    if (doc.status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
          <IconAlertTriangle className="w-3.5 h-3.5" />
          <span>{t('statusFailed')}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/50">
        <span>{t('statusUploaded')}</span>
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cv':
        return t('typeCv');
      case 'bio':
        return t('typeBio');
      case 'articles':
        return t('typeArticles');
      case 'company_brochure':
        return t('typeBrochure');
      default:
        return t('typeOther');
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t('tabTitle')} ({documents.length})
      </h3>

      <div className="divide-y divide-border/50 border border-border/60 rounded-2xl bg-card overflow-hidden">
        {documents.map((doc) => {
          const isExtracting = extractingDocId === doc.id || doc.status === 'processing';

          return (
            <div
              key={doc.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
            >
              {/* Document details */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <IconFileTypePdf className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-semibold text-foreground truncate max-w-[240px] sm:max-w-xs">
                      {doc.originalFileName}
                    </h4>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40">
                      {getTypeLabel(doc.documentType)}
                    </span>
                    {getStatusBadge(doc)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.fileSizeBytes)}</span>
                    <span>•</span>
                    <span>{t('pages', { count: doc.pageCount })}</span>
                    <span>•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                  {doc.errorMessage && (
                    <p className="text-xs text-destructive mt-1">
                      {doc.errorMessage}
                    </p>
                  )}
                  {doc.status === 'uploaded' && (
                    <div className="mt-2.5">
                      <QuotaEstimateBanner document={doc} />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {/* Analyze / Extract button */}
                {doc.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => onTriggerExtract(doc)}
                    disabled={isExtracting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors disabled:opacity-50"
                  >
                    <IconSparkles className="w-4 h-4" />
                    <span>{isExtracting ? t('extracting') : t('extractButton')}</span>
                  </button>
                )}

                {/* Review Insights button */}
                {doc.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => onOpenReview(doc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow transition-colors"
                  >
                    <IconListDetails className="w-4 h-4" />
                    <span>{t('viewInsights', { count: '' })}</span>
                  </button>
                )}

                {/* Download PDF button */}
                <a
                  href={`/api/profile/documents/${doc.id}/file`}
                  download={doc.originalFileName}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title={t('downloadFile')}
                  aria-label={t('downloadFile')}
                >
                  <IconDownload className="w-4 h-4" />
                </a>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onRequestDelete(doc)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                  title={t('deleteDocument')}
                  aria-label={t('deleteDocument')}
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
