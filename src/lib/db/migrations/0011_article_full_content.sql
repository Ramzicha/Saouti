ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "content" text;--> statement-breakpoint
ALTER TABLE "saved_articles" ADD COLUMN IF NOT EXISTS "content" text;
