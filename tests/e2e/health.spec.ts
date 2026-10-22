import { test, expect } from '@playwright/test';

test.describe('Health API Endpoint (/health)', () => {
  test('returns 200 OK with healthy service statuses when dependencies are active', async ({ request }) => {
    const response = await request.get('/health', {
      headers: {
        Authorization: 'Bearer test-secret-token-to-verify-redaction',
        'X-Api-Key': 'key-secret-1234',
      },
    });
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
    const requestId = headers['x-request-id'];
    expect(requestId).toBeDefined();
    expect(headers['x-response-time']).toBeDefined();

    // Verify response body does not echo sensitive headers or tokens
    const rawBody = JSON.stringify(body);
    expect(rawBody).not.toContain('test-secret-token-to-verify-redaction');
    expect(rawBody).not.toContain('key-secret-1234');
  });
});
