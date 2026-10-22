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

---

## 5. Pull Request Checklist

Before submitting a PR:
- [ ] PR title references the feature branch (e.g., `001-project-foundation: Implement core setup`)
- [ ] All tests pass locally (`pnpm test:coverage`)
- [ ] Type check passes (`pnpm type-check`)
- [ ] Linting and formatting pass (`pnpm lint && pnpm format:check`)
- [ ] No secrets or personal API keys are committed or present in log statements
