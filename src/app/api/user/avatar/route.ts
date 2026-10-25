import { NextResponse } from 'next/server';
import { validateCurrentSession } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getStorageProvider } from '@/lib/storage/local-storage';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/user/avatar
 * Uploads a profile picture file and updates user.avatarUrl.
 */
export async function POST(req: Request) {
  try {
    const { session, user } = await validateCurrentSession();
    if (!session || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('avatar');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No avatar file provided' },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PNG, JPEG, WebP, and GIF images are supported' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image file size must not exceed 5MB' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split('/')[1] || 'png';
    const filename = `${user.id}-${Date.now()}.${ext}`;
    const storageKey = `avatars/${filename}`;

    const storage = getStorageProvider();
    await storage.saveImage(buffer, storageKey, file.type);

    const avatarUrl = `/api/user/avatar/${filename}`;

    await db
      .update(users)
      .set({
        avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatarUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 },
    );
  }
}
