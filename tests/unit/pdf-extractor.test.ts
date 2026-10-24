import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  validatePdfSignature,
  detectEncryptedPdf,
  getPdfPageCount,
  extractPdfPages,
} from '@/lib/documents/pdf-extractor';

describe('PDF Extractor & Validator (pdf-extractor.test.ts)', () => {
  const fixturesDir = path.resolve(process.cwd(), 'tests/fixtures/documents');

  it('validates genuine PDF signatures and rejects non-PDF binaries', () => {
    const validPdf = fs.readFileSync(path.join(fixturesDir, 'valid-cv-en.pdf'));
    const corrupted = fs.readFileSync(path.join(fixturesDir, 'corrupted.pdf'));

    expect(validatePdfSignature(validPdf)).toBe(true);
    expect(validatePdfSignature(corrupted)).toBe(false);
    expect(validatePdfSignature(Buffer.from('hello world'))).toBe(false);
  });

  it('detects password-protected / encrypted PDFs accurately', () => {
    const normalPdf = fs.readFileSync(path.join(fixturesDir, 'valid-cv-en.pdf'));
    const encryptedPdf = fs.readFileSync(path.join(fixturesDir, 'encrypted.pdf'));

    expect(detectEncryptedPdf(normalPdf)).toBe(false);
    expect(detectEncryptedPdf(encryptedPdf)).toBe(true);
  });

  it('calculates page count correctly', async () => {
    const validPdf = fs.readFileSync(path.join(fixturesDir, 'valid-cv-en.pdf'));
    const count = await getPdfPageCount(validPdf);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('extracts page-by-page text from digital PDFs', async () => {
    const validPdf = fs.readFileSync(path.join(fixturesDir, 'valid-cv-en.pdf'));
    const pages = await extractPdfPages(validPdf);

    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages[0].pageNumber).toBe(1);
    expect(pages[0].text).toContain('Sarah Connor');
    expect(pages[0].text).toContain('Cyberdyne Systems');
  });

  it('extracts French and Arabic text preserving content', async () => {
    const frPdf = fs.readFileSync(path.join(fixturesDir, 'valid-bio-fr.pdf'));
    const frPages = await extractPdfPages(frPdf);
    expect(frPages[0].text).toContain('Alexandre Dumas');

    const arPdf = fs.readFileSync(path.join(fixturesDir, 'valid-article-ar.pdf'));
    const arPages = await extractPdfPages(arPdf);
    expect(arPages[0].text.length).toBeGreaterThan(0);
  });

  it('identifies empty or whitespace-only PDFs', async () => {
    const emptyPdf = fs.readFileSync(path.join(fixturesDir, 'scanned-no-text.pdf'));
    const pages = await extractPdfPages(emptyPdf);
    const totalText = pages.map((p) => p.text.trim()).join('');
    expect(totalText.length).toBe(0);
  });
});
