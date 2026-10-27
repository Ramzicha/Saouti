import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  integer,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
  customType,
} from 'drizzle-orm/pg-core';
import { sql, type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

/**
 * Custom tsvector type for PostgreSQL full-text search
 */
export const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

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
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  hasDismissedTavilyPrompt: boolean('has_dismissed_tavily_prompt')
    .default(false)
    .notNull(),
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

/**
 * Profiles Table
 * Represents the primary voice profile for a user.
 */
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    status: text('status').notNull().default('draft'), // 'draft' | 'active'
    currentStep: integer('current_step').notNull().default(1),
    currentVersion: integer('current_version').notNull().default(1),

    primaryLanguage: varchar('primary_language', { length: 10 })
      .notNull()
      .default('en'),
    arabicDialect: varchar('arabic_dialect', { length: 20 })
      .notNull()
      .default('none'),

    identityData: jsonb('identity_data').$type<{
      role?: string | undefined;
      industry?: string | undefined;
      expertise?: string[] | undefined;
      positioning?: string | undefined;
    }>(),

    principlesData: jsonb('principles_data').$type<{
      values?: string[] | undefined;
      topicsToAvoid?: string[] | undefined;
      toneRedLines?: string[] | undefined;
    }>(),

    audienceData: jsonb('audience_data').$type<{
      persona?: string | undefined;
      expertiseLevel?: ('beginner' | 'intermediate' | 'expert' | 'general') | undefined;
      interests?: string[] | undefined;
    }>(),

    objectivesData: jsonb('objectives_data').$type<{
      primaryObjective?: ('authority' | 'leads' | 'hiring' | 'community' | 'sales') | undefined;
      platformRankings?: Record<
        string,
        ('authority' | 'leads' | 'hiring' | 'community' | 'sales')[]
      > | undefined;
    }>(),

    styleData: jsonb('style_data').$type<{
      formality?: number | undefined;
      length?: ('short' | 'medium' | 'long') | undefined;
      emoji?: ('none' | 'minimal' | 'frequent') | undefined;
      hookStyle?: ('bold_statement' | 'question' | 'story' | 'statistic') | undefined;
    }>(),

    completenessScore: integer('completeness_score').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('profiles_user_id_idx').on(table.userId),
    index('profiles_status_idx').on(table.status),
  ],
);

export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;

/**
 * Voice Samples Table
 * Stores 1 to 5 pasted writing samples per voice profile.
 */
export const voiceSamples = pgTable(
  'voice_samples',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull().default('Voice Sample'),
    content: text('content').notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('voice_samples_profile_id_idx').on(table.profileId)],
);

export type VoiceSample = InferSelectModel<typeof voiceSamples>;
export type NewVoiceSample = InferInsertModel<typeof voiceSamples>;

/**
 * Platform Preferences Table
 * Platform objectives and Reddit rules.
 */
export const platformPreferences = pgTable(
  'platform_preferences',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    platform: varchar('platform', { length: 50 }).notNull(),
    primaryObjective: varchar('primary_objective', { length: 50 })
      .notNull()
      .default('authority'),
    subreddits: jsonb('subreddits').$type<
      Array<{
        name: string;
        rulesSummary?: string | undefined;
      }>
    >(),
    customInstructions: text('custom_instructions'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('profile_platform_idx').on(table.profileId, table.platform),
  ],
);

export type PlatformPreference = InferSelectModel<typeof platformPreferences>;
export type NewPlatformPreference = InferInsertModel<typeof platformPreferences>;

/**
 * Voice Profile Versions Table
 * Immutable snapshots for rollback and history inspection.
 */
export const voiceProfileVersions = pgTable(
  'voice_profile_versions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull(),
    changeSummary: text('change_summary'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('voice_profile_versions_profile_idx').on(table.profileId),
    uniqueIndex('voice_profile_versions_num_idx').on(
      table.profileId,
      table.versionNumber,
    ),
  ],
);

export type VoiceProfileVersion = InferSelectModel<typeof voiceProfileVersions>;
export type NewVoiceProfileVersion = InferInsertModel<typeof voiceProfileVersions>;

/**
 * Profiler Sessions Table
 * Manages conversational transcripts for AI Profiler interview mode.
 */
export const profilerSessions = pgTable(
  'profiler_sessions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('in_progress'), // 'in_progress' | 'completed' | 'abandoned'
    messages: jsonb('messages')
      .$type<
        Array<{
          role: 'assistant' | 'user';
          content: string;
          timestamp?: string | undefined;
        }>
      >()
      .notNull()
      .default([]),
    proposedProfile: jsonb('proposed_profile').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('profiler_sessions_user_id_idx').on(table.userId)],
);

export type ProfilerSession = InferSelectModel<typeof profilerSessions>;
export type NewProfilerSession = InferInsertModel<typeof profilerSessions>;

/**
 * Runs Table
 * Stores post generation requests and resulting platform outputs.
 */
export const runs = pgTable(
  'runs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    chatId: varchar('chat_id', { length: 100 }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    topicBrief: text('topic_brief').notNull(),
    selectedPlatforms: jsonb('selected_platforms')
      .$type<string[]>()
      .notNull(),
    targetLanguage: varchar('target_language', { length: 10 })
      .notNull()
      .default('en'),
    arabicDialect: varchar('arabic_dialect', { length: 20 })
      .notNull()
      .default('none'),
    status: varchar('status', { length: 20 })
      .notNull()
      .default('pending'), // 'pending' | 'running' | 'completed' | 'cancelled' | 'failed' | 'timed_out'
    skipCritic: boolean('skip_critic').notNull().default(false),
    posts: jsonb('posts').$type<
      Array<{
        platform: string;
        language: string;
        text: string;
        hashtags: string[];
        imagePrompt?: string | undefined;
        imageAltText?: string | undefined;
        imageAspectRatio?: string | undefined;
        criticVerdict?: 'pass' | 'revise' | undefined;
        criticScores?: Record<string, number> | undefined;
        criticIssues?: Array<{
          exactPhrase: string;
          problem: string;
          suggestedFix: string;
        }> | undefined;
      }>
    >(),
    totalDurationMs: integer('total_duration_ms').default(0),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('runs_user_id_idx').on(table.userId),
    index('runs_chat_id_idx').on(table.chatId),
    index('runs_status_idx').on(table.status),
    index('runs_created_at_idx').on(table.createdAt),
  ],
);

export type Run = InferSelectModel<typeof runs>;
export type NewRun = InferInsertModel<typeof runs>;

/**
 * Agent Steps Table
 * Granular audit trail for each model invocation within a run.
 */
export const agentSteps = pgTable(
  'agent_steps',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    runId: uuid('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    agentId: varchar('agent_id', { length: 20 }).notNull(), // 'writer' | 'critic' | 'art_director'
    taskLabel: varchar('task_label', { length: 100 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    promptVersion: varchar('prompt_version', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(), // 'running' | 'completed' | 'failed' | 'skipped'
    durationMs: integer('duration_ms').default(0),
    inputPayload: jsonb('input_payload').$type<Record<string, unknown>>(),
    outputPayload: jsonb('output_payload').$type<Record<string, unknown>>(),
    errorCode: varchar('error_code', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('agent_steps_run_id_idx').on(table.runId),
    index('agent_steps_agent_id_idx').on(table.agentId),
  ],
);

export type AgentStep = InferSelectModel<typeof agentSteps>;
export type NewAgentStep = InferInsertModel<typeof agentSteps>;

/**
 * Posts Table
 * Social media posts in user library with publishing status and soft-delete support.
 */
export const posts = pgTable(
  'posts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    runId: uuid('run_id').references(() => runs.id, { onDelete: 'set null' }),
    platform: varchar('platform', { length: 50 }).notNull(), // 'linkedin' | 'x' | 'reddit' | 'instagram' | 'facebook'
    language: varchar('language', { length: 10 }).notNull().default('en'),
    status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft' | 'ready' | 'posted'
    content: text('content').notNull(),
    hashtags: jsonb('hashtags').$type<string[]>().notNull().default([]),
    imagePrompt: text('image_prompt'),
    imageAltText: text('image_alt_text'),
    imageAspectRatio: varchar('image_aspect_ratio', { length: 20 }),
    publishedUrl: text('published_url'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    searchVector: tsvector('search_vector'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('posts_user_status_created_idx').on(
      table.userId,
      table.deletedAt,
      table.createdAt,
    ),
    index('posts_user_platform_idx').on(table.userId, table.platform),
    index('posts_run_id_idx').on(table.runId),
  ],
);

export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;

/**
 * Post Versions Table
 * Immutable snapshots capturing post history up to 20 versions per post.
 */
export const postVersions = pgTable(
  'post_versions',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    content: text('content').notNull(),
    hashtags: jsonb('hashtags').$type<string[]>().notNull().default([]),
    imagePrompt: text('image_prompt'),
    changeSummary: text('change_summary'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('post_version_num_idx').on(table.postId, table.versionNumber),
    index('post_versions_post_id_idx').on(table.postId),
  ],
);

export type PostVersion = InferSelectModel<typeof postVersions>;
export type NewPostVersion = InferInsertModel<typeof postVersions>;

/**
 * Tags Table
 * User-created freeform categorization tags.
 */
export const tags = pgTable(
  'tags',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 30 }).notNull(),
    color: varchar('color', { length: 30 }).notNull().default('#6366f1'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('tags_user_name_idx').on(table.userId, table.name),
  ],
);

export type Tag = InferSelectModel<typeof tags>;
export type NewTag = InferInsertModel<typeof tags>;

/**
 * Post Tags Associative Table
 * Links posts with up to 5 tags.
 */
export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
    index('post_tags_tag_id_idx').on(table.tagId),
  ],
);

export type PostTag = InferSelectModel<typeof postTags>;
export type NewPostTag = InferInsertModel<typeof postTags>;

/**
 * Images Table
 * Generated visual assets attached to posts with cascade deletion.
 */
export const images = pgTable(
  'images',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    storageKey: varchar('storage_key', { length: 512 }).notNull(),
    mimeType: varchar('mime_type', { length: 64 }).notNull().default('image/png'),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    width: integer('width'),
    height: integer('height'),
    aspectRatio: varchar('aspect_ratio', { length: 16 }).notNull().default('16:9'),
    prompt: text('prompt').notNull(),
    altText: text('alt_text'),
    refinementInstruction: text('refinement_instruction'),
    versionNumber: integer('version_number').notNull().default(1),
    isPrimary: boolean('is_primary').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('images_user_id_idx').on(table.userId),
    index('images_post_id_idx').on(table.postId),
    index('images_post_id_primary_idx').on(table.postId, table.isPrimary),
  ],
);

export type Image = InferSelectModel<typeof images>;
export type NewImage = InferInsertModel<typeof images>;

/**
 * Documents Table (010-profile-documents)
 * Represents an uploaded PDF file associated with a user's Voice Profile.
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    storageKey: varchar('storage_key', { length: 500 }).notNull(),
    originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    pageCount: integer('page_count').notNull().default(1),
    documentType: varchar('document_type', { length: 50 }).notNull(), // 'cv' | 'bio' | 'articles' | 'company_brochure' | 'other'
    status: varchar('status', { length: 30 }).notNull().default('uploaded'), // 'uploaded' | 'processing' | 'completed' | 'failed'
    extractedTextEncrypted: text('extracted_text_encrypted'), // AES-256-GCM ciphertext
    nonce: varchar('nonce', { length: 32 }), // IV for AES-256-GCM
    authTag: varchar('auth_tag', { length: 32 }), // Tag for AES-256-GCM
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('documents_user_id_idx').on(table.userId),
    index('documents_status_idx').on(table.status),
  ],
);

export type Document = InferSelectModel<typeof documents>;
export type NewDocument = InferInsertModel<typeof documents>;

/**
 * Document Insights Table (010-profile-documents)
 * Stores structured insights proposed by the Profiler agent from a processed document.
 */
export const documentInsights = pgTable(
  'document_insights',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    category: varchar('category', { length: 50 }).notNull(), // 'roles_experience' | 'expertise' | 'achievements' | 'audience_cues' | 'tone_style_cues' | 'languages'
    rawText: text('raw_text').notNull(),
    editedText: text('edited_text'),
    sourcePage: integer('source_page').notNull().default(1),
    confidenceScore: integer('confidence_score').notNull().default(100), // 0 to 100 percentage
    status: varchar('status', { length: 30 }).notNull().default('pending'), // 'pending' | 'approved' | 'edited' | 'rejected'
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('document_insights_document_id_idx').on(table.documentId),
    index('document_insights_user_status_idx').on(table.userId, table.status),
  ],
);

export type DocumentInsight = InferSelectModel<typeof documentInsights>;
export type NewDocumentInsight = InferInsertModel<typeof documentInsights>;

/**
 * Approved Facts Table (010-profile-documents)
 * Stores verified factual details and metrics directly available to the Writer and audited by the Critic.
 */
export const approvedFacts = pgTable(
  'approved_facts',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sourceDocumentId: uuid('source_document_id').references(() => documents.id, {
      onDelete: 'set null',
    }),
    sourceInsightId: uuid('source_insight_id').references(() => documentInsights.id, {
      onDelete: 'set null',
    }),
    factCategory: varchar('fact_category', { length: 50 }).notNull().default('general'), // 'achievement' | 'credential' | 'metric' | 'experience' | 'general'
    factText: text('fact_text').notNull(),
    sourceCitation: varchar('source_citation', { length: 255 }), // e.g. "CV, Page 2"
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('approved_facts_user_id_idx').on(table.userId),
    index('approved_facts_source_doc_idx').on(table.sourceDocumentId),
  ],
);

export type ApprovedFact = InferSelectModel<typeof approvedFacts>;
export type NewApprovedFact = InferInsertModel<typeof approvedFacts>;

/**
 * Document Privacy Consents Table (010-profile-documents)
 * Records explicit user acknowledgment of the document processing privacy notice.
 */
export const documentPrivacyConsents = pgTable(
  'document_privacy_consents',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    noticeVersion: varchar('notice_version', { length: 20 }).notNull().default('v1'),
  },
  (table) => [index('doc_privacy_consent_user_idx').on(table.userId)],
);

export type DocumentPrivacyConsent = InferSelectModel<typeof documentPrivacyConsents>;
export type NewDocumentPrivacyConsent = InferInsertModel<typeof documentPrivacyConsents>;

/**
 * Topics Table (011-explore)
 * Stores user-managed research and discovery topic phrases.
 */
export const topics = pgTable(
  'topics',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    phrase: varchar('phrase', { length: 120 }).notNull(),
    reason: text('reason').notNull(),
    isPinned: boolean('is_pinned').notNull().default(false),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('topics_user_id_idx').on(table.userId),
    uniqueIndex('topics_user_phrase_idx').on(table.userId, table.phrase),
  ],
);

export type Topic = InferSelectModel<typeof topics>;
export type NewTopic = InferInsertModel<typeof topics>;

/**
 * Articles Table (011-explore)
 * Caches discovered articles from Tavily or RSS feeds.
 */
export const articles = pgTable(
  'articles',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    canonicalUrl: text('canonical_url').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    sourceDomain: varchar('source_domain', { length: 150 }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    summary: varchar('summary', { length: 500 }).notNull(),
    matchReason: varchar('match_reason', { length: 255 }).notNull(),
    topicPhrase: varchar('topic_phrase', { length: 120 }).notNull(),
    content: text('content'),
    cachedUntil: timestamp('cached_until', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('articles_user_topic_idx').on(table.userId, table.topicPhrase),
    index('articles_cached_until_idx').on(table.cachedUntil),
    uniqueIndex('articles_user_url_idx').on(table.userId, table.canonicalUrl),
  ],
);

export type Article = InferSelectModel<typeof articles>;
export type NewArticle = InferInsertModel<typeof articles>;

/**
 * Saved Articles Table (011-explore)
 * Stores articles bookmarked by users along with private drafting notes.
 */
export const savedArticles = pgTable(
  'saved_articles',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    canonicalUrl: text('canonical_url').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    sourceDomain: varchar('source_domain', { length: 150 }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    summary: varchar('summary', { length: 500 }).notNull(),
    content: text('content'),
    topicPhrase: varchar('topic_phrase', { length: 120 }),
    privateNote: text('private_note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('saved_articles_user_id_idx').on(table.userId),
    uniqueIndex('saved_articles_user_url_idx').on(table.userId, table.canonicalUrl),
  ],
);

export type SavedArticle = InferSelectModel<typeof savedArticles>;
export type NewSavedArticle = InferInsertModel<typeof savedArticles>;

/**
 * Article Dismissals Table (011-explore)
 * Excludes dismissed articles from user feeds.
 */
export const articleDismissals = pgTable(
  'article_dismissals',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    canonicalUrl: text('canonical_url').notNull(),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('article_dismissals_user_url_idx').on(table.userId, table.canonicalUrl),
  ],
);

export type ArticleDismissal = InferSelectModel<typeof articleDismissals>;
export type NewArticleDismissal = InferInsertModel<typeof articleDismissals>;

/**
 * Search Usage Counters Table (011-explore)
 * Tracks daily search requests and monthly Tavily credit expenditure.
 */
export const searchUsageCounters = pgTable(
  'search_usage_counters',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    periodType: varchar('period_type', { length: 20 }).notNull(),
    periodKey: varchar('period_key', { length: 20 }).notNull(),
    count: integer('count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('search_usage_unique_period_idx').on(
      table.userId,
      table.provider,
      table.periodType,
      table.periodKey,
    ),
  ],
);

export type SearchUsageCounter = InferSelectModel<typeof searchUsageCounters>;
export type NewSearchUsageCounter = InferInsertModel<typeof searchUsageCounters>;


