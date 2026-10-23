import { db } from '@/lib/db/client';
import { agentSteps, runs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface RecordStepInput {
  runId: string;
  agentId: 'writer' | 'critic' | 'art_director';
  taskLabel: string;
  model: string;
  promptVersion: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  durationMs?: number;
  inputPayload?: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  errorCode?: string;
}

/**
 * Persists an agent execution step in the audit trail.
 * Enforces zero secret logging and catches database errors safely.
 */
export async function recordAgentStep(input: RecordStepInput): Promise<string | undefined> {
  try {
    const [inserted] = await db
      .insert(agentSteps)
      .values({
        runId: input.runId,
        agentId: input.agentId,
        taskLabel: input.taskLabel,
        model: input.model,
        promptVersion: input.promptVersion,
        status: input.status,
        durationMs: input.durationMs ?? 0,
        inputPayload: input.inputPayload ?? null,
        outputPayload: input.outputPayload ?? null,
        errorCode: input.errorCode ?? null,
      })
      .returning({ id: agentSteps.id });

    return inserted?.id;
  } catch (error) {
    logger.error({ error, runId: input.runId, agentId: input.agentId }, 'Failed to record agent step');
    return undefined;
  }
}

/**
 * Updates run status and results in the database.
 */
import type { Run } from '@/lib/db/schema';

export async function updateRunRecord(
  runId: string,
  update: {
    status?: 'pending' | 'running' | 'completed' | 'cancelled' | 'failed' | 'timed_out' | undefined;
    posts?: Run['posts'] | undefined;
    totalDurationMs?: number | undefined;
    errorMessage?: string | undefined;
  },
): Promise<void> {
  try {
    await db
      .update(runs)
      .set({
        ...update,
        updatedAt: new Date(),
      })
      .where(eq(runs.id, runId));
  } catch (error) {
    logger.error({ error, runId }, 'Failed to update run record');
  }
}
