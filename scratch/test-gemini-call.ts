import { getUserAiAdapter } from '../src/lib/ai/service';
import { db } from '../src/lib/db/client';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const [user] = await db.select().from(users).where(eq(users.email, 'ramzi@saouti.local')).limit(1);
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  const adapter = await getUserAiAdapter(user.id);
  
  const testModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];
  for (const m of testModels) {
    console.log(`Testing model: ${m}...`);
    try {
      const res = await adapter.generateText('Say hello in one word', { model: m });
      console.log(`SUCCESS for ${m}:`, res.text.trim());
      break;
    } catch (e: any) {
      console.error(`FAILED for ${m}:`, e?.message || e);
    }
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
