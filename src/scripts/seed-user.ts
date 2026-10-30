import { db } from '../lib/db/client';
import { users, posts, postVersions, tags, postTags } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/password';
import { eq } from 'drizzle-orm';

async function seed() {
  const email = process.env.SEED_USER_EMAIL || 'admin@saouti.local';
  const plainPassword = process.env.SEED_USER_PASSWORD || 'password1234';

  console.log(`Checking if user ${email} exists...`);
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  let userId: string;
  if (existing.length === 0) {
    const passwordHash = await hashPassword(plainPassword);
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        emailVerified: true,
      })
      .returning();
    userId = newUser.id;
    console.log(`Created user: ${email} with ID: ${userId}`);
  } else {
    userId = existing[0].id;
    console.log(`User ${email} already exists with ID: ${userId}`);
  }

  // Check if sample post exists
  const existingPosts = await db.select().from(posts).where(eq(posts.userId, userId)).limit(1);
  if (existingPosts.length === 0) {
    console.log('Seeding sample post with Art Director visual prompt...');
    const [samplePost] = await db
      .insert(posts)
      .values({
        userId,
        platform: 'linkedin',
        content:
          'Building high-velocity agentic workflows requires strict contracts, versioned evaluation suites, and graceful degradation.\n\nHere is how we designed Saouti to keep human creators in the driver seat while letting AI handle the heavy lifting.',
        status: 'draft',
        imagePrompt:
          'A sleek, minimalist workspace bathed in warm ambient lighting, showcasing modern architecture blueprints and subtle neon accents, editorial cinematic photography, 8k resolution, shot on 35mm lens.',
        imageAspectRatio: '16:9',
        imageAltText:
          'Minimalist architectural workspace with blueprints and warm lighting',
      })
      .returning();

    // Insert version 1
    await db.insert(postVersions).values({
      postId: samplePost.id,
      versionNumber: 1,
      content: samplePost.content,
      hashtags: ['#AgenticAI', '#ProductDesign', '#NextJS'],
      changeSummary: 'Initial generation from Art Director',
    });

    // Insert a tag
    const [techTag] = await db
      .insert(tags)
      .values({
        userId,
        name: 'AI Engineering',
      })
      .returning();

    await db.insert(postTags).values({
      postId: samplePost.id,
      tagId: techTag.id,
    });

    console.log('Sample post and tags created successfully.');
  }

  console.log('\n=========================================');
  console.log('SUCCESS! Credentials ready:');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${plainPassword}`);
  console.log('=========================================\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
