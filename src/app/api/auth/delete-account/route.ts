import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { validateCurrentSession, destroySession } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';
import { eq } from 'drizzle-orm';

const deleteAccountSchema = z.object({
  currentPassword: z.string().min(1),
  confirmationText: z.string(),
});

export async function POST(request: Request) {
  try {
    const { session, user } = await validateCurrentSession();

    if (!session || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = deleteAccountSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { currentPassword, confirmationText } = result.data;

    // Verify confirmation string (English/French "DELETE" or Arabic "حذف")
    if (confirmationText !== 'DELETE' && confirmationText !== 'حذف') {
      return NextResponse.json(
        { error: 'Please enter the exact confirmation word.' },
        { status: 400 },
      );
    }

    // Verify current password
    const passwordValid = await verifyPassword(
      user.passwordHash,
      currentPassword,
    );
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Incorrect current password.' },
        { status: 401 },
      );
    }

    // Cascade purge user and all associated records from database
    await db.delete(users).where(eq(users.id, user.id));

    // End session and delete cookie
    await destroySession();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again.' },
      { status: 500 },
    );
  }
}
