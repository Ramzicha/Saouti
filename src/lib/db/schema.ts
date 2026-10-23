import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

/**
 * Users Table
 * Represents registered professionals in Saouti.
 */
export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 320 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

/**
 * Sessions Table
 * Stores database-backed sessions with SHA-256 session token hashes.
 */
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 64 }).primaryKey(), // SHA-256 hash of token
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

/**
 * Verification Tokens Table
 * Single-use tokens with 24-hour expiration for email address verification.
 */
export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type VerificationToken = InferSelectModel<typeof verificationTokens>;
export type NewVerificationToken = InferInsertModel<typeof verificationTokens>;

/**
 * Password Reset Tokens Table
 * Single-use tokens with 1-hour expiration for account password recovery.
 */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type PasswordResetToken = InferSelectModel<typeof passwordResetTokens>;
export type NewPasswordResetToken = InferInsertModel<
  typeof passwordResetTokens
>;

/**
 * API Keys Table
 * Stores encrypted AI provider credentials.
 */
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('gemini'),
    encryptedKey: text('encrypted_key').notNull(),
    nonce: text('nonce').notNull(),
    authTag: text('auth_tag').notNull(),
    lastFour: text('last_four').notNull(),
    status: text('status').notNull().default('active'), // 'active' | 'invalid' | 'quota_exceeded'
    lastValidatedAt: timestamp('last_validated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_provider_idx').on(table.userId, table.provider),
  ],
);

export type ApiKey = InferSelectModel<typeof apiKeys>;
export type NewApiKey = InferInsertModel<typeof apiKeys>;

/**
 * Usage Counters Table
 * Aggregates daily usage statistics per user and provider.
 */
export const usageCounters = pgTable(
  'usage_counters',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('gemini'),
    date: text('date').notNull(), // YYYY-MM-DD
    requestCount: integer('request_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    quotaErrorCount: integer('quota_error_count').notNull().default(0),
    estimatedTokens: integer('estimated_tokens').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('user_provider_date_idx').on(
      table.userId,
      table.provider,
      table.date,
    ),
  ],
);

export type UsageCounter = InferSelectModel<typeof usageCounters>;
export type NewUsageCounter = InferInsertModel<typeof usageCounters>;
