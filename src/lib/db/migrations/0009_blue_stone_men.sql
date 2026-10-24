CREATE TABLE "article_dismissals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"canonical_url" text NOT NULL,
	"dismissed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"canonical_url" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"source_domain" varchar(150) NOT NULL,
	"published_at" timestamp with time zone,
	"summary" varchar(500) NOT NULL,
	"match_reason" varchar(255) NOT NULL,
	"topic_phrase" varchar(120) NOT NULL,
	"cached_until" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"canonical_url" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"source_domain" varchar(150) NOT NULL,
	"published_at" timestamp with time zone,
	"summary" varchar(500) NOT NULL,
	"topic_phrase" varchar(120),
	"private_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_usage_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"period_key" varchar(20) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"phrase" varchar(120) NOT NULL,
	"reason" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_dismissed_tavily_prompt" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "article_dismissals" ADD CONSTRAINT "article_dismissals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_articles" ADD CONSTRAINT "saved_articles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_usage_counters" ADD CONSTRAINT "search_usage_counters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_dismissals_user_url_idx" ON "article_dismissals" USING btree ("user_id","canonical_url");--> statement-breakpoint
CREATE INDEX "articles_user_topic_idx" ON "articles" USING btree ("user_id","topic_phrase");--> statement-breakpoint
CREATE INDEX "articles_cached_until_idx" ON "articles" USING btree ("cached_until");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_user_url_idx" ON "articles" USING btree ("user_id","canonical_url");--> statement-breakpoint
CREATE INDEX "saved_articles_user_id_idx" ON "saved_articles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_articles_user_url_idx" ON "saved_articles" USING btree ("user_id","canonical_url");--> statement-breakpoint
CREATE UNIQUE INDEX "search_usage_unique_period_idx" ON "search_usage_counters" USING btree ("user_id","provider","period_type","period_key");--> statement-breakpoint
CREATE INDEX "topics_user_id_idx" ON "topics" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topics_user_phrase_idx" ON "topics" USING btree ("user_id","phrase");