import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordHeartbeat, WORKER_HEARTBEAT_KEY, workerRedisConnection } from '@/lib/queue/worker';

describe('Worker Queue Helpers (worker.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('records heartbeat with ISO timestamp in Redis', async () => {
    const setSpy = vi.spyOn(workerRedisConnection, 'set').mockResolvedValue('OK' as any);

    await recordHeartbeat();

    expect(setSpy).toHaveBeenCalledWith(WORKER_HEARTBEAT_KEY, expect.any(String));
    const recordedTimestamp = setSpy.mock.calls[0][1];
    expect(new Date(recordedTimestamp).toISOString()).toBe(recordedTimestamp);
  });
});
