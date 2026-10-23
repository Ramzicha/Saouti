import { getUserAiAdapter } from '../src/lib/ai/service';
import { db } from '../src/lib/db/client';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const TestSchema = z.object({
  greeting: z.string(),
  modelUsed: z.string(),
});

async function main() {
  const [user] = await db.select().from(users).where(eq(users.email, 'ramzi@saouti.local')).limit(1);
  const adapter = await getUserAiAdapter(user!.id);
  
  console.log('Testing generateStructured with gemini-3.5-flash...');
  const res = await adapter.generateStructured('Return a JSON with greeting "world" and modelUsed "gemini-3.5-flash"', {
    model: 'gemini-3.5-flash',
    schema: TestSchema,
  });
  console.log('Result:', res.data);
  process.exit(0);
}

main().catch(err => {
  console.error('FAILED structured test:', err);
  process.exit(1);
});
