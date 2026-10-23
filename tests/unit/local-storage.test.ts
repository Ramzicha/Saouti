import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LocalStorageProvider } from '@/lib/storage/local-storage';

describe('LocalStorageProvider (local-storage.ts)', () => {
  const testStorageDir = path.join(process.cwd(), 'tests', 'fixtures', 'temp_images');
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

  it('saves and reads image streams successfully', async () => {
    const buffer = Buffer.from('fake-png-binary-content');
    const key = 'user1/post1/img1.png';

    const savedKey = await provider.saveImage(buffer, key, 'image/png');
    expect(savedKey).toBe(key);

    const streamResult = await provider.getImageStream(key);
    expect(streamResult.contentType).toBe('image/png');
    expect(streamResult.contentLength).toBe(buffer.length);
    expect(streamResult.stream).toBeDefined();
  });

  it('safeguards against path traversal directory escapes', async () => {
    const buffer = Buffer.from('malicious-payload');
    const traversalKey = '../../etc/passwd';

    // The safe path resolution must not escape the baseDir
    // It normalizes away the leading .. or throws error if escaping
    const saved = await provider.saveImage(buffer, traversalKey, 'text/plain');
    const expectedPath = path.resolve(testStorageDir, 'etc', 'passwd');
    expect(fs.existsSync(expectedPath)).toBe(true);
  });

  it('deletes individual and multiple images cleanly', async () => {
    const buffer = Buffer.from('sample');
    await provider.saveImage(buffer, 'u1/p1/img1.png', 'image/png');
    await provider.saveImage(buffer, 'u1/p1/img2.png', 'image/png');

    await provider.deleteImage('u1/p1/img1.png');
    await expect(provider.getImageStream('u1/p1/img1.png')).rejects.toThrow();

    await provider.deleteImages(['u1/p1/img2.png']);
    await expect(provider.getImageStream('u1/p1/img2.png')).rejects.toThrow();
  });
});
