import { db } from '../src/lib/db/client';
import { apiKeys } from '../src/lib/db/schema';
import { decryptApiKey } from '../src/lib/crypto/key-encryption';

async function main() {
  const [record] = await db.select().from(apiKeys).limit(1);
  const apiKey = decryptApiKey({
    encryptedKey: record.encryptedKey,
    nonce: record.nonce,
    authTag: record.authTag,
  });

  const candidates = [
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemma-4-31b-it',
    'gemma-4-26b-a4b-it'
  ];

  for (const m of candidates) {
    console.log(`\nTesting ${m}...`);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say hello in one word' }] }]
          }),
          signal: AbortSignal.timeout(6000),
        }
      );
      const data = await res.json() as any;
      if (res.ok) {
        console.log(`SUCCESS for ${m}:`, data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()?.slice(0, 50));
      } else {
        console.log(`FAILED (${res.status}) for ${m}:`, data.error?.message?.slice(0, 150));
      }
    } catch (e: any) {
      console.log(`ERROR for ${m}:`, e?.message);
    }
  }
}

main().catch(console.error);
