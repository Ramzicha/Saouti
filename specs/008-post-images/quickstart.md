# Quickstart & Verification: Post Images & Visual Generation

**Feature**: `008-post-images`  
**Date**: 2026-10-23  

---

## 1. Local Testing Setup

Ensure the local PostgreSQL database is running and up-to-date with migrations:

```bash
# Run migrations
pnpm drizzle-kit migrate
```

Verify the storage directory exists (automatically created by `LocalStorageProvider`):
```text
data/images/
```

---

## 2. Generating Images with Fake Provider (CI / Tests)

In automated tests and local development without a Gemini billing key, the fake provider simulates image generation:

```typescript
import { FakeAiAdapter } from '@/lib/ai/fake-adapter';

const fake = new FakeAiAdapter();
fake.setImageGenerationBehavior('success'); // or 'unsupported_tier', 'rate_limit'

const result = await fake.generateImage('A vibrant editorial photo of a solar desert farm', {
  aspectRatio: '16:9',
});

console.log(result.mimeType); // 'image/png'
console.log(result.imageUrls); // ['data:image/png;base64,...']
```

---

## 3. Manual Testing Walkthrough

1. **Viewing Art Director Prompts**:
   - Open any post in the workspace or library.
   - Inspect the visual section: editable prompt, aspect ratio badge (e.g. `16:9`), and alt text.
   - Click "Copy Prompt" -> toast confirms copied prompt to clipboard.

2. **Triggering Image Generation**:
   - If key supports image generation: click "Generate Image".
   - Observe Art Director status: *"Art Director · Composing visual asset..."*.
   - Preview renders securely on the post card.

3. **Graceful Degradation (Unsupported Key)**:
   - If key has no Imagen access, observe clear banner:
     *"Your configured AI provider key does not support direct image generation. You can copy the Art Director prompt above and generate the image using your preferred visual tool."*
   - Generation button disabled; prompt remains copyable and editable.

4. **Downloading & Cascading Deletion**:
   - Click "Download Image" -> file downloads as `saouti-[platform]-[id].png`.
   - Delete the post -> inspect database and `data/images/` to verify all image records and files are removed.
