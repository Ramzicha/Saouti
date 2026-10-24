CREATE TABLE "approved_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_document_id" uuid,
	"source_insight_id" uuid,
	"fact_category" varchar(50) DEFAULT 'general' NOT NULL,
	"fact_text" text NOT NULL,
	"source_citation" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"category" varchar(50) NOT NULL,
	"raw_text" text NOT NULL,
	"edited_text" text,
	"source_page" integer DEFAULT 1 NOT NULL,
	"confidence_score" integer DEFAULT 100 NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_privacy_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"acknowledged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notice_version" varchar(20) DEFAULT 'v1' NOT NULL,
	CONSTRAINT "document_privacy_consents_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"page_count" integer DEFAULT 1 NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"status" varchar(30) DEFAULT 'uploaded' NOT NULL,
	"extracted_text_encrypted" text,
	"nonce" varchar(32),
	"auth_tag" varchar(32),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "runs" ADD COLUMN IF NOT EXISTS "chat_id" varchar(100);--> statement-breakpoint
ALTER TABLE "approved_facts" ADD CONSTRAINT "approved_facts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approved_facts" ADD CONSTRAINT "approved_facts_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approved_facts" ADD CONSTRAINT "approved_facts_source_insight_id_document_insights_id_fk" FOREIGN KEY ("source_insight_id") REFERENCES "public"."document_insights"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_insights" ADD CONSTRAINT "document_insights_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_insights" ADD CONSTRAINT "document_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_privacy_consents" ADD CONSTRAINT "document_privacy_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approved_facts_user_id_idx" ON "approved_facts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "approved_facts_source_doc_idx" ON "approved_facts" USING btree ("source_document_id");--> statement-breakpoint
CREATE INDEX "document_insights_document_id_idx" ON "document_insights" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_insights_user_status_idx" ON "document_insights" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "doc_privacy_consent_user_idx" ON "document_privacy_consents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_user_id_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_chat_id_idx" ON "runs" USING btree ("chat_id");