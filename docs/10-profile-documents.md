# Epic 10 — Profile Documents (PDF)

**Goal:** let a user enrich their Voice Profile with PDFs (CV, bio, articles, brochures) so the agents have more direction and real facts to work with.
**Depends on:** all MVP epics (E0 to E9) are already built. This epic **extends** existing features; it does not create new foundations.
**PRD:** new requirements PROF-10 to PROF-14 (see the bottom of this file).
**Save as:** `docs/epics/10-profile-documents.md`

## What is different because the app already exists

- Specify describes the user-visible change; **plan must start by reading the existing code** and reuse what is there (storage abstraction, provider layer, agent engine, profile summary builder, account deletion, backups).
- The Writer and Critic prompts change, so **their prompt versions must be bumped** and the golden-profile suite rerun before and after.
- There is production data. Migrations must be additive and safe for users who have no documents.
- Backups, the privacy notice and account deletion must cover the new data.

## Stories

**E10-S1 · Upload PDFs (P1)**
As a professional, I want to upload my CV and other PDFs, so that Saouti understands my background.
- Up to 5 PDFs per user, each within a size and page limit.
- The file type is verified by its content, not only its name.
- Progress is shown and each file can be removed.

**E10-S2 · Label each document (P1)**
As a professional, I want to say what each PDF is (CV, bio, my articles, company brochure, other), so that the right insights are extracted.
- A document type is required before extraction starts.

**E10-S3 · Consent and privacy notice (P1)**
As a professional, I want to know what happens to my documents, so that I decide with full information.
- Before the first upload, a notice explains that the text is sent to my AI provider through my own key, and that free-tier data handling may differ from paid.
- It states that files are stored privately and can be deleted at any time.
- Upload is blocked until the user acknowledges the notice.

**E10-S4 · Extract insights (P1)**
As a professional, I want the Profiler agent to read my PDFs, so that I do not retype my experience.
- It proposes structured items, each with its source page: roles and experience, expertise, achievements, audience cues, tone and style cues (for writing samples), languages.
- Progress appears as Profiler activity in the agent presence component.

**E10-S5 · Review before anything is used (P1)**
As a professional, I want to accept, edit or reject each proposed item, so that nothing wrong enters my profile.
- Nothing is applied automatically.
- Only approved items are used in generation.

**E10-S6 · Approved facts for posts (P1)**
As a professional, I want approved achievements and details to become facts the Writer can use, so that posts are specific and true.
- The Writer may use only approved facts and still must not invent anything else.
- The Critic checks claims in each draft against the approved facts.
- Approved insights and facts appear in the existing "what the AI sees" preview.

**E10-S7 · Unreadable files (P1)**
As a professional, I want clear handling of scanned or protected PDFs, so that I know what to do.
- Password-protected files are rejected with a plain message.
- Scanned files are read through the provider's document reading if the user's key supports it; otherwise the user is told why the file cannot be read.

**E10-S8 · Delete a document (P1)**
As a professional, I want to delete a document, so that I stay in control.
- Deleting removes the file, its extracted text and unapproved insights.
- The user chooses whether to keep or remove facts already approved from it.
- Account deletion (existing story E2-S5) also removes all documents.

**E10-S9 · Safe against hostile PDFs (P1)**
As a user, I want PDF text unable to hijack the agents, so that my posts stay safe.
- PDF text is treated as data. Adversarial test PDFs (for example text telling the agent to ignore its rules) never change agent behaviour.
- Uploaded files are never executed or served publicly.

**E10-S10 · Conflicts with my profile (P2)**
As a professional, I want to see when a document contradicts my profile (for example a different job title), so that I choose the right one.
- Both values are shown and the user picks one.

**E10-S11 · Quota awareness (P2)**
As a professional, I want an estimate before extraction, so that I do not exhaust my free tier unknowingly.
- Show the expected number of requests and a free-tier warning before starting.

## Spec Kit prompts

**Specify**

```
/speckit.specify Extend Saouti so a user can enrich their existing Voice Profile with PDF documents such as a CV, a professional bio, articles they wrote or a company brochure. The user uploads up to five PDFs, labels each by type, and sees a privacy notice before the first upload explaining that the text is sent to their own AI provider through their own key, is stored privately and can be deleted at any time; upload is blocked until they acknowledge it. The Profiler agent reads each document and proposes structured insights with their source page: roles and experience, expertise, achievements, audience cues, tone and style cues, and languages. The user reviews every proposed item and accepts, edits or rejects it; nothing is applied automatically. Approved achievements and details become approved facts that the Writer agent may use in posts, and the Critic checks claims against them; the Writer still never invents anything beyond approved facts. Approved insights and facts appear in the existing preview of what the AI sees. Password-protected files are rejected with a clear message, and scanned files are read only if the user's provider supports it, otherwise the user is told why not. Deleting a document removes the file, its extracted text and unapproved insights, and the user chooses whether to keep or remove the facts already approved from it; deleting the account removes everything. PDF text is treated as data and can never act as instructions. Existing users without documents must see no change in behaviour. Lower priority: conflict resolution against existing profile fields, and a quota estimate before extraction. Out of scope: other file types, links to websites, social profile import, cloud drive import.
```

**Clarify, focus areas**

- Maximum file size and page count.
- Whether the original file is deleted automatically after extraction, keeping only approved items (the more private default), or kept until the user deletes it.
- How Arabic and French PDFs are handled.
- Which insight categories are required.
- Whether approved facts can be switched off per platform (for example Reddit).
- How existing profiles, runs and posts are affected (they should not be).

**Plan**

```
/speckit.plan First inspect the existing codebase and reuse what exists: the storage abstraction, the provider layer, the Profiler agent and event stream, the profile summary builder, the account deletion flow, the backup scripts and the design system components. Store uploaded files on the private volume behind the storage abstraction, served only to the owner through authenticated routes, never from a public path. Validate type by file signature, enforce size and page limits, and reject encrypted PDFs. Extract text on the server with a PDF text library first; if no usable text is found, use the provider layer's native document reading (Gemini accepts PDFs) and otherwise report the file as unreadable. Run extraction as a Profiler agent step through the provider layer with a Zod-validated structured output of items (category, text, source page, confidence). Cap input by page range and chunk long documents. Add Document, DocumentInsight and ApprovedFact tables with additive migrations only; encrypt extracted text at rest with the master key used for API keys. Extend the pure profile summary builder to include approved insights and approved facts, with versioned snapshot tests, and never send full document text in generation calls. Add an approved_facts tagged block to the Writer and Critic prompts, bump both prompt versions, and rerun the golden-profile suite before and after the change to catch regressions. Update backups to include document files and the account deletion flow to cascade to them. Keep document text out of all logs. If the deployment target has no background worker, run extraction inside one request with a page cap that fits the request time limit. Add new components to the design system in both themes and in right to left: upload area, document row with status, insight review card with accept, edit and reject states. Test with fixture PDFs: a text CV in English, French and Arabic, a scanned CV, a password-protected file, an oversized file, a file with a wrong extension, and a prompt-injection PDF.
```

**Tasks hint:** build the approved-facts logic, the prompt changes and the prompt-injection tests before the upload screen. Add the migration and the backup and deletion changes as their own tasks so they are not forgotten.

## Prompt changes (section 7.8 of the PRD)

**Writer.** Add `<approved_facts>` to the list of tagged inputs and replace rule 4 with:

```
4. Never invent facts, statistics, quotes, clients, results or personal stories.
   You may use only statements inside <approved_facts>. For anything else the post
   needs, insert a clear placeholder such as [YOUR NUMBER].
```

**Critic.** Add `<approved_facts>` to the inputs and this instruction:

```
Check every factual claim in each draft against <approved_facts>. A claim that is
neither in <approved_facts> nor a placeholder is a factual-safety failure.
```

## Release checklist

- [ ] Migration applied on staging first, with a copy of production data, then on production.
- [ ] Golden-profile suite rerun with the new prompt versions; no drop in voice match.
- [ ] Backups include document files; a restore was tested.
- [ ] Privacy notice and terms updated in English, French and Arabic.
- [ ] Account deletion removes documents, insights and facts (tested).
- [ ] Hostile PDF set passes; uploaded files are not reachable by URL.
- [ ] Logs checked: no document text or file contents.
- [ ] Works in light, dark and Arabic right to left.
- [ ] If hosting has a request time limit, extraction of a long CV stays within it.

## Document updates

- **PRD:** add PROF-10 (upload and label PDFs), PROF-11 (extract insights), PROF-12 (review and approve), PROF-13 (approved facts used by Writer and checked by Critic), PROF-14 (delete documents and their data). Add entities Document, DocumentInsight, ApprovedFact.
- **design.md:** add the upload area, document row and insight review card (mark them as proposed until drawn on the canvas).
