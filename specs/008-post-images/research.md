# Research & Architectural Decisions: Post Images & Visual Generation

**Feature**: `008-post-images`  
**Date**: 2026-10-23  
**Status**: Completed  

---

## 1. Provider Layer: Image Generation & Capability Detection

### Decision
Extend the `AiProviderAdapter` interface with typed image generation (`generateImage`) and capability detection (`supportsImageGeneration` or structured capability flags). Implement the Gemini adapter using Google's generative AI client targeting `imagen-3.0-generate-002` (configurable via `aiConfig.models.image`), with robust error normalization that distinguishes between:
1. **Unsupported Tier / Model Not Available** (`AiUnsupportedCapabilityError`): User key does not have image generation access or Vertex enablement. Fails gracefully so the UI displays a plain, friendly explanation leaving the prompt intact.
2. **Quota / Rate Limits** (`AiRateLimitError`): HTTP 429 quota exhaustion. Signals a quota pause event with live countdown.
3. **Safety Policy Block** (`AiSafetyBlockError`): Model safety filter triggered. Prompts user to adjust the description without crashing.

### Rationale
- Complying with **Principle 4 (Provider Independence)**: The application layer and worker must never import `@google/genai` directly.
- Free-tier Gemini keys often do not support Imagen 3, or require specific cloud billing. Detecting this deterministically and degrading gracefully to the copyable prompt fulfills PRD `IMG-2` and user requirements.

### Alternatives Considered
- *Hardcoding DALL-E or Midjourney API*: Rejected because Saouti uses BYOK with Gemini as primary provider.
- *Failing with generic HTTP 500 on missing image support*: Rejected because users on standard free tiers would encounter confusing errors rather than understanding that their key is text-only.

---

## 2. Storage Architecture: Local Volume with S3-Ready Abstraction

### Decision
Implement a generic `StorageProvider` abstraction (`saveImage`, `getImageStream`, `deleteImage`, `deleteImages`) and provide a default `LocalStorageProvider` that stores files in an isolated volume (`data/images/{userId}/{postId}/{imageId}.{ext}`). 

### Key Details
- **Path Isolation**: Directory paths strictly validated with `path.resolve` to prevent directory traversal (`..`).
- **Private Access Only**: Images are NEVER placed in Next.js `public/` directory or served statically. Every image is served exclusively through authenticated Next.js App Router streaming endpoints (`/api/posts/[id]/images/[imageId]`).
- **S3 / Object Store Ready**: The `StorageProvider` interface returns streams and promises, allowing drop-in replacement with `@aws-sdk/client-s3` or Cloudflare R2 when deployed to Hostinger VPS or multi-node production without changing post or API logic.

### Rationale
- Complying with **Principle 2 (Security and Privacy First)**: User content and generated visuals are confidential personal assets. Public bucket URLs or static directories would violate cross-user data isolation.
- Complying with **Principle 7 (Simplicity)**: Local disk storage requires no paid external cloud dependencies for local dev and initial VPS hosting, while keeping the architecture modular.

---

## 3. Data Model & Lifecycle: Retention and Cascading Deletion

### Decision
Add a dedicated `images` table in PostgreSQL with a foreign key referencing `posts(id)` with `ON DELETE CASCADE` and `users(id)` with `ON DELETE CASCADE`. 

### Key Details
- Store image metadata: dimensions (`width`, `height`), `aspectRatio`, `fileSizeBytes`, `mimeType`, `storageKey`, `prompt`, `altText`, `refinementInstruction`, `versionNumber`, and `isPrimary`.
- **Retention Policy**: Max 5 iterations per post. When generating a 6th iteration, the oldest non-primary iteration is automatically purged from both the database and the storage volume.
- **Cascade Cleanup**: When a post is permanently deleted or pruned from the trash bin, an application event / hook executes `storageProvider.deleteImages()` to clean up all binary files on disk, ensuring zero orphaned disk leaks.

### Alternatives Considered
- *Storing images as Base64 in PostgreSQL `text` columns*: Rejected because binary blobs bloat database backups, degrade query performance, and exceed memory thresholds.
- *Retaining unlimited images*: Rejected to protect the server from disk exhaustion.

---

## 4. Rate Limiting, Retries & User Experience

### Decision
When the AI provider responds with HTTP 429 during image generation, the system catches the error, parses `retry-after` (defaulting to 20 seconds), and surfaces an active Art Director state:
`"Art Director · Paused, quota reached, retrying in [X] s"`.
The client or worker executes up to 2 exponential backoff retries (e.g., 20s, 40s) while rendering a visible countdown and a manual "Cancel" button.

### Rationale
- Complying with **Principle 5 (Transparency)**: Every agent action and state must be transparently visible. Users understand why the system is waiting and retain control.
