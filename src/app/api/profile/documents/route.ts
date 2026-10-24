import { NextRequest, NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { DocumentService } from '@/lib/documents/document-service';
import {
  DocumentTypeSchema,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  MAX_DOCUMENT_PAGES,
  MAX_DOCUMENTS_PER_USER,
} from '@/lib/documents/schemas';
import {
  validatePdfSignature,
  detectEncryptedPdf,
  getPdfPageCount,
  extractPdfPages,
} from '@/lib/documents/pdf-extractor';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    const docs = await DocumentService.listDocuments(user.id);
    return NextResponse.json({ documents: docs });
  } catch (error) {
    logger.error({ err: error }, 'Failed to list profile documents');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve documents' } },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      );
    }

    // 1. Mandatory consent gate check (FR-007, FR-008)
    const hasConsent = await DocumentService.hasPrivacyConsent(user.id);
    if (!hasConsent) {
      return NextResponse.json(
        {
          error: {
            code: 'CONSENT_REQUIRED',
            message: 'Privacy consent must be acknowledged before uploading documents',
          },
        },
        { status: 403 },
      );
    }

    // 2. Check 5-document limit (FR-001)
    const existingDocs = await DocumentService.listDocuments(user.id);
    if (existingDocs.length >= MAX_DOCUMENTS_PER_USER) {
      return NextResponse.json(
        {
          error: {
            code: 'DOCUMENT_LIMIT_REACHED',
            message: `Maximum limit of ${MAX_DOCUMENTS_PER_USER} documents reached. Please delete an existing document first.`,
          },
        },
        { status: 409 },
      );
    }

    // 3. Parse multipart/form-data
    const formData = await req.formData();
    const file = formData.get('file');
    const documentTypeRaw = formData.get('documentType');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'File is required' } },
        { status: 400 },
      );
    }

    const typeParse = DocumentTypeSchema.safeParse(documentTypeRaw);
    if (!typeParse.success) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Valid documentType label is required (cv, bio, articles, company_brochure, other)',
          },
        },
        { status: 400 },
      );
    }

    // 4. Validate file size (FR-003)
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (fileBuffer.length > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'Document exceeds maximum allowed size of 10 MB',
          },
        },
        { status: 400 },
      );
    }

    // 5. Validate PDF signature / magic bytes (FR-002)
    if (!validatePdfSignature(fileBuffer)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PDF_FORMAT',
            message: 'Uploaded file is not a valid PDF document',
          },
        },
        { status: 400 },
      );
    }

    // 6. Detect password-protected or encrypted PDF (FR-004)
    if (detectEncryptedPdf(fileBuffer)) {
      return NextResponse.json(
        {
          error: {
            code: 'ENCRYPTED_PDF',
            message: 'This PDF is password-protected. Please upload an unlocked version.',
          },
        },
        { status: 400 },
      );
    }

    // 7. Check page count limit (FR-003)
    let pageCount = 1;
    let extractedText = '';

    try {
      pageCount = await getPdfPageCount(fileBuffer);
    } catch {
      // In case metadata parsing fails, fallback to 1 page
      pageCount = 1;
    }

    if (pageCount > MAX_DOCUMENT_PAGES) {
      return NextResponse.json(
        {
          error: {
            code: 'TOO_MANY_PAGES',
            message: `Document exceeds maximum page limit of ${MAX_DOCUMENT_PAGES} pages (${pageCount} pages detected)`,
          },
        },
        { status: 400 },
      );
    }

    // 8. Attempt initial text extraction for digital PDFs
    try {
      const extractedPages = await extractPdfPages(fileBuffer);
      extractedText = extractedPages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n\n');
    } catch (err) {
      logger.warn({ err }, 'Initial server-side text extraction encountered an issue; document saved for Profiler fallback');
    }

    // 9. Persist document record and binary
    const createdDoc = await DocumentService.createDocument({
      userId: user.id,
      originalFileName: file.name,
      fileSizeBytes: fileBuffer.length,
      pageCount,
      documentType: typeParse.data,
      buffer: fileBuffer,
      extractedText: extractedText || undefined,
    });

    return NextResponse.json({ document: createdDoc }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, 'Failed to upload document');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process document upload' } },
      { status: 500 },
    );
  }
}
