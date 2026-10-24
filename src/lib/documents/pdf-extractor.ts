import { extractText, getDocumentProxy } from 'unpdf';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

/**
 * Validates that the buffer contains a genuine PDF magic byte header (%PDF-).
 */
export function validatePdfSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 5) {
    return false;
  }
  // Check the first 1024 bytes for %PDF- signature
  const headerSlice = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('latin1');
  return headerSlice.includes('%PDF-');
}

/**
 * Detects whether a PDF is password-protected or encrypted.
 * Analyzes the trailer dictionary for an /Encrypt reference or dictionary.
 */
export function detectEncryptedPdf(buffer: Buffer): boolean {
  if (!buffer || buffer.length === 0) {
    return false;
  }
  const content = buffer.toString('latin1');
  // Match standard PDF /Encrypt key in trailer or cross-reference dictionary
  const hasEncryptToken = /\/Encrypt\s+(\d+\s+\d+\s+R|<<)/.test(content);
  return hasEncryptToken;
}

/**
 * Retrieves the total page count of a PDF document.
 */
export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const proxy = await getDocumentProxy(new Uint8Array(buffer));
  return proxy.numPages;
}

/**
 * Extracts page-by-page text from a digital PDF using unpdf.
 * Returns an array of page objects with 1-based page numbers.
 */
export async function extractPdfPages(buffer: Buffer): Promise<ExtractedPage[]> {
  const { totalPages, text } = await extractText(new Uint8Array(buffer));

  const pages: ExtractedPage[] = [];
  const textArray = Array.isArray(text) ? text : [text];

  for (let i = 0; i < totalPages; i++) {
    pages.push({
      pageNumber: i + 1,
      text: (textArray[i] || '').trim(),
    });
  }

  return pages;
}
