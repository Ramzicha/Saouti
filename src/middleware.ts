import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createIntlMiddleware(routing);

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  // Forward request with x-request-id header
  request.headers.set('x-request-id', requestId);

  // Apply next-intl locale resolution and routing
  const response = handleI18nRouting(request);

  const durationMs = Date.now() - startTime;
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-response-time', `${durationMs}ms`);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
