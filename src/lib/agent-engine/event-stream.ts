import { redisConnection } from '@/lib/queue/client';
import { logger } from '@/lib/logger';
import type { AgentEngineEvent } from './events';

export const RUN_EVENTS_TTL_SECONDS = 86400; // 24-hour retention for history and reload recovery

export function getRunStreamKey(runId: string): string {
  return `saouti:run:${runId}:events`;
}

export function getRunCancelKey(runId: string): string {
  return `saouti:run:${runId}:cancel`;
}

/**
 * Publishes an event to the Redis Stream for a run.
 */
export async function publishRunEvent(
  runId: string,
  event: AgentEngineEvent,
): Promise<string | undefined> {
  const streamKey = getRunStreamKey(runId);
  try {
    const eventId = await redisConnection.xadd(
      streamKey,
      '*',
      'payload',
      JSON.stringify(event),
    );
    // Ensure stream expires after retention window
    await redisConnection.expire(streamKey, RUN_EVENTS_TTL_SECONDS);
    return eventId ?? undefined;
  } catch (error) {
    logger.warn({ error, runId, eventName: event.event }, 'Failed to publish event to Redis stream');
    return undefined;
  }
}

/**
 * Reads events from the run's Redis stream, optionally resuming after lastEventId.
 */
export async function readRunEvents(
  runId: string,
  lastEventId?: string,
): Promise<Array<{ id: string; event: AgentEngineEvent }>> {
  const streamKey = getRunStreamKey(runId);
  try {
    const startId = lastEventId && lastEventId !== '0' ? `(${lastEventId}` : '-';
    // XRANGE key start end
    const rawEvents = await redisConnection.xrange(streamKey, startId, '+');

    const results: Array<{ id: string; event: AgentEngineEvent }> = [];
    for (const [id, fields] of rawEvents) {
      // fields is ['payload', '{...}']
      const payloadIndex = fields.indexOf('payload');
      if (payloadIndex !== -1 && fields[payloadIndex + 1]) {
        try {
          const parsed = JSON.parse(fields[payloadIndex + 1] as string) as AgentEngineEvent;
          results.push({ id, event: parsed });
        } catch {
          // ignore malformed payloads
        }
      }
    }
    return results;
  } catch (error) {
    logger.warn({ error, runId, lastEventId }, 'Failed to read events from Redis stream');
    return [];
  }
}

/**
 * Sets an abort cancellation flag in Redis for the active run.
 */
export async function signalRunCancellation(runId: string): Promise<void> {
  const cancelKey = getRunCancelKey(runId);
  await redisConnection.set(cancelKey, '1', 'EX', 3600);
}

/**
 * Checks whether a cancellation signal has been set for this run.
 */
export async function isRunCancelled(runId: string): Promise<boolean> {
  const cancelKey = getRunCancelKey(runId);
  try {
    const val = await redisConnection.get(cancelKey);
    return val === '1';
  } catch {
    return false;
  }
}
