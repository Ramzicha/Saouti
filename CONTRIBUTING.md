# Contributing to Saouti

Thank you for contributing to Saouti! This document outlines our required workflows, conventions, and quality gates.

---

## 1. Operating System Requirement

- **Linux and macOS** are natively supported.
- **Windows developers MUST use WSL 2**. All scripts, CI automation, and container tooling are built for POSIX environments.

---

## 2. Speckit Specification-First Workflow

Per **Principle 1 (Spec-First Governance)** of the Saouti Constitution:
Every feature or epic MUST complete the speckit pipeline before writing production code:

1. `/02-speckit.specify` → Create initial specification (`spec.md`)
2. `/03-speckit.clarify` → Resolve ambiguities and underspecified areas
3. `/04-speckit.plan` → Implementation plan & design artifacts (`plan.md`, `research.md`, `data-model.md`, `contracts/`)
4. `/05-speckit.tasks` → Dependency-ordered, TDD-focused task list (`tasks.md`)
5. `/06-speckit.analyze` → Non-destructive consistency report ensuring zero constitutional violations
6. `/07-speckit.implement` → Execution of the task plan

---

## 3. Branching & Commit Conventions

- **Branch naming**: `###-short-description` (e.g., `001-project-foundation`, `002-auth-pipeline`).
- **Direct pushes to `main` are blocked**: All code lands via Pull Request.
- **Conventional Commits**:
  Commit messages must strictly follow the Conventional Commits format:
  ```text
  type(scope): subject
  ```
  Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`, `build`.

---

## 4. Test Coverage & Quality Gates

Per **Principle 3 (Test Discipline)** and **Principle 8 (Quality Gates)**:

- **TDD Requirement**: Write test tasks before or alongside implementation tasks.
- **Thresholds**:
  - Global line coverage: **≥ 80%**
  - Security-critical path branch coverage (`src/lib/config.ts`, `src/lib/logger.ts`): **≥ 90%**
- **CI Pipeline Checks**:
  1. `lint` (`pnpm lint` and `prettier --check .`)
  2. `type-check` (`pnpm type-check`)
  3. `test` (`pnpm test:coverage` with postgres and redis service containers)
  4. `build` (`pnpm build`)
  5. `secret-scan` (Gitleaks automated scan blocking credentials or API keys)

## 5. Branch Protection & Review Policies

- The `main` branch is protected. Direct pushes are disabled.
- Merging into `main` requires:
  1. All 5 CI quality checks passing (`lint`, `type-check`, `test`, `build`, `secret-scan`).
  2. At least 1 approved pull request review.
  3. Linear commit history (no merge commits, squash & merge or rebase).

### Re-running Failed Checks

If a transient failure occurs in GitHub Actions:

- Navigate to the **Actions** tab on GitHub.
- Select the failed workflow run.
- Click **Re-run all jobs** or select **Re-run failed jobs**.

### Handling Secret Scan Failures

If Gitleaks detects a leaked credential:

```text
Finding:     ghp_1234567890abcdefghijklmnopqrstuvwxyz
Secret:      ghp_1234567890abcdefghijklmnopqrstuvwxyz
RuleID:      github-pat
File:        src/lib/temp.ts
Line:        12
```

1. **Never commit real secrets**. Replace with an environment variable (`process.env.MY_SECRET`) documented in `.env.example`.
2. Remove the secret from code and amend/rebase your commit history:
   ```bash
   git reset HEAD~1
   # remove secret from file
   git add .
   git commit -m "fix(security): remove accidental credential"
   git push --force-with-lease
   ```

---

## 6. Pull Request Checklist

Before submitting a PR:

- [ ] PR title references the feature branch (e.g., `001-project-foundation: Implement core setup`)
- [ ] All tests pass locally (`pnpm test:coverage`)
- [ ] Type check passes (`pnpm type-check`)
- [ ] Linting and formatting pass (`pnpm lint && pnpm format:check`)
- [ ] No secrets or personal API keys are committed or present in log statements
