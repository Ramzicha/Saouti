# Quickstart: Profile Documents (PDF)

**Feature**: `010-profile-documents`  
**Date**: 2026-10-24  
**Status**: Ready  

---

## 1. Prerequisites

Ensure PostgreSQL, Redis, and dependencies are installed:
```bash
# Check database migration status
pnpm db:migrate

# Install unpdf for server-side PDF extraction
pnpm add unpdf
```

---

## 2. Running Test Fixtures

Run the new unit and integration test suites:
```bash
# 1. Test PDF parsing and encrypted detection
pnpm test tests/unit/pdf-extractor.test.ts

# 2. Test Profiler document extraction prompt and XML data isolation
pnpm test tests/unit/profiler-document.test.ts

# 3. Test Approved Facts integration into Writer and Critic prompts
pnpm test tests/unit/approved-facts-pipeline.test.ts

# 4. Run Golden Profile regression evaluation (both v1 and v2 prompts)
pnpm test tests/evaluation/agent-engine-eval.test.ts

# 5. Full test suite validation
pnpm test
```

---

## 3. Manual Testing Workflow

1. **Privacy Gate**:
   - Navigate to `/profile` -> Click the new **Documents** tab.
   - Verify that drag-and-drop or file upload triggers the **Privacy Notice Modal**.
   - Confirm upload is blocked until clicking *"I Understand and Agree"*.

2. **PDF Upload & Validation**:
   - Try uploading a password-protected PDF fixture -> Expect error: *"This PDF is password-protected"*.
   - Try uploading an invalid file renamed to `.pdf` -> Expect error: *"Invalid PDF file signature"*.
   - Upload a valid CV (English, French, or Arabic) -> Select label `CV` -> File uploads successfully.

3. **Extraction & Review**:
   - Click *"Extract Insights"*.
   - Watch the Profiler agent status in the header / activity stream.
   - Review proposed cards: Accept a role, Edit an achievement, Reject an unwanted item.
   - Open *"What the AI sees"* preview -> Confirm approved facts appear with source citations (e.g. `CV, Page 2`).

4. **Grounded Generation**:
   - Generate a LinkedIn post using the chat interface.
   - Confirm Writer utilizes the approved facts, and Critic passes verified claims.

5. **Document Deletion**:
   - Delete the document -> Select *"Keep approved facts"*.
   - Verify the PDF file and unapproved items are deleted, while approved facts remain active in the profile.
