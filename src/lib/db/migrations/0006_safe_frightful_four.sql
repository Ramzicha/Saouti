CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"mime_type" varchar(64) DEFAULT 'image/png' NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"aspect_ratio" varchar(16) DEFAULT '16:9' NOT NULL,
	"prompt" text NOT NULL,
	"alt_text" text,
	"refinement_instruction" text,
	"version_number" integer DEFAULT 1 NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "images_user_id_idx" ON "images" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "images_post_id_idx" ON "images" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "images_post_id_primary_idx" ON "images" USING btree ("post_id","is_primary");