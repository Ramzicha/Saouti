# Technical Research & Architecture Decisions: 003-accounts-auth

**Branch**: `003-accounts-auth` | **Date**: 2026-10-23

This document records the architectural research, evaluation criteria, and security decisions for accounts, authentication, session lifecycle, password security, token management, rate limiting, and multi-tenant data isolation.

---

## 1. Authentication & Session Architecture

### Decision

Implement direct, database-backed session management using Lucia / Oslo cryptographic patterns with Drizzle ORM and PostgreSQL. Sessions are stored in a dedicated `sessions` table (`id` token hash, `userId`, `expiresAt`, `createdAt`). A secure HTTP-only cookie (`saouti-session`) carries a 256-bit cryptographically secure random session token.

### Rationale

1. **Full Control & Data Ownership**: Third-party hosted auth (e.g. Supabase Auth, Clerk, Auth0) introduces external dependencies, data residency concerns, and network roundtrips. A local Drizzle-backed session engine satisfies Principle 7 (Simplicity & OSS) and Principle 2 (Security & Privacy First).
2. **Immediate Server-Side Invalidation**: By keeping session records in PostgreSQL with Redis lookup/caching, deleting an account or resetting a password can atomically invalidate all sessions across all user devices in a single SQL query: `DELETE FROM sessions WHERE user_id = $1`.
3. **App Router & Server Action Synergy**: Next.js 15 Server Actions can synchronously validate the session cookie, extract `userId`, and scope all downstream Drizzle queries without client-side JWT tampering risks.

### Alternatives Considered

- **Stateless JWTs in Cookies**: Cannot be instantly invalidated on password reset or account deletion without maintaining a token revocation blocklist in Redis, which nullifies the stateless benefit.
- **NextAuth.js (Auth.js v5 beta)**: Often unstable across Next.js 15 canary/RC transitions, opaque database adapter layer, and heavier boilerplate for simple custom user lifecycle requirements (like single-use verification links and custom deletion confirmation).

---

## 2. Password Hashing & Breached Protection

### Decision

Use `@node-rs/argon2` (or Node.js native crypto Argon2id) for password hashing and verification.

- Minimum length: 10 Unicode characters.
- Algorithm: `Argon2id` (v=19, m=19456 KiB, t=2 iterations, p=1).
- Salt: 16 cryptographically secure random bytes generated uniquely per hash.

### Rationale

1. **Industry Standard**: Argon2id won the Password Hashing Competition (PHC) and provides superior defense against both GPU/ASIC brute-forcing and side-channel timing attacks compared to legacy bcrypt or PBKDF2.
2. **Deterministic Latency**: Configured to require 250–350 ms CPU work per attempt, preventing high-speed local password dictionary attacks while maintaining responsive UI logins.

### Alternatives Considered

- **bcrypt**: Good, but memory-hard limits are fixed, making it significantly more susceptible to modern FPGA/ASIC hardware brute-forcing.
- **Scrypt**: Good memory hardness, but less resilient to side-channel cache-timing attacks than Argon2id.

---

## 3. Single-Use Tokens (Email Verification & Password Reset)

### Decision

Generate tokens using `crypto.randomBytes(32).toString('hex')` (256 bits of entropy).
Store only the **SHA-256 hash** of the token in PostgreSQL alongside `expiresAt`, `userId`, and `usedAt`.

- **Email Verification Tokens**: Valid for 24 hours (`expiresAt = NOW() + INTERVAL '24 HOURS'`).
- **Password Reset Tokens**: Valid for 1 hour (`expiresAt = NOW() + INTERVAL '1 HOUR'`).

### Rationale

1. **Storage Leak Protection**: If the database is compromised, an attacker cannot redeem tokens from DB dumps because only the SHA-256 hash is stored, not the plaintext token delivered in the email link.
2. **Strict Single-Use**: Consuming a token updates `usedAt = NOW()` inside a serializable transaction; attempting to re-use an already-redeemed token is immediately rejected.
3. **Constant-Time Comparison**: Hashing the incoming URL token with SHA-256 and querying the indexed hash prevents timing attacks.

### Alternatives Considered

- **Storing plaintext tokens in DB**: High risk of unauthorized account verification/reset if database backups leak.
- **Signed JWTs in URLs**: Vulnerable to replay attacks before the expiration window elapses unless a revocation table is queried, making DB-backed tokens simpler and more secure.

---

## 4. Rate Limiting & Anti-Brute-Force

### Decision

Use Redis (`ioredis` already configured in `src/lib/queue/client.ts`) with a sliding-window rate limiter on auth endpoints:

- **Key Scheme**:
  - By IP: `rl:auth:ip:{ip_address}` -> max 5 failed attempts per 15 minutes (900 seconds).
  - By Target Email: `rl:auth:email:{sha256(email)}` -> max 5 failed attempts per 15 minutes.
- **Action on Breach**: Return HTTP 429 Too Many Requests with a generic message: `"Too many failed attempts. Please try again in 15 minutes."`

### Rationale

1. **Credential Stuffing Prevention**: Distributing attacks across multiple IPs targeting the same email is caught by the email key.
2. **Password Spraying Prevention**: Trying common passwords across many accounts from one IP is caught by the IP key.
3. **Generic Error Responses**: Both non-existent emails and wrong passwords increment the counter and emit the identical generic message: `"Invalid email or password"`.

### Alternatives Considered

- **In-Memory Rate Limiting (LRU Cache)**: Fails across multiple server instances or worker restarts. Redis is already part of the project foundation Docker stack.

---

## 5. Transactional Email Abstraction

### Decision

Create a lightweight email interface `EmailService` with two implementations:

1. **Development/Test**: `ConsoleEmailService` — writes verification and password reset links to `logger.info` with clean terminal formatting.
2. **Production**: `ResendEmailService` (or standard SMTP) configured via environment variables.

### Rationale

1. **Zero External Friction**: Developers and CI can run the complete auth flow without external API keys or email server credentials.
2. **Strict Localization**: Email templates (verification, reset, deletion notice) are localized into English, French, and Arabic.

---

## 6. Route Protection & Data Isolation Architecture

### Decision

1. **Middleware Layer (`src/middleware.ts`)**:
   - Matches all app routes (`/`, `/design`, `/settings/:path*`).
   - Checks presence of session cookie.
   - If missing on protected routes, redirects to `/[locale]/login?returnTo=...`.
2. **Data Layer (Mandatory Tenant Scoping)**:
   - Drizzle queries must never query user resources without `eq(table.userId, session.userId)`.
   - Automated tests will instantiate `User A` and `User B`, verify `User A` can never read or mutate `User B`'s records.

---

## 7. Account Deletion (Cascade Purge)

### Decision

Executing account deletion requires:

1. Re-authenticating with the current password.
2. Typing confirmation string (`DELETE` in English/French, `حذف` in Arabic).
3. PostgreSQL foreign keys configured with `ON DELETE CASCADE`:
   - `users` (primary)
   - `sessions` -> cascades
   - `verification_tokens` -> cascades
   - `password_reset_tokens` -> cascades
   - Future `voice_profiles`, `posts`, `api_keys` -> cascades automatically.
