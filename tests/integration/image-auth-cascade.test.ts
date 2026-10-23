import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageService } from '@/lib/library/image-service';

const { mockImages } = vi.hoisted(() => {
  const list = [
    {
      id: 'img-1',
      userId: 'user-owner',
      postId: 'post-1',
      storageKey: 'images/user-owner/post-1/img-1.png',
      mimeType: 'image/png',
      fileSizeBytes: 1024,
      width: 1200,
      height: 675,
      aspectRatio: '16:9',
      prompt: 'Clean visual',
      altText: 'Alt',
      versionNumber: 1,
      isPrimary: true,
      createdAt: new Date(),
    },
  ];
  return { mockImages: list };
});

const mockStorageProvider = {
  deleteImage: vi.fn().mockResolvedValue(undefined),
  deleteImages: vi.fn().mockResolvedValue(undefined),
  saveImage: vi.fn().mockResolvedValue('key'),
  getImageStream: vi.fn().mockResolvedValue({
    stream: {},
    contentType: 'image/png',
    contentLength: 1024,
  }),
};

vi.mock('@/lib/storage/local-storage', () => ({
  getStorageProvider: () => mockStorageProvider,
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(() => Promise.resolve(mockImages)),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockImages),
          }),
        })),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockImages[0]]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockImages[0]]),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  },
}));

describe('Image Auth Isolation and Cascading Storage (ImageService)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves image when user is the owner', async () => {
    const img = await ImageService.getImageById('img-1', 'user-owner');
    expect(img).toBeDefined();
    expect(img?.id).toBe('img-1');
  });

  it('triggers storage deletion when deleting single image', async () => {
    const success = await ImageService.deleteImage('post-1', 'img-1', 'user-owner');
    expect(success).toBe(true);
    expect(mockStorageProvider.deleteImage).toHaveBeenCalledWith(
      'images/user-owner/post-1/img-1.png',
    );
  });
});
