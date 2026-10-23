import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageService, MAX_IMAGE_ITERATIONS_PER_POST } from '@/lib/library/image-service';

const { existingFiveImages } = vi.hoisted(() => {
  const images = Array.from({ length: 5 }, (_, i) => ({
    id: `img-${i + 1}`,
    userId: 'user-reg-1',
    postId: 'post-reg-1',
    storageKey: `images/user-reg-1/post-reg-1/img-${i + 1}.png`,
    mimeType: 'image/png',
    fileSizeBytes: 2048,
    width: 1200,
    height: 675,
    aspectRatio: '16:9',
    prompt: `Visual iteration ${i + 1}`,
    altText: `Alt ${i + 1}`,
    versionNumber: i + 1,
    isPrimary: i === 4, // 5th is primary
    createdAt: new Date(Date.now() + i * 1000),
  }));
  return { existingFiveImages: images };
});

const mockStorage = {
  deleteImage: vi.fn().mockResolvedValue(undefined),
  saveImage: vi.fn().mockResolvedValue('key'),
};

vi.mock('@/lib/storage/local-storage', () => ({
  getStorageProvider: () => mockStorage,
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(existingFiveImages),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockImplementation((val) =>
          Promise.resolve([
            {
              id: 'img-new-6',
              ...val,
              createdAt: new Date(),
            },
          ]),
        ),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  },
}));

describe('Image Regeneration & FIFO Retention (ImageService)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prunes the oldest non-primary iteration when creating 6th iteration', async () => {
    const newImage = await ImageService.saveNewImage({
      userId: 'user-reg-1',
      postId: 'post-reg-1',
      storageKey: 'images/user-reg-1/post-reg-1/img-6.png',
      fileSizeBytes: 3000,
      prompt: 'Regenerated prompt with cinematic lighting',
      refinementInstruction: 'Make it cinematic',
      isPrimary: true,
    });

    expect(newImage).toBeDefined();
    // Oldest non-primary is img-1
    expect(mockStorage.deleteImage).toHaveBeenCalledWith(
      'images/user-reg-1/post-reg-1/img-1.png',
    );
  });
});
