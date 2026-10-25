'use client';

import React, { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  IconUpload,
  IconFileTypePdf,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
} from '@tabler/icons-react';
import {
  DOCUMENT_TYPES,
  type DocumentType,
  MAX_DOCUMENTS_PER_USER,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from '@/lib/documents/schemas';
import clsx from 'clsx';

interface DocumentUploadZoneProps {
  currentDocumentCount: number;
  onUploadSuccess: () => void;
  onRequestConsent: () => void;
  hasConsent: boolean;
}

export function DocumentUploadZone({
  currentDocumentCount,
  onUploadSuccess,
  onRequestConsent,
  hasConsent,
}: DocumentUploadZoneProps) {
  const t = useTranslations('Documents');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('cv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLimitReached = currentDocumentCount >= MAX_DOCUMENTS_PER_USER;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLimitReached && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLimitReached || uploading) return;

    if (!hasConsent) {
      onRequestConsent();
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    // Reset file input so user can re-select same file if desired
    e.target.value = '';
  };

  const processSelectedFile = (file: File) => {
    setError(null);
    setSuccessMsg(null);

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError(t('invalidFormat'));
      return;
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      setError(t('fileTooLarge'));
      return;
    }

    setSelectedFile(file);
  };

  const handleTriggerUpload = async () => {
    if (!selectedFile) return;

    if (!hasConsent) {
      onRequestConsent();
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', selectedType);

      const res = await fetch('/api/profile/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error?.code === 'CONSENT_REQUIRED') {
          onRequestConsent();
          return;
        }
        if (data.error?.code === 'ENCRYPTED_PDF') {
          throw new Error(t('encryptedPdfError'));
        }
        if (data.error?.code === 'TOO_MANY_PAGES') {
          throw new Error(data.error.message || t('tooManyPages', { count: 20 }));
        }
        throw new Error(data.error?.message || 'Failed to upload document');
      }

      setSelectedFile(null);
      setSuccessMsg(t('statusUploaded'));
      onUploadSuccess();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getTypeLabel = (type: DocumentType) => {
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
    <div className="space-y-4">
      {/* Cap Indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {currentDocumentCount} / {MAX_DOCUMENTS_PER_USER} {t('tabTitle')}
        </span>
        {isLimitReached && (
          <span className="text-amber-500 dark:text-amber-400 font-medium">
            {t('limitReached')}
          </span>
        )}
      </div>

      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isLimitReached && !uploading) {
            if (!hasConsent) {
              onRequestConsent();
            } else {
              fileInputRef.current?.click();
            }
          }
        }}
        className={clsx(
          'relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-foreground/80 bg-surface-raised scale-[1.005]'
            : 'border-border/70 bg-card/40 hover:border-border hover:bg-card/70',
          isLimitReached && 'opacity-60 cursor-not-allowed pointer-events-none',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          disabled={isLimitReached || uploading}
          className="hidden"
          aria-label={t('dropzonePrompt')}
        />

        <div className="w-12 h-12 rounded-2xl bg-surface-raised flex items-center justify-center text-foreground mb-3">
          <IconUpload className="w-6 h-6" />
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-1">
          {t('dropzonePrompt')}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          {t('dropzoneHint')}
        </p>

        {selectedFile && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised text-foreground text-xs font-medium border border-border">
            <IconFileTypePdf className="w-4 h-4" />
            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
            <span>({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
          </div>
        )}
      </div>

      {/* Type Selector & Submit Action */}
      {selectedFile && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-4 rounded-xl bg-card border border-border/60 space-y-4 animate-in fade-in duration-200"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {t('documentTypeLabel')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DOCUMENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={clsx(
                    'px-3 py-2 text-xs font-medium rounded-lg border text-start transition-all',
                    selectedType === type
                      ? 'border-foreground/80 bg-surface-raised text-foreground font-semibold'
                      : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              disabled={uploading}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              {t('deleteCancelButton')}
            </button>
            <button
              type="button"
              onClick={handleTriggerUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-button text-on-button hover:opacity-90 rounded-xl shadow transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                  <span>{t('uploading')}</span>
                </>
              ) : (
                <>
                  <IconUpload className="w-4 h-4" />
                  <span>{t('uploadButton')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Status / Error feedback */}
      {error && (
        <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <IconAlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 text-xs flex items-center gap-2">
          <IconCheck className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
