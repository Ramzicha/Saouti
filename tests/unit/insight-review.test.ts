import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentService } from '@/lib/documents/document-service';

const mockUserId = 'user-review-test';
const mockDocId = 'doc-cv-1';
const mockInsightId = 'insight-1';

let currentInsight: any = null;
let createdFacts: any[] = [];

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation((table) => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(async () => {
            if (table?._?.name === 'documents') {
              return [{ id: mockDocId, originalFileName: 'Sarah_CV.pdf', userId: mockUserId }];
            }
            return currentInsight ? [currentInsight] : [];
          }),
        })),
      })),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((val) => ({
        where: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockImplementation(async () => {
            Object.assign(currentInsight, val);
            return [currentInsight];
          }),
        })),
      })),
    })),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((val) => ({
        returning: vi.fn().mockImplementation(async () => {
          const fact = { id: 'fact-1', ...val, createdAt: new Date() };
          createdFacts.push(fact);
          return [fact];
        }),
      })),
    })),
  },
}));

describe('Insight Review & Approved Fact Creation Unit Tests (insight-review.test.ts)', () => {
  beforeEach(() => {
    createdFacts = [];
    currentInsight = {
      id: mockInsightId,
      documentId: mockDocId,
      userId: mockUserId,
      category: 'achievements',
      rawText: 'Led product team to ship AI search in 2024',
      editedText: null,
      sourcePage: 2,
      confidenceScore: 95,
      status: 'pending',
    };
    vi.clearAllMocks();

    vi.spyOn(DocumentService, 'getDocumentById').mockResolvedValue({
      id: mockDocId,
      userId: mockUserId,
      originalFileName: 'Sarah_CV.pdf',
      storageKey: 'documents/key.pdf',
      fileSizeBytes: 1024,
      pageCount: 2,
      documentType: 'cv',
      status: 'completed',
      extractedTextEncrypted: null,
      nonce: null,
      authTag: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('approves an insight and converts it into an active ApprovedFact with page citation', async () => {
    const result = await DocumentService.reviewInsight({
      insightId: mockInsightId,
      userId: mockUserId,
      action: 'accept',
    });

    expect(result.insight.status).toBe('approved');
    expect(result.approvedFact).not.toBeNull();
    expect(result.approvedFact?.factText).toBe('Led product team to ship AI search in 2024');
    expect(result.approvedFact?.sourceCitation).toBe('Sarah_CV.pdf, Page 2');
    expect(result.approvedFact?.isActive).toBe(true);
  });

  it('edits an insight, saves modified text, and stores ApprovedFact with edited text', async () => {
    const modifiedText = 'Led cross-functional team of 15 engineers to ship AI search';
    const result = await DocumentService.reviewInsight({
      insightId: mockInsightId,
      userId: mockUserId,
      action: 'edit',
      editedText: modifiedText,
    });

    expect(result.insight.status).toBe('edited');
    expect(result.insight.editedText).toBe(modifiedText);
    expect(result.approvedFact).not.toBeNull();
    expect(result.approvedFact?.factText).toBe(modifiedText);
  });

  it('rejects an insight without creating an ApprovedFact', async () => {
    const result = await DocumentService.reviewInsight({
      insightId: mockInsightId,
      userId: mockUserId,
      action: 'reject',
    });

    expect(result.insight.status).toBe('rejected');
    expect(result.approvedFact).toBeNull();
    expect(createdFacts.length).toBe(0);
  });
});
