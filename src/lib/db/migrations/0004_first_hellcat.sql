CREATE TABLE "agent_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"agent_id" varchar(20) NOT NULL,
	"task_label" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"prompt_version" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"duration_ms" integer DEFAULT 0,
	"input_payload" jsonb,
	"output_payload" jsonb,
	"error_code" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_brief" text NOT NULL,
	"selected_platforms" jsonb NOT NULL,
	"target_language" varchar(10) DEFAULT 'en' NOT NULL,
	"arabic_dialect" varchar(20) DEFAULT 'none' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"skip_critic" boolean DEFAULT false NOT NULL,
	"posts" jsonb,
	"total_duration_ms" integer DEFAULT 0,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_steps" ADD CONSTRAINT "agent_steps_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_steps_run_id_idx" ON "agent_steps" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "agent_steps_agent_id_idx" ON "agent_steps" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "runs_user_id_idx" ON "runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "runs_status_idx" ON "runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "runs_created_at_idx" ON "runs" USING btree ("created_at");