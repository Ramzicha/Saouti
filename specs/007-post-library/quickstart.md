# Quickstart: 007 — Post Library

This document outlines how to execute, verify, and test the Post Library feature.

---

## 1. Prerequisites

Ensure PostgreSQL and Redis containers are running:
```bash
docker compose up -d
```

Verify database connectivity and environment variables:
```bash
pnpm drizzle-kit migrate
```

---

## 2. Key Architecture Components

1. **Tables**:
   - `posts`: Relational persistence of social platform outputs with status and soft-delete support.
   - `post_versions`: Immutable audit snapshots capped at 20 versions per post.
   - `tags`: User tags (max 30 chars).
   - `post_tags`: Up to 5 tags associated per post.
2. **Search Normalization**:
   - PostgreSQL generated `search_vector` combining `simple` (Arabic root/normalized), `english`, and `french` configs.
   - TypeScript sanitizer `normalizeArabicText()` in `src/lib/search/arabic-normalizer.ts`.
3. **Cursor Pagination**:
   - Endpoint `GET /api/posts?cursor=<base64>&limit=20` returns `{ posts, nextCursor, hasMore }`.
4. **Resilient Copy**:
   - Utility `src/lib/clipboard.ts` using `navigator.clipboard.writeText` with `<textarea>` fallback.
5. **Deletion & Undo**:
   - 10-second floating toast countdown in client.
   - Transition to `deletedAt` timestamp for 30-day Trash retention.

---

## 3. Running Automated Tests

### Unit Tests
```bash
# Test Arabic normalizer, clipboard formatter, and Zod schemas
pnpm vitest run tests/unit/arabic-normalizer.test.ts tests/unit/post-schemas.test.ts
```

### Integration Tests
```bash
# Test full database querying, filtering, search, version restoration, and trash lifecycle
pnpm vitest run tests/integration/post-library.test.ts
```

### End-to-End Tests
```bash
# Playwright tests for one-click copy and mark-as-posted flows
pnpm test:e2e tests/e2e/post-library.spec.ts
```

---

## 4. Manual Verification Flow

1. **Auto-Save Verification**:
   - Run a 3-platform post generation from `/workspace`.
   - Navigate to `/library`.
   - Confirm all 3 generated posts appear in the library with platform badges and status `draft`.
2. **One-Click Copy**:
   - Click "Copy" on any post.
   - Verify "Copied!" badge appears for 2 seconds.
   - Paste into external text editor and verify that blank lines, emojis, and hashtags are preserved exactly.
3. **Combined Filters & Arabic Search**:
   - Filter by Platform: LinkedIn, Status: Draft.
   - Search for an Arabic term with and without Hamza (e.g., `أزمة` and `ازمة`).
   - Verify target posts are matched identically.
4. **Version History & Rollback**:
   - Edit the content of a post twice.
   - Open the "Version History" drawer.
   - Click "Restore" on Version 1.
   - Confirm post content reverts and an updated version is recorded.
5. **10-Second Undo Deletion**:
   - Click "Delete" on a post.
   - Verify post disappears from the list and a 10s countdown toast appears.
   - Click "Undo" within 10s: post returns to list.
   - Delete another post and let 10s expire: verify post moves to "Trash".
