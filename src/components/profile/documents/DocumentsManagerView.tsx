'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { DocumentPrivacyConsentModal } from './DocumentPrivacyConsentModal';
import { DocumentUploadZone } from './DocumentUploadZone';
import { DocumentList } from './DocumentList';
import { InsightReviewDrawer } from './InsightReviewDrawer';
import { DocumentDeleteModal } from './DocumentDeleteModal';
import { ApprovedFactsList } from './ApprovedFactsList';
import type { Document } from '@/lib/db/schema';
import { IconLoader2, IconFileText } from '@tabler/icons-react';

export function DocumentsManagerView() {
  const t = useTranslations('Documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [extractingDocId, setExtractingDocId] = useState<string | null>(null);

  // Modal / Drawer states
  const [reviewingDoc, setReviewingDoc] = useState<Document | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null);
  const [factsRefreshCounter, setFactsRefreshCounter] = useState(0);

  const fetchConsentStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/documents/consent');
      if (res.ok) {
        const data = await res.json();
        setHasConsent(Boolean(data.acknowledged));
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsentStatus();
    fetchDocuments();
  }, [fetchConsentStatus, fetchDocuments]);

  const handleTriggerExtract = async (doc: Document) => {
    setExtractingDocId(doc.id);
    try {
      const res = await fetch(`/api/profile/documents/${doc.id}/extract`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchDocuments();
        setReviewingDoc(doc);
      }
    } catch {
      // Handled in list status
    } finally {
      setExtractingDocId(null);
      fetchDocuments();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground gap-2">
        <IconLoader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span>Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Privacy Notice Modal */}
      <DocumentPrivacyConsentModal
        isOpen={isConsentModalOpen}
        onConsentSuccess={() => {
          setHasConsent(true);
          setIsConsentModalOpen(false);
        }}
        onCancel={() => setIsConsentModalOpen(false)}
      />

      {/* Insight Review Drawer */}
      <InsightReviewDrawer
        isOpen={Boolean(reviewingDoc)}
        document={reviewingDoc}
        onClose={() => setReviewingDoc(null)}
        onFactsUpdated={() => setFactsRefreshCounter((c) => c + 1)}
      />

      {/* Delete Document Confirmation Modal */}
      <DocumentDeleteModal
        isOpen={Boolean(deletingDoc)}
        document={deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onDeleteSuccess={() => {
          fetchDocuments();
          setFactsRefreshCounter((c) => c + 1);
        }}
      />

      {/* Header Description */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <IconFileText className="w-5 h-5 text-foreground" />
          <h2 className="text-base font-semibold text-foreground">
            {t('uploadTitle')}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('uploadSubtitle')}
        </p>
      </div>

      {/* Upload Dropzone */}
      <DocumentUploadZone
        currentDocumentCount={documents.length}
        hasConsent={hasConsent}
        onRequestConsent={() => setIsConsentModalOpen(true)}
        onUploadSuccess={fetchDocuments}
      />

      {/* Document List */}
      <DocumentList
        documents={documents}
        extractingDocId={extractingDocId}
        onTriggerExtract={handleTriggerExtract}
        onOpenReview={(doc) => setReviewingDoc(doc)}
        onRequestDelete={(doc) => setDeletingDoc(doc)}
      />

      {/* Approved Facts View */}
      <ApprovedFactsList refreshTrigger={factsRefreshCounter} />
    </div>
  );
}
