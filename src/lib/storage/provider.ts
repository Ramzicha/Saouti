export interface StoredImageStream {
  stream: NodeJS.ReadableStream;
  contentType: string;
  contentLength: number;
}

/**
 * Pluggable Storage Provider abstraction (Principle 7).
 * Decouples image storage from the local filesystem to allow smooth migration to S3/R2.
 */
export interface StorageProvider {
  /**
   * Saves a binary image buffer under the given storage key.
   * Returns the storage key or reference.
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
}
