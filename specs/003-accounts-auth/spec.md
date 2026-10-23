# Feature Specification: Accounts and Authentication

**Feature Branch**: `003-accounts-auth`  
**Created**: 2026-10-23  
**Status**: Draft  
**Input**: User description: "Add accounts and authentication to Saouti. A professional can sign up with email and password, verify the email through a single-use link that expires after 24 hours, log in and out, reset a forgotten password through a single-use link that expires after one hour, and permanently delete the account with all associated data after confirming the password. Login failures show one generic message and are rate limited. Password resets never reveal whether an email exists. All private pages and data are accessible only to the signed-in owner, and tests must prove that one user can never access another user's data. All screens work in English, French and Arabic and in both themes. Optional (lower priority): Google sign-in. Out of scope: teams, roles, payments."

---

## Assumptions & Clarifications

Based on `docs/Saouti — Epics, User Stories and Spec Kit Prompts.md` (Epic 2) and `docs/design-system/design.md`, the clarification focus areas are resolved as follows:

1. **Password Policy & Breached Checks**:
   - Minimum password length is 10 characters (Unicode string).
   - Passwords must be hashed using Argon2id (or bcrypt with work factor >= 12) with unique salt per user. Plaintext passwords must never be logged or stored.
2. **Session Security & Idle Timeout**:
   - Authentication sessions use secure, HTTP-only, `SameSite=Lax` cookies with a 14-day absolute expiration and rolling refresh on active usage.
   - Logging out ends the session immediately on the server and expires the cookie.
3. **Email Verification & Password Reset**:
   - Verification links use cryptographically random tokens (256-bit entropy) hashed before storage in the database, valid for 24 hours and single-use only.
   - Password reset links are valid for 1 hour and single-use only. Requesting a reset for an unknown email returns the exact same generic success message ("If an account exists for this email, a reset link has been sent").
   - Completing a password reset automatically invalidates all existing active sessions for that user account.
4. **Account Deletion & Data Isolation**:
   - Deletion requires entering the current password and typing a confirmation word ("DELETE").
   - Deletion immediately cascades and permanently purges user profile data, voice samples, generated posts, runs, and stored API keys.
5. **Rate Limiting & Anti-Brute-Force**:
   - Login attempts are rate limited: maximum 5 failed attempts per 15-minute window per IP address and per email target (using Redis). Subsequent attempts return a generic lock message.
6. **Unverified Accounts**:
   - Users who have not verified their email cannot access private application routes (e.g. `/` workspace, `/settings`); attempting to log in or navigate prompts a persistent banner/screen allowing them to resend the verification email.
7. **Scope & Languages**:
   - All auth forms (`/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/settings/account`) work in English (`en`), French (`fr`), and Arabic (`ar`, RTL) and support dark/light themes without flash.
   - Out of scope: Organization teams, multi-role RBAC, billing/payments. Google sign-in is specified as P2.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Professional Sign-Up & Password Hashing (Priority: P1) 🎯 MVP

As a prospective professional, I want to create an account with my email address and a secure password of at least 10 characters, so that my work and preferences can be saved securely.

**Why this priority**: Account creation is the front gateway to all personalized Saouti services and is a prerequisite for user data isolation.

**Independent Test**: Submit a registration form with valid email and 10+ character password; verify that an unverified user record is created in PostgreSQL with salted Argon2id hash, and an email verification token is generated.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on `/signup`, **When** they submit a valid email and a password of 10 or more characters, **Then** an unverified user account is created with an Argon2id-hashed password, and a 24-hour verification token is dispatched.
2. **Given** an attempt to sign up with a password shorter than 10 characters, **When** submitted, **Then** registration is blocked with a clear client and server validation message.
3. **Given** an existing registered email, **When** someone attempts to register again with that email, **Then** the system does not create a duplicate account and presents a generic informational notice without leaking user identity to third parties.
4. **Given** the registration form, **When** viewed in Arabic, French, or English, **Then** all labels, error messages, and inputs render in the selected language and proper text direction.

**Test Plan** _(Principle 3 — required)_:

- Unit: Validation schema for signup input (Zod), password hash strength verification.
- Integration: API endpoint test for `POST /api/auth/signup`, checking DB insertion and absence of plaintext password anywhere in DB or logs.
- Security path covered: [x] Yes (Argon2id password hashing, zero plaintext logging).

---

### User Story 2 — Single-Use Email Verification (Priority: P1)

As a newly registered user, I want to verify my email address via a single-use link that expires after 24 hours, so that I can prove ownership of the address before accessing workspace generation tools.

**Why this priority**: Email verification prevents abuse, ensures delivery of password resets, and prevents account hijacking.

**Independent Test**: Click valid verification link within 24 hours -> account status transitions to verified and user is directed to the onboarding/workspace shell. Re-clicking the link or using an expired link shows a clear expiration message with an option to request a fresh link.

**Acceptance Scenarios**:

1. **Given** a newly signed-up unverified user, **When** they click the 24-hour verification link, **Then** their account is marked `emailVerified = true`, the token is invalidated, a session cookie is issued, and they are redirected to the workspace.
2. **Given** a verification token older than 24 hours, **When** clicked, **Then** the verification is rejected with an expired token notice, and a "Resend verification email" action is presented.
3. **Given** a token that has already been redeemed, **When** accessed again, **Then** it is rejected as invalid/used.
4. **Given** an unverified user attempting to log in, **When** credentials match, **Then** they are notified that email verification is pending and given an immediate option to resend the link.

**Test Plan** _(Principle 3 — required)_:

- Unit: Token expiry calculation, single-use token verification logic.
- Integration: `GET /api/auth/verify?token=...` testing success, reuse failure, and expired token rejection.
- Security path covered: [x] Yes (Single-use token invalidation, timing attack prevention).

---

### User Story 3 — Secure Log In, Log Out & Rate Limiting (Priority: P1)

As a verified user, I want to log in with my email and password and securely log out, so that I control active access to my workspace across browser sessions.

**Why this priority**: Core authentication protocol protecting private routes and user content.

**Independent Test**: Submit correct credentials -> receive HTTP-only cookie and access workspace. Submit incorrect credentials -> receive generic error. Fail 5 times in a row -> get rate-limited. Log out -> session cookie invalidated server-side and redirected to login.

**Acceptance Scenarios**:

1. **Given** valid user credentials, **When** submitted to `/login`, **Then** a secure, HTTP-only, `SameSite=Lax` session cookie is established, and the user is redirected to their workspace.
2. **Given** incorrect password or non-existent email, **When** submitted to `/login`, **Then** a single generic error message is returned ("Invalid email or password"), without specifying whether the email or password was wrong.
3. **Given** 5 consecutive failed login attempts within 15 minutes from an IP or targeting an email, **When** a 6th attempt is made, **Then** the request is blocked by rate limiting with HTTP 429 ("Too many attempts. Please try again in 15 minutes.").
4. **Given** an active authenticated session, **When** the user clicks "Log out", **Then** the session is destroyed on the server (Redis/DB) and the cookie is cleared.

**Test Plan** _(Principle 3 — required)_:

- Unit: Password verification with Argon2id, generic error mapping.
- Integration: Full login/logout flow, Redis-backed rate limiter test hitting threshold.
- Security path covered: [x] Yes (Generic failure responses, brute-force mitigation, secure cookies).

---

### User Story 4 — Privacy-Preserving Password Reset (Priority: P1)

As a user who forgot my password, I want to request a reset link sent to my email that expires after 1 hour, so that I can regain access without revealing to third parties whether an email address is registered on Saouti.

**Why this priority**: Essential account recovery mechanism that must prevent user enumeration and session retention.

**Independent Test**: Request password reset for existing email -> receive 1-hour single-use token. Request password reset for unregistered email -> UI shows identical confirmation message. Complete reset with new password -> old sessions invalidated.

**Acceptance Scenarios**:

1. **Given** any email address submitted to `/forgot-password`, **When** processed, **Then** the UI displays the identical confirmation message ("If an account exists, a link has been sent"), regardless of whether the email is registered.
2. **Given** a valid reset token within 1 hour, **When** the user submits a new 10+ character password, **Then** the password hash is updated, the reset token is invalidated, and all existing active sessions for that account are revoked.
3. **Given** an expired (> 1 hour) or previously used reset token, **When** submitted, **Then** the reset is rejected with an expired link notification.

**Test Plan** _(Principle 3 — required)_:

- Unit: Token expiry validator, enumeration resistance verification.
- Integration: Reset request, token verification, session invalidation across multiple browser sessions.
- Security path covered: [x] Yes (No user enumeration, token revocation, cross-session invalidation).

---

### User Story 5 — Complete & Irreversible Account Deletion (Priority: P1)

As a registered professional, I want to permanently delete my account and all associated data after confirming my password, so that I maintain total control over my privacy and personal records.

**Why this priority**: Principle 2 (Security & Privacy First) and GDPR mandate total data deletion upon user request.

**Independent Test**: Navigate to `/settings/account`, enter current password and type "DELETE", confirm deletion -> all database records associated with the user are permanently deleted, session is destroyed, and the user is redirected to the home page.

**Acceptance Scenarios**:

1. **Given** an authenticated user in Account Settings, **When** they initiate account deletion, **Then** the system prompts for their current password and confirmation text ("DELETE").
2. **Given** correct deletion confirmation, **When** submitted, **Then** the user record, session records, profile data, voice samples, generated posts, and stored encrypted API keys are permanently deleted from PostgreSQL and Redis in a single database transaction.
3. **Given** an incorrect password during deletion confirmation, **When** submitted, **Then** deletion is aborted and no data is modified.
4. **Given** completed account deletion, **When** the former user attempts to log in, **Then** login fails with the generic invalid credentials message.

**Test Plan** _(Principle 3 — required)_:

- Unit: Password verification check before deletion.
- Integration: Cascade deletion test verifying 0 remaining records for user in `users`, `sessions`, `api_keys`, and `posts`.
- Security path covered: [x] Yes (Irreversible data purge, re-authentication challenge).

---

### User Story 6 — Route Protection & Strict Data Isolation (Priority: P1)

As a user, I want private routes and data endpoints to be accessible only when authenticated, with every database query strictly scoped to my user ID, so that no user can ever access or mutate another user's content.

**Why this priority**: Principle 2 mandates strict per-user data isolation. Cross-tenant leakage is a catastrophic security failure.

**Independent Test**: Automated test creates User A and User B. Attempt to read or modify User A's data using User B's authenticated session -> server returns HTTP 404/403. Attempt to access workspace without session -> redirects to `/login`.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** attempting to access `/`, `/settings`, or private API routes, **Then** the request is redirected to `/login` with a `returnTo` parameter.
2. **Given** two authenticated users (User A and User B), **When** User B attempts to fetch or mutate any resource owned by User A via direct ID reference, **Then** the request is rejected with 404 Not Found or 403 Forbidden.
3. **Given** all database queries fetching user data, **When** constructed, **Then** the query explicitly filters by `userId === session.userId`.

**Test Plan** _(Principle 3 — required)_:

- Unit: Middleware route protection matcher, session resolver.
- Integration: Cross-user authorization matrix test (User A vs User B).
- Security path covered: [x] Yes (Multi-tenant data isolation, horizontal privilege escalation prevention).

---

### User Story 7 — Optional Google Social Sign-In (Priority: P2)

As a user, I want the option to sign in with my Google account, so that I can access Saouti with one click without maintaining a separate password.

**Why this priority**: Low friction convenience, specified as optional lower priority (P2).

**Independent Test**: Click "Continue with Google" -> authenticate via Google OAuth2 -> redirected to Saouti with an authenticated session.

**Acceptance Scenarios**:

1. **Given** a user on `/login` or `/signup`, **When** they click "Continue with Google", **Then** they are redirected to Google's consent screen.
2. **Given** successful Google OAuth callback with verified email, **When** processed, **Then** a verified user record is created (or linked if existing after re-auth confirmation) and a session is issued.
3. **Given** a canceled or failed Google OAuth callback, **When** redirected back to Saouti, **Then** a clear error message is shown on the login page.

**Test Plan** _(Principle 3 — required)_:

- Unit: OAuth state and PKCE parameter generation.
- Integration: Mocked OAuth callback handler.
- Security path covered: [x] Yes (PKCE protection, state CSRF validation).

---

## Edge Cases

- **Concurrent password resets**: If multiple password reset requests are submitted in quick succession, only the latest token remains valid; earlier tokens are immediately revoked.
- **Clock drift & race conditions on token expiration**: Tokens check `expiresAt > NOW()` with millisecond precision to eliminate token reuse past cutoff.
- **Session invalidation across devices**: Logging out from one device invalidates only that device's session; resetting the password or deleting the account invalidates all sessions across all devices.
- **Accidental double-click on account deletion**: Deletion endpoint uses transactional locking (`FOR UPDATE`) to ensure the deletion operation is idempotent and runs only once.
- **Language switching on auth screens**: When a user switches language on `/login` or `/signup`, any existing query parameters (such as `returnTo` or `email`) are preserved across the localized redirect.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Users MUST be able to sign up with an email address and a password containing at least 10 characters.
- **FR-002**: Passwords MUST be hashed using Argon2id with unique cryptographic salts before persistence. Plaintext passwords MUST NOT be logged or persisted anywhere.
- **FR-003**: Upon signup, the system MUST dispatch a single-use verification email with a token that expires after 24 hours.
- **FR-004**: Users MUST NOT be able to access the core workspace or private features until their email address is verified.
- **FR-005**: Authentication MUST issue secure, HTTP-only, `SameSite=Lax` session cookies with 14-day absolute validity.
- **FR-006**: Failed login attempts MUST return a generic error message ("Invalid email or password") regardless of whether the email or password was invalid.
- **FR-007**: Login endpoints MUST enforce rate limiting: maximum 5 failed attempts per 15-minute window per IP and per target email.
- **FR-008**: Forgotten password requests MUST accept an email and always return the same confirmation response, revealing zero information about whether the email exists in the database.
- **FR-009**: Password reset tokens MUST be single-use and expire exactly 1 hour after generation.
- **FR-010**: Successfully resetting a password MUST invalidate all active sessions for that user account across all devices.
- **FR-011**: Users MUST be able to delete their account from Account Settings by entering their current password and typing "DELETE".
- **FR-012**: Account deletion MUST permanently remove all user records (profile, runs, posts, stored API keys) within a single database transaction.
- **FR-013**: Middleware MUST intercept all private routes (`/`, `/design`, `/settings`, etc.) and redirect unauthenticated users to `/login`.
- **FR-014**: All database queries for user resources MUST enforce `where(eq(table.userId, authenticatedUserId))`.
- **FR-015**: All authentication views (`/login`, `/signup`, `/verify`, `/forgot-password`, `/reset-password`) MUST be localized in English, French, and Arabic (RTL) and render without flash in both light and dark themes.
- **FR-016**: Optional Google OAuth2 sign-in (P2) MUST implement standard PKCE and state verification to prevent CSRF.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Successful sign-up to session issuance completes in < 800 ms (excluding user email reading time).
- **SC-002**: Password verification on login executes with Argon2id within 200 ms to 400 ms CPU work time to resist offline brute force.
- **SC-003**: 100% of failed login responses return identical generic error text and identical HTTP 401 status.
- **SC-004**: 100% of password reset submission responses return identical generic confirmation text for registered and unregistered emails.
- **SC-005**: 100% of cross-user data access attempts (User A querying User B's resource) are rejected with HTTP 404 or 403 in automated tests.
- **SC-006**: 100% of user data is irreversibly purged upon account deletion with zero orphaned rows.
- **SC-007**: All authentication forms pass automated WCAG AA accessibility tests in both dark and light modes with 0 violations.
- **SC-008**: All authentication views achieve 100% layout mirroring and correct text flow when viewed in Arabic (`dir="rtl"`).
