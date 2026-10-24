import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { GET as getConsent, POST as postConsent } from '@/app/api/profile/documents/consent/route';
import { GET as getDocuments, POST as postDocuments } from '@/app/api/profile/documents/route';
import { DocumentService } from '@/lib/documents/document-service';
import { NextRequest } from 'next/server';

const mockUser = {
  id: 'user-doc-tester',
  email: 'tester@saouti.local',
};

const mockSession = {
  id: 'session-1',
  userId: mockUser.id,
};

let userConsentRecorded = false;
let mockDocumentsList: any[] = [];

vi.mock('@/lib/auth/session', () => ({
  validateCurrentSession: vi.fn().mockImplementation(async () => ({
    user: mockUser,
    session: mockSession,
  })),
}));

const mockStorageProvider = {
  saveFile: vi.fn().mockImplementation(async (_buf, key) => key),
  getFileStream: vi.fn().mockResolvedValue({
    stream: {},
    contentType: 'application/pdf',
    contentLength: 100,
  }),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  deleteFolder: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/lib/storage/local-storage', () => ({
  getStorageProvider: () => mockStorageProvider,
}));

describe('Document Upload Flow Integration (document-upload-flow.test.ts)', () => {
  const fixturesDir = path.resolve(process.cwd(), 'tests/fixtures/documents');

  beforeEach(() => {
    userConsentRecorded = false;
    mockDocumentsList = [];
    vi.clearAllMocks();

    vi.spyOn(DocumentService, 'hasPrivacyConsent').mockImplementation(async () => userConsentRecorded);
    vi.spyOn(DocumentService, 'getPrivacyConsent').mockImplementation(async () => {
      if (!userConsentRecorded) return null;
      return {
        id: 'consent-1',
        userId: mockUser.id,
        acknowledgedAt: new Date(),
        noticeVersion: 'v1',
      };
    });
    vi.spyOn(DocumentService, 'recordPrivacyConsent').mockImplementation(async (_userId, noticeVersion) => {
      userConsentRecorded = true;
      return {
        id: 'consent-1',
        userId: mockUser.id,
        acknowledgedAt: new Date(),
        noticeVersion: noticeVersion || 'v1',
      };
    });
    vi.spyOn(DocumentService, 'listDocuments').mockImplementation(async () => mockDocumentsList);
    vi.spyOn(DocumentService, 'createDocument').mockImplementation(async (params) => {
      if (mockDocumentsList.length >= 5) {
        throw new Error('Maximum limit of 5 documents reached');
      }
      const newDoc = {
        id: 'doc-uuid-1',
        userId: params.userId,
        storageKey: `documents/${params.userId}/doc-uuid-1.pdf`,
        originalFileName: params.originalFileName,
        fileSizeBytes: params.fileSizeBytes,
        pageCount: params.pageCount,
        documentType: params.documentType,
        status: 'uploaded',
        extractedTextEncrypted: null,
        nonce: null,
        authTag: null,
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDocumentsList.push(newDoc);
      return newDoc as any;
    });
  });

  it('blocks document uploads with 403 CONSENT_REQUIRED until privacy notice is acknowledged', async () => {
    const validPdfBuffer = fs.readFileSync(path.join(fixturesDir, 'valid-cv-en.pdf'));
    const formData = new FormData();
    formData.append('file', new Blob([validPdfBuffer], { type: 'application/pdf' }), 'cv.pdf');
    formData.append('documentType', 'cv');

    const req = new NextRequest('http://localhost:3000/api/profile/documents', {
      method: 'POST',
      body: formData,
    });

    const res = await postDocuments(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('CONSENT_REQUIRED');
  });

  it('records user privacy consent and verifies status', async () => {
    // Initial check: not consented
    const checkRes = await getConsent();
    const checkBody = await checkRes.json();
    expect(checkBody.acknowledged).toBe(false);

    // Post consent
    const consentReq = new NextRequest('http://localhost:3000/api/profile/documents/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticeVersion: 'v1' }),
    });

    const postRes = await postConsent(consentReq);
    expect(postRes.status).toBe(200);

    // Verify check now returns true
    const verifiedRes = await getConsent();
    const verifiedBody = await verifiedRes.json();
    expect(verifiedBody.acknowledged).toBe(true);
  });

  it('rejects non-PDF files with 400 INVALID_PDF_FORMAT', async () => {
    userConsentRecorded = true;
    const corruptedBuffer = fs.readFileSync(path.join(fixturesDir, 'corrupted.pdf'));
    const formData = new FormData();
    formData.append('file', new Blob([corruptedBuffer], { type: 'application/pdf' }), 'bad.pdf');
    formData.append('documentType', 'bio');

    const req = new NextRequest('http://localhost:3000/api/profile/documents', {
      method: 'POST',
      body: formData,
    });

    const res = await postDocuments(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('INVALID_PDF_FORMAT');
  });

  it('rejects password-protected PDFs with 400 ENCRYPTED_PDF', async () => {
    userConsentRecorded = true;
    const encryptedBuffer = fs.readFileSync(path.join(fixturesDir, 'encrypted.pdf'));
    const formData = new FormData();
    formData.append('file', new Blob([encryptedBuffer], { type: 'application/pdf' }), 'locked.pdf');
    formData.append('documentType', 'articles');

    const req = new NextRequest('http://localhost:3000/api/profile/documents', {
      method: 'POST',
      body: formData,
    });

    const res = await postDocuments(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('ENCRYPTED_PDF');
  });

  it('successfully uploads valid PDF and enforces 5-document limit', async () => {
    userConsentRecorded = true;
    const validPdfBuffer = fs.readFileSync(path.join(fixturesDir, 'valid-cv-en.pdf'));

    // Upload 1st document
    const formData = new FormData();
    formData.append('file', new File([validPdfBuffer], 'sarah-cv.pdf', { type: 'application/pdf' }));
    formData.append('documentType', 'cv');

    const req1 = new NextRequest('http://localhost:3000/api/profile/documents', {
      method: 'POST',
      body: formData,
    });

    const res1 = await postDocuments(req1);
    expect(res1.status).toBe(201);
    const body1 = await res1.json();
    expect(body1.document.originalFileName).toBe('sarah-cv.pdf');
    expect(body1.document.status).toBe('uploaded');

    // Simulate 5 documents already existing
    mockDocumentsList = [
      { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }
    ];

    const req6 = new NextRequest('http://localhost:3000/api/profile/documents', {
      method: 'POST',
      body: formData,
    });

    const res6 = await postDocuments(req6);
    expect(res6.status).toBe(409);
    const body6 = await res6.json();
    expect(body6.error.code).toBe('DOCUMENT_LIMIT_REACHED');
  });
});
