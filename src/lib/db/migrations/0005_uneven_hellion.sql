CREATE OR REPLACE FUNCTION normalize_arabic(text_val text) 
RETURNS text AS $$
BEGIN
  IF text_val IS NULL THEN
    RETURN '';
  END IF;
  text_val := regexp_replace(text_val, '[أإآ]', 'ا', 'g');
  text_val := regexp_replace(text_val, 'ة', 'ه', 'g');
  text_val := regexp_replace(text_val, 'ى', 'ي', 'g');
  text_val := regexp_replace(text_val, '[\u064B-\u0652]', '', 'g');
  text_val := regexp_replace(text_val, '\u0640', '', 'g');
  RETURN text_val;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "post_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"content" text NOT NULL,
	"hashtags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_prompt" text,
	"change_summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"run_id" uuid,
	"platform" varchar(50) NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"content" text NOT NULL,
	"hashtags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_prompt" text,
	"image_alt_text" text,
	"image_aspect_ratio" varchar(20),
	"published_url" text,
	"published_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"search_vector" "tsvector" GENERATED ALWAYS AS (
		setweight(to_tsvector('simple', normalize_arabic(coalesce(content, ''))), 'A') ||
		setweight(to_tsvector('simple', coalesce(content, '')), 'A') ||
		setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
		setweight(to_tsvector('french', coalesce(content, '')), 'C')
	) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(30) NOT NULL,
	"color" varchar(30) DEFAULT '#6366f1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_versions" ADD CONSTRAINT "post_versions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_tags_tag_id_idx" ON "post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_version_num_idx" ON "post_versions" USING btree ("post_id","version_number");--> statement-breakpoint
CREATE INDEX "post_versions_post_id_idx" ON "post_versions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "posts_user_status_created_idx" ON "posts" USING btree ("user_id","deleted_at","created_at");--> statement-breakpoint
CREATE INDEX "posts_user_platform_idx" ON "posts" USING btree ("user_id","platform");--> statement-breakpoint
CREATE INDEX "posts_run_id_idx" ON "posts" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "posts_search_vector_idx" ON "posts" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_idx" ON "tags" USING btree ("user_id","name");