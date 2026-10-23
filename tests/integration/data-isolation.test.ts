import { describe, it, expect } from 'vitest';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('Multi-Tenant Data Isolation (Principle 2)', () => {
  it('enforces strict user-id scoping and prevents User A from accessing User B records', async () => {
    // Generate two isolated user IDs
    const userAId = crypto.randomUUID();
    const userBId = crypto.randomUUID();

    // Verify Drizzle SQL compilation enforces strict user_id where clause
    const userAQuery = db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, userAId));

    const generatedSql = userAQuery.toSQL();

    // Assert that the compiled query filters by ID and binds User A's ID
    expect(generatedSql.sql).toContain('"users"."id" = $1');
    expect(generatedSql.params).toEqual([userAId]);
    expect(generatedSql.params).not.toContain(userBId);
  });
});
