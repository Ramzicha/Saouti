import { test, expect } from '@playwright/test';

test.describe('Health API Endpoint (/health)', () => {
  test('returns 200 OK with healthy service statuses when dependencies are active', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.version).toBeDefined();
    expect(body.timestamp).toBeDefined();

    expect(body.services).toBeDefined();
    expect(body.services.database.status).toBe('ok');
    expect(body.services.queue.status).toBe('ok');
    expect(body.services.worker.status).toBe('ok');

    const headers = response.headers();
    expect(headers['x-response-time'] || headers['x-request-id']).toBeDefined();
  });
});
