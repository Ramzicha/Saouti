# Developer Quickstart: 003-accounts-auth

**Branch**: `003-accounts-auth` | **Feature**: Accounts and Authentication

This guide explains how to run the authentication stack locally, test user signup, email verification, login/logout, rate limiting, password recovery, and cross-user data isolation.

---

## 1. Running the Local Environment

Ensure PostgreSQL and Redis are running via Docker Compose:

```bash
docker compose up -d db redis
pnpm dev
```

The application will be running at [http://localhost:3000](http://localhost:3000) (or 3001 if port 3000 is occupied).

---

## 2. Testing the Auth Flow

### 2.1 Sign Up & Email Verification

1. Navigate to `/signup`.
2. Enter an email address and a password of at least 10 characters.
3. In local development, the verification link is logged cleanly to the terminal by `ConsoleEmailService`.
4. Click the link (format: `/api/auth/verify?token=...`).
5. Your account transitions to `emailVerified = true`, a session cookie is issued, and you are redirected to the workspace.

### 2.2 Rate Limiting

1. Navigate to `/login`.
2. Attempt to log in with an incorrect password 5 times in a row.
3. On the 6th attempt, notice HTTP 429 Too Many Requests blocking further attempts for 15 minutes.

### 2.3 Password Reset (Enumeration Resistant)

1. Navigate to `/forgot-password`.
2. Enter any email (registered or unregistered).
3. The UI emits the identical confirmation message: _"If an account exists, a link has been sent."_
4. For registered emails, click the single-use 1-hour link in the console log and complete the password change.
5. All other active sessions across devices are automatically terminated.

### 2.4 Account Deletion

1. Navigate to `/settings/account`.
2. Enter your current password and type `DELETE` (or `حذف` in Arabic).
3. Confirm deletion: the user record, sessions, tokens, and data cascade-purge from the database immediately.

---

## 3. Running Automated Tests

```bash
# Run unit and integration tests (including multi-tenant isolation tests)
pnpm test

# Run type check
pnpm type-check

# Run linter
pnpm lint
```
