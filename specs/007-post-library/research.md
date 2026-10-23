# Research & Architectural Decisions: 007 — Post Library

**Date**: 2026-10-23  
**Status**: Completed  
**Feature Spec**: [specs/007-post-library/spec.md](file:///c:/Users/Ramzi/.gemini/antigravity/scratch/Saouti/specs/007-post-library/spec.md)

---

## 1. Post & PostVersion Schema Architecture

### Context
In Epic 6 (Agent Engine), runs stored generated posts within a JSONB array `runs.posts`. To support a dedicated, filterable, version-controlled library with independent tags, lifecycle statuses, and full-text search, posts must be elevated to first-class relational entities while retaining traceability to their originating run.

### Decision
1. **`posts` table**:
   - Columns: `id` (UUID PK), `userId` (UUID FK -> users.id, cascade), `runId` (UUID FK -> runs.id, set null), `platform` (varchar 50), `language` (varchar 10), `status` (varchar 20: `draft` | `ready` | `posted`), `content` (text), `hashtags` (jsonb array of strings), `imagePrompt` (text), `imageAltText` (text), `imageAspectRatio` (varchar 20), `publishedUrl` (text nullable), `publishedAt` (timestamp tz nullable), `deletedAt` (timestamp tz nullable for 30-day trash lifecycle), `createdAt` (timestamp tz), `updatedAt` (timestamp tz).
   - Composite index on `(user_id, deleted_at, created_at DESC)` for high-performance filtered browsing.
2. **`post_versions` table**:
   - Columns: `id` (UUID PK), `postId` (UUID FK -> posts.id, cascade), `versionNumber` (integer), `content` (text), `hashtags` (jsonb array), `imagePrompt` (text), `changeSummary` (text nullable), `createdAt` (timestamp tz).
   - Unique index on `(post_id, version_number)`.
   - Pruning rule: On each version creation, prune records exceeding the 20 most recent versions (`DELETE FROM post_versions WHERE post_id = $1 AND id NOT IN (SELECT id FROM post_versions WHERE post_id = $1 ORDER BY version_number DESC LIMIT 20)`).
3. **Pipeline Bridge**:
   - When BullMQ agent engine completes a run, an event/hook creates the corresponding `posts` records with `status = 'draft'` and creates initial Version 1 snapshot records.

### Alternatives Considered
- *Store everything inside JSONB on runs*: Rejected because cross-run filtering, multi-condition indexing, GIN search, and tagging would require costly table scans and complex JSONB updates.
- *Separate tables per platform*: Rejected because it introduces unnecessary schema proliferation; platform-specific fields (e.g. subreddits) are easily represented via standard columns and hashtags JSONB.

---

## 2. Multilingual PostgreSQL Full-Text Search (Arabic, French, English)

### Context
Users search library posts across three official languages (English, French, Arabic). Arabic features orthographic variations (Alef with/without Hamza: `أ`, `إ`, `آ`, `ا`, Taa Marbuta `ة` vs Haa `ه`, and diacritical marks/Tashkeel).

### Decision
Implement a hybrid PostgreSQL full-text search strategy backed by a generated `tsvector` column and a GIN index:
1. **Arabic Normalization Function**:
   - A pure normalization function (available in both TypeScript for search query sanitization and PostgreSQL SQL function for generated columns):
     - Maps `[أإآ]` to `ا`
     - Maps `ة` to `ه`
     - Maps `ى` to `ي`
     - Strips Tashkeel / Harakat (`\u064B` to `\u0652`) and Tatweel/Kashida (`\u0640`).
2. **Generated TSVector Column (`search_vector`)**:
   - Configured with `to_tsvector('simple', normalized_text)` for exact root/word matching across Arabic and dialectal terms, combined with `to_tsvector('english', content)` and `to_tsvector('french', content)` for language-specific stemming:
     ```sql
     ALTER TABLE posts ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
       setweight(to_tsvector('simple', coalesce(content, '')), 'A') ||
       setweight(to_tsvector('simple', coalesce(array_to_string(hashtags, ' '), '')), 'A') ||
       setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
       setweight(to_tsvector('french', coalesce(content, '')), 'C')
     ) STORED;
     ```
   - Backed by: `CREATE INDEX posts_search_vector_idx ON posts USING GIN (search_vector);`
3. **Query Matching**:
   - Queries use `websearch_to_tsquery('simple', :query)` alongside a fallback ILIKE/trigram match for partial substring matches.

### Alternatives Considered
- *External search engine (Elasticsearch / Meilisearch)*: Rejected per Principle 7 (Simplicity). PostgreSQL 16 built-in FTS provides sub-10ms query latencies for user libraries under 100,000 items without introducing extra infrastructure.
- *Simple ILIKE only*: Rejected because it does not support ranking, multi-word Boolean operators, or token indexing.

---

## 3. Cursor-Based Keyset Pagination

### Context
Libraries can grow to thousands of posts. Traditional `OFFSET / LIMIT` incurs $O(N)$ scanning costs and produces shifted results when new posts are generated or deleted during user scrolling.

### Decision
Use opaque base64-encoded cursor pagination based on `(created_at, id)` keyset:
1. Cursor format: `base64(JSON.stringify({ createdAt: post.createdAt.toISOString(), id: post.id }))`.
2. Query structure:
   ```sql
   SELECT * FROM posts 
   WHERE user_id = :userId 
     AND deleted_at IS NULL
     AND (:cursorCreatedAt IS NULL OR (created_at, id) < (:cursorCreatedAt, :cursorId))
   ORDER BY created_at DESC, id DESC
   LIMIT :limit + 1;
   ```
3. Default page size: 20 items per page (FR-011).
4. If `rows.length > limit`, slice to 20 and compute `nextCursor` from the 20th item; otherwise `nextCursor = null`.

### Alternatives Considered
- *Offset/Limit*: Rejected due to page-drift under active generation and poor performance on deep pages.

---

## 4. Clipboard API with Resilient Text Fallback

### Context
Users rely on one-click copying to paste formatted posts into LinkedIn, X, Reddit, Instagram, or Facebook. Line breaks (`\n\n`), emojis (including multi-byte skin tone modifiers), and hashtags must remain 100% intact. Furthermore, clipboard access can occasionally be denied by browser security policies or iframe restrictions.

### Decision
Create a resilient `copyToClipboard(text: string)` utility:
1. **Modern API**: Try `await navigator.clipboard.writeText(text)`.
2. **Fallback API**: If `navigator.clipboard` is undefined or throws (e.g. non-HTTPS test runners or restricted contexts):
   - Create a hidden `<textarea>` element positioned off-screen (`left: -9999px`).
   - Set `.value = text`.
   - Append to `document.body`, execute `.select()`, and run `document.execCommand('copy')`.
   - Clean up textarea element.
3. **Preservation Rules**:
   - Use standard LF (`\n`) line endings. Preserve double blank lines.
   - Do not escape or modify Unicode glyphs or emoji sequences.
4. **Accessible Feedback**:
   - Trigger an accessible screen reader announcement (`aria-live="polite"`, "Post copied to clipboard").
   - Display a visual confirmation badge ("Copied!") on the button for 2,000 ms.

### Alternatives Considered
- *Third-party clipboard library (copy-to-clipboard, clipboard.js)*: Rejected per Principle 7 (Simplicity). Native implementation with fallback is ~25 lines of pure TypeScript and introduces zero bundle bloat.

---

## 5. Deletion Lifecycle: 10-Second Undo & 30-Day Trash Bin

### Context
Users need fast, frictionless deletion without disruptive confirm modals, while preventing catastrophic accidental data loss.

### Decision
Two-tier deletion architecture:
1. **Tier 1 (UI Floating Undo Banner - 10s)**:
   - On clicking "Delete", the UI marks the post as pending-deleted, removes it optimistically from the active library view, and triggers a floating toast with a 10-second countdown bar.
   - If the user clicks "Undo" within 10 seconds, the client cancels the pending deletion and restores the card.
2. **Tier 2 (Soft-Delete & 30-Day Trash Bin)**:
   - Once the 10-second timer elapses (or immediately via soft-delete endpoint), `posts.deleted_at` is set to `NOW()`.
   - All standard library queries filter `WHERE deleted_at IS NULL`.
   - A dedicated "Trash" view allows users to view soft-deleted posts, click "Restore" (which resets `deleted_at = NULL`), or "Permanently Delete" (hard DELETE).
   - A background daily cron prunes posts where `deleted_at < NOW() - INTERVAL '30 days'`.

### Alternatives Considered
- *Synchronous confirm modal*: Rejected because it interrupts creator workflow and adds modal fatigue.
- *Immediate hard delete*: Rejected because accidental clicks cannot be undone once network roundtrip completes.

---

## 6. Tag Architecture & Constraints

### Context
Users organize posts across campaigns, themes, and content buckets.

### Decision
1. **`tags` table**: `id` (UUID PK), `userId` (UUID FK -> users.id, cascade), `name` (varchar 30), `color` (varchar 30), `createdAt`. Unique constraint on `(user_id, name)`.
2. **`post_tags` table**: `postId` (UUID FK -> posts.id, cascade), `tagId` (UUID FK -> tags.id, cascade). Composite PK on `(post_id, tag_id)`.
3. **Constraints**:
   - Maximum 5 tags per post enforced by Zod schema and API route validation.
   - Tag name capped at 30 characters, trimmed of whitespace.
   - Assigning a tag either selects an existing tag by name for that user or auto-creates a new tag row.
