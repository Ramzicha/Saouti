import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LocalStorageProvider } from '@/lib/storage/local-storage';

describe('StorageProvider Document Operations (storage-provider.test.ts)', () => {
  const testStorageDir = path.join(process.cwd(), 'tests', 'fixtures', 'temp_documents');
  let provider: LocalStorageProvider;

  beforeEach(() => {
    if (!fs.existsSync(testStorageDir)) {
      fs.mkdirSync(testStorageDir, { recursive: true });
    }
    provider = new LocalStorageProvider(testStorageDir);
  });

  afterEach(async () => {
    if (fs.existsSync(testStorageDir)) {
      await fs.promises.rm(testStorageDir, { recursive: true, force: true });
    }
  });

  it('saves and reads PDF file streams with correct content type', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 sample content');
    const key = 'documents/user-123/doc-456.pdf';

    const savedKey = await provider.saveFile(pdfBuffer, key, 'application/pdf');
    expect(savedKey).toBe(key);

    const streamResult = await provider.getFileStream(key);
    expect(streamResult.contentType).toBe('application/pdf');
    expect(streamResult.contentLength).toBe(pdfBuffer.length);
    expect(streamResult.stream).toBeDefined();
  });

  it('prevents path traversal escapes in document paths', async () => {
    const buffer = Buffer.from('malicious payload');
    const traversalKey = '../../etc/shadow';

    // Disallowed to escape baseDir
    await provider.saveFile(buffer, traversalKey, 'application/pdf');
    const expectedContained = path.resolve(testStorageDir, 'etc', 'shadow');
    expect(fs.existsSync(expectedContained)).toBe(true);
  });

  it('recursively deletes a document folder for user cleanup', async () => {
    const buffer = Buffer.from('%PDF-1.4 test');
    await provider.saveFile(buffer, 'documents/user-abc/doc1.pdf', 'application/pdf');
    await provider.saveFile(buffer, 'documents/user-abc/doc2.pdf', 'application/pdf');

    const file1 = path.join(testStorageDir, 'documents', 'user-abc', 'doc1.pdf');
    const file2 = path.join(testStorageDir, 'documents', 'user-abc', 'doc2.pdf');
    expect(fs.existsSync(file1)).toBe(true);
    expect(fs.existsSync(file2)).toBe(true);

    await provider.deleteFolder('documents/user-abc');

    expect(fs.existsSync(file1)).toBe(false);
    expect(fs.existsSync(file2)).toBe(false);
    expect(fs.existsSync(path.join(testStorageDir, 'documents', 'user-abc'))).toBe(false);
  });
});
