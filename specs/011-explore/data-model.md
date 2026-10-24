# Data Model: Explore (with Tavily Search)

**Feature**: `011-explore`  
**Date**: 2026-10-24  
**Status**: Ready  
**Prerequisites**: [spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/011-explore/spec.md), [research.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/011-explore/research.md)

---

## 1. Schema Extensions & New Tables

### Extended Existing Table: `api_keys`
Adds provider discrimination so a single user can have both an AI provider key (`gemini`) and a search provider key (`tavily`).

```sql
ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "provider" varchar(50) NOT NULL DEFAULT 'gemini';
DROP INDEX IF EXISTS "api_keys_user_id_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_user_provider_idx" ON "api_keys" ("user_id", "provider");
```

---

### Extended Existing Table: `users`
Tracks whether an existing user has dismissed the one-time Tavily search onboarding prompt.

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "has_dismissed_tavily_prompt" boolean NOT NULL DEFAULT false;
```

---

### New Table: `topics`
Stores the user's active, pinned, or custom research topics.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, Default `gen_random_uuid()` | Unique topic identifier |
| `user_id` | `uuid` | NOT NULL, FK `users.id` (cascade delete) | Owner user ID |
| `phrase` | `varchar(120)` | NOT NULL | Search query phrase (2 to 6 words) |
| `reason` | `text` | NOT NULL | Profile matching rationale |
| `is_pinned` | `boolean` | NOT NULL, Default `false` | Whether topic is pinned to front of list |
| `order_index` | `integer` | NOT NULL, Default `0` | Visual display order |
| `created_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Creation timestamp |
| `updated_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Last modification timestamp |

**Indexes**:
- `index("topics_user_id_idx").on(table.userId)`
- `uniqueIndex("topics_user_phrase_idx").on(table.userId, table.phrase)`

---

### New Table: `articles`
Stores ephemeral cached search discoveries retrieved from Tavily or RSS feeds.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, Default `gen_random_uuid()` | Unique article discovery ID |
| `user_id` | `uuid` | NOT NULL, FK `users.id` (cascade delete) | Scoped user identifier |
| `canonical_url` | `text` | NOT NULL | Normalized URL (stripped tracking query parameters) |
| `title` | `varchar(500)` | NOT NULL | Article headline |
| `source_domain` | `varchar(150)` | NOT NULL | Publisher domain (e.g. `techcrunch.com`) |
| `published_at` | `timestamp with time zone` | NULLABLE | Original publication date if known |
| `summary` | `varchar(500)` | NOT NULL | Plain-language summary in Saouti's words (≤40 words) |
| `match_reason` | `varchar(255)` | NOT NULL | Concise rationale of why it matches user profile |
| `topic_phrase` | `varchar(120)` | NOT NULL | Topic phrase that discovered this item |
| `cached_until` | `timestamp with time zone` | NOT NULL | Cache expiry timestamp (now + 24 hours) |
| `created_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Record creation timestamp |

**Indexes**:
- `index("articles_user_topic_idx").on(table.userId, table.topicPhrase)`
- `index("articles_cached_until_idx").on(table.cachedUntil)`
- `uniqueIndex("articles_user_url_idx").on(table.userId, table.canonicalUrl)`

---

### New Table: `saved_articles`
Stores articles bookmarked by the user for subsequent post drafting.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, Default `gen_random_uuid()` | Unique saved bookmark ID |
| `user_id` | `uuid` | NOT NULL, FK `users.id` (cascade delete) | Owner user ID |
| `canonical_url` | `text` | NOT NULL | Normalized publisher URL |
| `title` | `varchar(500)` | NOT NULL | Headline |
| `source_domain` | `varchar(150)` | NOT NULL | Publisher domain |
| `published_at` | `timestamp with time zone` | NULLABLE | Original publication date |
| `summary` | `varchar(500)` | NOT NULL | Cached summary text |
| `topic_phrase` | `varchar(120)` | NULLABLE | Associated topic |
| `private_note` | `text` | NULLABLE | User's personal angle or drafting notes |
| `created_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Timestamp when bookmarked |
| `updated_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Last note update |

**Indexes**:
- `index("saved_articles_user_id_idx").on(table.userId)`
- `uniqueIndex("saved_articles_user_url_idx").on(table.userId, table.canonicalUrl)`

---

### New Table: `article_dismissals`
Tracks articles dismissed by the user ("Not interested") to exclude them from future feeds.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, Default `gen_random_uuid()` | Unique dismissal ID |
| `user_id` | `uuid` | NOT NULL, FK `users.id` (cascade delete) | Owner user ID |
| `canonical_url` | `text` | NOT NULL | Normalized dismissed URL |
| `dismissed_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Dismissal timestamp |

**Indexes**:
- `uniqueIndex("article_dismissals_user_url_idx").on(table.userId, table.canonicalUrl)`

---

### New Table: `search_usage_counters`
Tracks daily query volume and monthly Tavily credit expenditure.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, Default `gen_random_uuid()` | Usage row ID |
| `user_id` | `uuid` | NOT NULL, FK `users.id` (cascade delete) | Owner user ID |
| `provider` | `varchar(50)` | NOT NULL | `'tavily' | 'feed'` |
| `period_type` | `varchar(20)` | NOT NULL | `'daily' | 'monthly'` |
| `period_key` | `varchar(20)` | NOT NULL | e.g. `'2026-10-24'` or `'2026-10'` |
| `count` | `integer` | NOT NULL, Default `0` | Number of credits/queries used |
| `created_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Period start |
| `updated_at` | `timestamp with time zone` | NOT NULL, Default `now()` | Last increment |

**Indexes**:
- `uniqueIndex("search_usage_unique_period_idx").on(table.userId, table.provider, table.periodType, table.periodKey)`

---

## 2. Validation Schemas (Zod)

```typescript
import { z } from 'zod';

export const TavilyKeyInputSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(10, 'Tavily API key is required')
    .regex(/^tvly-[a-zA-Z0-9_-]+$/, 'Invalid Tavily API key format (expected tvly-...)'),
});

export const TopicCreateSchema = z.object({
  phrase: z
    .string()
    .trim()
    .min(2, 'Topic must be at least 2 characters')
    .max(120, 'Topic must not exceed 120 characters'),
  reason: z.string().trim().max(300).optional().default('Custom user topic'),
  isPinned: z.boolean().optional().default(false),
});

export const TopicUpdateSchema = TopicCreateSchema.partial();

export const SaveArticleInputSchema = z.object({
  canonicalUrl: z.string().url('Valid URL is required'),
  title: z.string().min(1).max(500),
  sourceDomain: z.string().min(1).max(150),
  publishedAt: z.string().datetime().optional().nullable(),
  summary: z.string().min(1).max(500),
  topicPhrase: z.string().max(120).optional(),
  privateNote: z.string().max(1000).optional(),
});

export const UpdateSavedArticleNoteSchema = z.object({
  privateNote: z.string().max(1000).optional().nullable(),
});

export const DismissArticleSchema = z.object({
  canonicalUrl: z.string().url(),
});

export const ExploreSearchQuerySchema = z.object({
  topic: z.string().optional(),
  freshness: z.enum(['day', 'week', 'month']).optional().default('week'),
  language: z.enum(['en', 'fr', 'ar']).optional(),
  forceRefresh: z.boolean().optional().default(false),
});
```
