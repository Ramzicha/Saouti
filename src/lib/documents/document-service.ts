import crypto from 'node:crypto';
import { db } from '@/lib/db/client';
import {
  documents,
  documentInsights,
  approvedFacts,
  documentPrivacyConsents,
  type Document,
  type DocumentInsight,
  type ApprovedFact,
  type DocumentPrivacyConsent,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getStorageProvider } from '@/lib/storage/local-storage';
import { encryptText } from '@/lib/crypto/key-encryption';
import {
  type DocumentType,
  MAX_DOCUMENTS_PER_USER,
} from './schemas';

export class DocumentService {
  /**
   * Checks whether the user has acknowledged the privacy consent notice.
   */
  static async hasPrivacyConsent(userId: string): Promise<boolean> {
    const [consent] = await db
      .select({ id: documentPrivacyConsents.id })
      .from(documentPrivacyConsents)
      .where(eq(documentPrivacyConsents.userId, userId))
      .limit(1);

    return Boolean(consent);
  }

  /**
   * Retrieves the full privacy consent record for a user.
   */
  static async getPrivacyConsent(userId: string): Promise<DocumentPrivacyConsent | null> {
    const [consent] = await db
      .select()
      .from(documentPrivacyConsents)
      .where(eq(documentPrivacyConsents.userId, userId))
      .limit(1);

    return consent || null;
  }

  /**
   * Records that the user has acknowledged the privacy notice.
   */
  static async recordPrivacyConsent(
    userId: string,
    noticeVersion = 'v1',
  ): Promise<DocumentPrivacyConsent> {
    const [inserted] = await db
      .insert(documentPrivacyConsents)
      .values({
        userId,
        noticeVersion,
      })
      .onConflictDoUpdate({
        target: documentPrivacyConsents.userId,
        set: {
          noticeVersion,
          acknowledgedAt: new Date(),
        },
      })
      .returning();

    return inserted;
  }

  /**
   * Lists all uploaded documents for a given user ordered by creation date desc.
   */
  static async listDocuments(userId: string): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  /**
   * Retrieves a document by its ID ensuring strict user ID isolation.
   */
  static async getDocumentById(id: string, userId: string): Promise<Document | null> {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .limit(1);

    return doc || null;
  }

  /**
   * Creates a new document record, saves the binary file on the private storage volume,
   * and optionally encrypts any extracted text at rest.
   */
  static async createDocument(params: {
    userId: string;
    originalFileName: string;
    fileSizeBytes: number;
    pageCount: number;
    documentType: DocumentType;
    buffer: Buffer;
    extractedText?: string | undefined;
  }): Promise<Document> {
    // 1. Verify 5-document limit per user
    const existingCount = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.userId, params.userId));

    if (existingCount.length >= MAX_DOCUMENTS_PER_USER) {
      throw new Error(`Maximum limit of ${MAX_DOCUMENTS_PER_USER} documents reached`);
    }

    const documentId = crypto.randomUUID();
    const storageKey = `documents/${params.userId}/${documentId}.pdf`;

    // 2. Persist binary to private storage volume
    const storage = getStorageProvider();
    await storage.saveFile(params.buffer, storageKey, 'application/pdf');

    // 3. Encrypt extracted text if provided
    let extractedTextEncrypted: string | null = null;
    let nonce: string | null = null;
    let authTag: string | null = null;

    if (params.extractedText && params.extractedText.trim().length > 0) {
      const encrypted = encryptText(params.extractedText);
      extractedTextEncrypted = encrypted.ciphertext;
      nonce = encrypted.nonce;
      authTag = encrypted.authTag;
    }

    // 4. Insert database record
    const [inserted] = await db
      .insert(documents)
      .values({
        id: documentId,
        userId: params.userId,
        storageKey,
        originalFileName: params.originalFileName,
        fileSizeBytes: params.fileSizeBytes,
        pageCount: params.pageCount,
        documentType: params.documentType,
        status: 'uploaded',
        extractedTextEncrypted,
        nonce,
        authTag,
      })
      .returning();

    return inserted;
  }

  /**
   * Deletes an uploaded document, permanently purges the physical file from storage,
   * and handles approved facts per the user's preference (Option A: retain, Option B: purge).
   */
  static async deleteDocument(
    id: string,
    userId: string,
    keepApprovedFacts = true,
  ): Promise<{ success: boolean; retainedFactsCount: number }> {
    const doc = await this.getDocumentById(id, userId);
    if (!doc) {
      throw new Error('Document not found or unauthorized');
    }

    // 1. Permanently delete binary file from private storage
    const storage = getStorageProvider();
    await storage.deleteFile(doc.storageKey);

    let retainedFactsCount = 0;

    if (keepApprovedFacts) {
      // Option A: Retain approved facts in profile as standalone facts (sever foreign keys)
      const updated = await db
        .update(approvedFacts)
        .set({
          sourceDocumentId: null,
          sourceInsightId: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(approvedFacts.userId, userId),
            eq(approvedFacts.sourceDocumentId, id),
          ),
        )
        .returning();

      retainedFactsCount = updated.length;
    } else {
      // Option B: Remove all approved facts associated with this document
      await db
        .delete(approvedFacts)
        .where(
          and(
            eq(approvedFacts.userId, userId),
            eq(approvedFacts.sourceDocumentId, id),
          ),
        );
    }

    // 2. Cascade delete documentInsights and document record
    await db.delete(documentInsights).where(eq(documentInsights.documentId, id));
    await db.delete(documents).where(eq(documents.id, id));

    return {
      success: true,
      retainedFactsCount,
    };
  }

  /**
   * Lists extracted insights for a specific document.
   */
  static async listInsightsForDocument(
    documentId: string,
    userId: string,
  ): Promise<DocumentInsight[]> {
    return db
      .select()
      .from(documentInsights)
      .where(
        and(
          eq(documentInsights.documentId, documentId),
          eq(documentInsights.userId, userId),
        ),
      )
      .orderBy(documentInsights.sourcePage);
  }

  /**
   * Reviews a proposed insight (accept, edit, or reject).
   * Accepting or editing converts the insight into an ApprovedFact.
   */
  static async reviewInsight(params: {
    insightId: string;
    userId: string;
    action: 'accept' | 'edit' | 'reject';
    editedText?: string;
  }): Promise<{ insight: DocumentInsight; approvedFact: ApprovedFact | null }> {
    const [insight] = await db
      .select()
      .from(documentInsights)
      .where(
        and(
          eq(documentInsights.id, params.insightId),
          eq(documentInsights.userId, params.userId),
        ),
      )
      .limit(1);

    if (!insight) {
      throw new Error('Insight not found or unauthorized');
    }

    let nextStatus: 'approved' | 'edited' | 'rejected' = 'approved';
    let finalText = insight.rawText;

    if (params.action === 'edit') {
      if (!params.editedText || params.editedText.trim().length === 0) {
        throw new Error('Edited text is required when action is edit');
      }
      nextStatus = 'edited';
      finalText = params.editedText.trim();
    } else if (params.action === 'reject') {
      nextStatus = 'rejected';
    }

    // 1. Update insight record
    const [updatedInsight] = await db
      .update(documentInsights)
      .set({
        status: nextStatus,
        editedText: nextStatus === 'edited' ? finalText : insight.editedText,
        reviewedAt: new Date(),
      })
      .where(eq(documentInsights.id, params.insightId))
      .returning();

    let fact: ApprovedFact | null = null;

    // 2. If approved or edited, create or update ApprovedFact
    if (nextStatus === 'approved' || nextStatus === 'edited') {
      const doc = await this.getDocumentById(insight.documentId, params.userId);
      const citation = doc
        ? `${doc.originalFileName}, Page ${insight.sourcePage}`
        : `Page ${insight.sourcePage}`;

      const [createdFact] = await db
        .insert(approvedFacts)
        .values({
          userId: params.userId,
          sourceDocumentId: insight.documentId,
          sourceInsightId: insight.id,
          factCategory: insight.category,
          factText: finalText,
          sourceCitation: citation,
          isActive: true,
        })
        .returning();

      fact = createdFact;
    }

    return {
      insight: updatedInsight,
      approvedFact: fact,
    };
  }

  /**
   * Lists all active approved facts for a user available to the Writer and Critic.
   */
  static async listActiveApprovedFacts(userId: string): Promise<ApprovedFact[]> {
    return db
      .select()
      .from(approvedFacts)
      .where(and(eq(approvedFacts.userId, userId), eq(approvedFacts.isActive, true)))
      .orderBy(desc(approvedFacts.createdAt));
  }

  /**
   * Completely purges all stored documents and database records for a user.
   * Invoked upon account deletion (E2-S5 / GDPR right to erasure).
   */
  static async purgeUserDocuments(userId: string): Promise<void> {
    const storage = getStorageProvider();
    // 1. Purge physical directory documents/{userId}
    await storage.deleteFolder(`documents/${userId}`);

    // 2. Delete database records in cascade
    await db.delete(approvedFacts).where(eq(approvedFacts.userId, userId));
    await db.delete(documentInsights).where(eq(documentInsights.userId, userId));
    await db.delete(documents).where(eq(documents.userId, userId));
    await db.delete(documentPrivacyConsents).where(eq(documentPrivacyConsents.userId, userId));
  }
}
