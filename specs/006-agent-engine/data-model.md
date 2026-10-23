# Data Model: 006 — Agent Engine & Live Activity

**Feature**: 006-agent-engine  
**Date**: 2026-10-23  
**Status**: Completed  

---

## 1. Drizzle ORM Schema Specifications

```typescript
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './schema';

/**
 * Runs Table
 * Stores post generation requests and resulting platform outputs.
 */
export const runs = pgTable(
  'runs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    topicBrief: text('topic_brief').notNull(),
    selectedPlatforms: jsonb('selected_platforms')
      .$type<string[]>()
      .notNull(),
    targetLanguage: varchar('target_language', { length: 10 })
      .notNull()
      .default('en'),
    arabicDialect: varchar('arabic_dialect', { length: 20 })
      .notNull()
      .default('none'),
    status: varchar('status', { length: 20 })
      .notNull()
      .default('pending'), // 'pending' | 'running' | 'completed' | 'cancelled' | 'failed' | 'timed_out'
    skipCritic: boolean('skip_critic').notNull().default(false),
    posts: jsonb('posts').$type<
      Array<{
        platform: string;
        language: string;
        text: string;
        hashtags: string[];
        imagePrompt?: string | undefined;
        imageAltText?: string | undefined;
        imageAspectRatio?: string | undefined;
        criticVerdict?: 'pass' | 'revise' | undefined;
        criticScores?: Record<string, number> | undefined;
        criticIssues?: Array<{
          exactPhrase: string;
          problem: string;
          suggestedFix: string;
        }> | undefined;
      }>
    >(),
    totalDurationMs: integer('total_duration_ms').default(0),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('runs_user_id_idx').on(table.userId),
    index('runs_status_idx').on(table.status),
    index('runs_created_at_idx').on(table.createdAt),
  ],
);

/**
 * Agent Steps Table
 * Granular audit trail for each model invocation within a run.
 */
export const agentSteps = pgTable(
  'agent_steps',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    runId: uuid('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    agentId: varchar('agent_id', { length: 20 }).notNull(), // 'writer' | 'critic' | 'art_director'
    taskLabel: varchar('task_label', { length: 100 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    promptVersion: varchar('prompt_version', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(), // 'running' | 'completed' | 'failed' | 'skipped'
    durationMs: integer('duration_ms').default(0),
    inputPayload: jsonb('input_payload').$type<Record<string, unknown>>(),
    outputPayload: jsonb('output_payload').$type<Record<string, unknown>>(),
    errorCode: varchar('error_code', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('agent_steps_run_id_idx').on(table.runId),
    index('agent_steps_agent_id_idx').on(table.agentId),
  ],
);
```

---

## 2. State Machine Transitions

| Current State | Event Trigger | Next State | Actions & Side Effects |
| :--- | :--- | :--- | :--- |
| `pending` | Worker dequeues job | `running` | Initialize run, load user profile & key, emit `run.started` |
| `running` (Writer) | Writer model call complete | `running` (Critic or Art Director) | Record Writer `AgentStep`, emit `agent.completed`, hand-off to Critic (or Art Director if `skipCritic=true`) |
| `running` (Critic) | Scores $\ge 4$ on all criteria | `running` (Art Director) | Record Critic `AgentStep`, emit `agent.completed`, hand-off to Art Director |
| `running` (Critic) | Score $< 4$ or red line issue | `running` (Revision) | Record Critic `AgentStep`, emit `agent.handoff` with revision rationale, trigger Writer revision |
| `running` (Revision) | Revision complete | `running` (Art Director) | Record Revision `AgentStep`, emit `agent.completed`, hand-off to Art Director |
| `running` (Art Director) | Prompts created | `completed` | Save final posts, emit `run.completed`, update `runs` record |
| Any `running` | User requests cancel | `cancelled` | Abort pending model calls, emit `run.cancelled`, mark run cancelled |
| Any `running` | Elapsed time $> 180s$ | `timed_out` | Terminate job, emit `agent.error`, mark run timed out |
| Any `running` | Unrecoverable error / invalid key | `failed` | Record error message, emit `agent.error`, mark run failed |

---

## 3. Zod Schemas for Structured Agent Output

```typescript
import { z } from 'zod';

export const WriterPostItemSchema = z.object({
  platform: z.enum(['linkedin', 'instagram', 'reddit', 'x', 'facebook']),
  language: z.string().default('en'),
  text: z.string().min(10),
  hashtags: z.array(z.string()).default([]),
});

export const WriterOutputSchema = z.object({
  posts: z.array(WriterPostItemSchema).min(1),
});

export const CriticIssueSchema = z.object({
  exactPhrase: z.string(),
  problem: z.string(),
  suggestedFix: z.string(),
});

export const CriticScoresSchema = z.object({
  voiceMatch: z.number().int().min(1).max(5),
  principleCompliance: z.number().int().min(1).max(5),
  audienceFit: z.number().int().min(1).max(5),
  platformFit: z.number().int().min(1).max(5),
  specificity: z.number().int().min(1).max(5),
  factualSafety: z.number().int().min(1).max(5),
});

export const CriticEvaluationItemSchema = z.object({
  platform: z.enum(['linkedin', 'instagram', 'reddit', 'x', 'facebook']),
  verdict: z.enum(['pass', 'revise']),
  scores: CriticScoresSchema,
  issues: z.array(CriticIssueSchema).max(3).default([]),
  statusText: z.string().max(100),
});

export const CriticOutputSchema = z.object({
  results: z.array(CriticEvaluationItemSchema).min(1),
});

export const ArtDirectorImageItemSchema = z.object({
  platform: z.enum(['linkedin', 'instagram', 'reddit', 'x', 'facebook']),
  prompt: z.string().min(20),
  aspectRatio: z.enum(['1:1', '16:9', '4:5', '9:16']).default('1:1'),
  altText: z.string().min(10).max(250),
});

export const ArtDirectorOutputSchema = z.object({
  images: z.array(ArtDirectorImageItemSchema).min(1),
});
```
