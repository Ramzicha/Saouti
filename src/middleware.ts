import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  // Forward request with x-request-id header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const durationMs = Date.now() - startTime;
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-response-time', `${durationMs}ms`);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
