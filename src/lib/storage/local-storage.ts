import fs from 'node:fs';
import path from 'node:path';
import { StorageProvider, StoredFileStream, StoredImageStream } from './provider';

export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(baseDir || path.join(process.cwd(), 'data'));
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
    return this.getFileStream(key);
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

  async saveFile(buffer: Buffer, key: string, contentType: string): Promise<string> {
    return this.saveImage(buffer, key, contentType);
  }

  async getFileStream(key: string): Promise<StoredFileStream> {
    const fullPath = this.resolveSafePath(key);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found at key '${key}'`);
    }

    const stats = await fs.promises.stat(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.json') {
      contentType = 'application/json';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
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

  async deleteFile(key: string): Promise<void> {
    return this.deleteImage(key);
  }

  async deleteFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map((k) => this.deleteFile(k)));
  }

  async deleteFolder(folderKey: string): Promise<void> {
    try {
      const fullPath = this.resolveSafePath(folderKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.rm(fullPath, { recursive: true, force: true });
      }
    } catch {
      // Non-fatal if folder doesn't exist
    }
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
