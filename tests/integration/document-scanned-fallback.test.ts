import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeDocumentProfilerStep } from '@/lib/agent-engine/agents/profiler-document';

const mockUserId = 'user-scanned-test';
const mockDocId = 'doc-123';

let mockDocumentRecord: any = null;
let savedInsights: any[] = [];

vi.mock('@/lib/ai/service', () => ({
  generateUserStructured: vi.fn().mockResolvedValue({
    data: {
      insights: [
        {
          category: 'achievements',
          text: 'Scaled revenue by 300% in 2023',
          sourcePage: 1,
          confidenceScore: 95,
        },
      ],
    },
  }),
}));

const mockStorageProvider = {
  getFileStream: vi.fn().mockImplementation(() => ({
    stream: (async function* () {
      yield Buffer.from('%PDF-1.4 empty');
    })(),
    contentType: 'application/pdf',
    contentLength: 100,
  })),
};

vi.mock('@/lib/storage/local-storage', () => ({
  getStorageProvider: () => mockStorageProvider,
}));

vi.mock('@/lib/documents/pdf-extractor', () => ({
  extractPdfPages: vi.fn().mockImplementation(async () => [
    { pageNumber: 1, text: '' }, // empty scanned text
  ]),
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(() => Promise.resolve([mockDocumentRecord])),
        })),
      })),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((val) => {
        if (mockDocumentRecord) {
          Object.assign(mockDocumentRecord, val);
        }
        return {
          where: vi.fn().mockResolvedValue([mockDocumentRecord]),
        };
      }),
    })),
    delete: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockResolvedValue([]),
    })),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((val) => {
        savedInsights = Array.isArray(val) ? val : [val];
        return Promise.resolve(savedInsights);
      }),
    })),
  },
}));

describe('Scanned PDF Fallback Integration (document-scanned-fallback.test.ts)', () => {
  beforeEach(() => {
    savedInsights = [];
    mockDocumentRecord = {
      id: mockDocId,
      userId: mockUserId,
      storageKey: `documents/${mockUserId}/${mockDocId}.pdf`,
      documentType: 'cv',
      status: 'uploaded',
      extractedTextEncrypted: null,
      nonce: null,
      authTag: null,
      errorMessage: null,
    };
    vi.clearAllMocks();
  });

  it('marks document as failed with an informative message when document is scanned and unreadable', async () => {
    await expect(
      executeDocumentProfilerStep({
        userId: mockUserId,
        documentId: mockDocId,
      }),
    ).rejects.toThrow('This document contains scanned images, but your configured AI key does not support direct document OCR.');

    expect(mockDocumentRecord.status).toBe('failed');
    expect(mockDocumentRecord.errorMessage).toContain('This document contains scanned images');
  });
});
