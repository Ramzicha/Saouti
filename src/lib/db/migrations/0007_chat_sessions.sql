ALTER TABLE "runs" ADD COLUMN IF NOT EXISTS "chat_id" varchar(100);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_chat_id_idx" ON "runs" USING btree ("chat_id");
--> statement-breakpoint
UPDATE "runs" SET "chat_id" = "id"::text WHERE "chat_id" IS NULL;
