export interface StoredFileStream {
  stream: NodeJS.ReadableStream;
  contentType: string;
  contentLength: number;
}

export type StoredImageStream = StoredFileStream;

/**
 * Pluggable Storage Provider abstraction (Principle 7).
 * Decouples image and document file storage from the local filesystem to allow smooth migration to S3/R2.
 */
export interface StorageProvider {
  /**
   * Saves a binary image buffer under the given storage key.
   */
  saveImage(buffer: Buffer, key: string, contentType: string): Promise<string>;

  /**
   * Returns a readable stream for the image along with content type and length.
   */
  getImageStream(key: string): Promise<StoredImageStream>;

  /**
   * Deletes an image from storage by key.
   */
  deleteImage(key: string): Promise<void>;

  /**
   * Deletes multiple images from storage.
   */
  deleteImages(keys: string[]): Promise<void>;

  /**
   * Saves any binary file (e.g. PDF document) under the given storage key.
   */
  saveFile(buffer: Buffer, key: string, contentType: string): Promise<string>;

  /**
   * Returns a readable stream for the stored file along with content type and length.
   */
  getFileStream(key: string): Promise<StoredFileStream>;

  /**
   * Deletes a file from storage by key.
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Deletes multiple files from storage by key.
   */
  deleteFiles(keys: string[]): Promise<void>;

  /**
   * Recursively deletes a folder / key prefix from storage.
   */
  deleteFolder(folderKey: string): Promise<void>;
}
