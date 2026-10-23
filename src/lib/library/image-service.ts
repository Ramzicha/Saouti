import { db } from '@/lib/db/client';
import { images, Image } from '@/lib/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { getStorageProvider } from '@/lib/storage/local-storage';

export const MAX_IMAGE_ITERATIONS_PER_POST = 5;

export interface CreateImageParams {
  userId: string;
  postId: string;
  storageKey: string;
  mimeType?: string | undefined;
  fileSizeBytes: number;
  width?: number | null | undefined;
  height?: number | null | undefined;
  aspectRatio?: string | undefined;
  prompt: string;
  altText?: string | null | undefined;
  refinementInstruction?: string | null | undefined;
  isPrimary?: boolean | undefined;
}

export class ImageService {
  /**
   * Retrieves all image versions attached to a post, ordered chronologically.
   */
  static async listImagesForPost(postId: string, userId: string): Promise<Image[]> {
    return db
      .select()
      .from(images)
      .where(and(eq(images.postId, postId), eq(images.userId, userId)))
      .orderBy(asc(images.createdAt));
  }

  /**
   * Retrieves a single image by ID with strict ownership scoping.
   */
  static async getImageById(imageId: string, userId: string): Promise<Image | null> {
    const [result] = await db
      .select()
      .from(images)
      .where(and(eq(images.id, imageId), eq(images.userId, userId)))
      .limit(1);

    return result || null;
  }

  /**
   * Saves a newly generated image for a post, automatically pruning the oldest
   * non-primary image if the 5-iteration limit is exceeded (FIFO retention).
   */
  static async saveNewImage(params: CreateImageParams): Promise<Image> {
    const storage = getStorageProvider();

    // 1. Fetch existing images for this post
    const existing = await db
      .select()
      .from(images)
      .where(and(eq(images.postId, params.postId), eq(images.userId, params.userId)))
      .orderBy(asc(images.createdAt));

    // 2. Prune if count >= MAX_IMAGE_ITERATIONS_PER_POST
    if (existing.length >= MAX_IMAGE_ITERATIONS_PER_POST) {
      // Find oldest non-primary, or oldest overall
      const toPrune = existing.find((img) => !img.isPrimary) || existing[0];
      if (toPrune) {
        await storage.deleteImage(toPrune.storageKey);
        await db.delete(images).where(eq(images.id, toPrune.id));
      }
    }

    // 3. Determine next version number
    const maxVersion = existing.reduce((max, img) => Math.max(max, img.versionNumber), 0);
    const versionNumber = maxVersion + 1;

    // 4. If new image is primary, clear primary flag on others
    const isPrimary = params.isPrimary ?? true;
    if (isPrimary) {
      await db
        .update(images)
        .set({ isPrimary: false })
        .where(and(eq(images.postId, params.postId), eq(images.userId, params.userId)));
    }

    // 5. Insert new image row
    const [inserted] = await db
      .insert(images)
      .values({
        userId: params.userId,
        postId: params.postId,
        storageKey: params.storageKey,
        mimeType: params.mimeType || 'image/png',
        fileSizeBytes: params.fileSizeBytes,
        ...(params.width !== undefined ? { width: params.width } : {}),
        ...(params.height !== undefined ? { height: params.height } : {}),
        aspectRatio: params.aspectRatio || '16:9',
        prompt: params.prompt,
        ...(params.altText ? { altText: params.altText } : {}),
        ...(params.refinementInstruction ? { refinementInstruction: params.refinementInstruction } : {}),
        versionNumber,
        isPrimary,
      })
      .returning();

    return inserted;
  }

  /**
   * Sets an image as the primary visual for a post.
   */
  static async setPrimaryImage(
    postId: string,
    imageId: string,
    userId: string,
  ): Promise<Image | null> {
    const target = await this.getImageById(imageId, userId);
    if (!target || target.postId !== postId) {
      return null;
    }

    // Clear primary for all post images
    await db
      .update(images)
      .set({ isPrimary: false })
      .where(and(eq(images.postId, postId), eq(images.userId, userId)));

    // Set new primary
    const [updated] = await db
      .update(images)
      .set({ isPrimary: true })
      .where(eq(images.id, imageId))
      .returning();

    return updated || null;
  }

  /**
   * Deletes a specific image iteration and its underlying binary file.
   */
  static async deleteImage(postId: string, imageId: string, userId: string): Promise<boolean> {
    const target = await this.getImageById(imageId, userId);
    if (!target || target.postId !== postId) {
      return false;
    }

    // Delete file
    const storage = getStorageProvider();
    await storage.deleteImage(target.storageKey);

    // Delete row
    await db.delete(images).where(eq(images.id, imageId));

    // If was primary, designate the latest remaining image as primary
    if (target.isPrimary) {
      const [remainingLatest] = await db
        .select()
        .from(images)
        .where(and(eq(images.postId, postId), eq(images.userId, userId)))
        .orderBy(desc(images.createdAt))
        .limit(1);

      if (remainingLatest) {
        await db
          .update(images)
          .set({ isPrimary: true })
          .where(eq(images.id, remainingLatest.id));
      }
    }

    return true;
  }

  /**
   * Deletes all image files on storage when a post is permanently purged.
   */
  static async purgeAllPostImages(postId: string): Promise<void> {
    const postImages = await db
      .select({ storageKey: images.storageKey })
      .from(images)
      .where(eq(images.postId, postId));

    if (postImages.length > 0) {
      const storage = getStorageProvider();
      await storage.deleteImages(postImages.map((img) => img.storageKey));
    }
  }
}
