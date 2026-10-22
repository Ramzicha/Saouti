import { describe, it, expect } from 'vitest';
import { users } from '@/lib/db/schema';
import { getTableColumns } from 'drizzle-orm';

describe('Database Schema (schema.ts)', () => {
  it('defines the users table with required columns and constraints', () => {
    const columns = getTableColumns(users);

    expect(columns.id).toBeDefined();
    expect(columns.id.primary).toBe(true);

    expect(columns.email).toBeDefined();
    expect(columns.email.isUnique).toBe(true);
    expect(columns.email.notNull).toBe(true);

    expect(columns.passwordHash).toBeDefined();
    expect(columns.passwordHash.name).toBe('password_hash');
    expect(columns.passwordHash.notNull).toBe(true);

    expect(columns.createdAt).toBeDefined();
    expect(columns.createdAt.name).toBe('created_at');
    expect(columns.createdAt.notNull).toBe(true);

    expect(columns.updatedAt).toBeDefined();
    expect(columns.updatedAt.name).toBe('updated_at');
    expect(columns.updatedAt.notNull).toBe(true);
  });
});
