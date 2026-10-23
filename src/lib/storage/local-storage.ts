import fs from 'node:fs';
import path from 'node:path';
import { StorageProvider, StoredImageStream } from './provider';

export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(baseDir || path.join(process.cwd(), 'data', 'images'));
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Resolves and verifies that a relative key is strictly contained within the baseDir.
   * Throws an error on directory traversal attempts.
   */
  private resolveSafePath(key: string): string {
    // Disallow path traversal patterns
    const normalizedKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.resolve(this.baseDir, normalizedKey);

    if (!fullPath.startsWith(this.baseDir + path.sep) && fullPath !== this.baseDir) {
      throw new Error(`Security violation: Path traversal detected for key '${key}'`);
    }

    return fullPath;
  }

  async saveImage(buffer: Buffer, key: string, _contentType: string): Promise<string> {
    void _contentType;
    const fullPath = this.resolveSafePath(key);
    const parentDir = path.dirname(fullPath);

    if (!fs.existsSync(parentDir)) {
      await fs.promises.mkdir(parentDir, { recursive: true });
    }

    await fs.promises.writeFile(fullPath, buffer);
    return key;
  }

  async getImageStream(key: string): Promise<StoredImageStream> {
    const fullPath = this.resolveSafePath(key);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Image not found at key '${key}'`);
    }

    const stats = await fs.promises.stat(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    let contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    } else if (ext === '.svg') {
      contentType = 'image/svg+xml';
    }

    const stream = fs.createReadStream(fullPath);

    return {
      stream,
      contentType,
      contentLength: stats.size,
    };
  }

  async deleteImage(key: string): Promise<void> {
    try {
      const fullPath = this.resolveSafePath(key);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch {
      // Non-fatal if already deleted
    }
  }

  async deleteImages(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => this.deleteImage(k)));
  }
}

// Default singleton instance
let defaultStorageProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (!defaultStorageProvider) {
    defaultStorageProvider = new LocalStorageProvider();
  }
  return defaultStorageProvider;
}

export function setStorageProvider(provider: StorageProvider): void {
  defaultStorageProvider = provider;
}
