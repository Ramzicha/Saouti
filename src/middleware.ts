import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createIntlMiddleware(routing);

// Public routes that unauthenticated users can access
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/landing',
];

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  request.headers.set('x-request-id', requestId);

  const pathname = request.nextUrl.pathname;

  // Direct access for static html files
  if (pathname.endsWith('.html')) {
    return NextResponse.next();
  }

  // Strip locale prefix to test route pattern (e.g. /en/login -> /login)
  const pathnameWithoutLocale = pathname.replace(/^\/(?:en|fr|ar)/, '') || '/';
  const isPublicRoute = PUBLIC_PATHS.some((path) =>
    pathnameWithoutLocale.startsWith(path),
  );

  // Check session cookie
  const sessionToken = request.cookies.get('saouti-session')?.value;

  // Protect private routes
  if (!isPublicRoute && !sessionToken && pathnameWithoutLocale !== '/') {
    // Determine target locale from URL or fallback
    const match = pathname.match(/^\/(en|fr|ar)/);
    const locale = match ? match[1] : 'en';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Apply next-intl locale resolution and routing
  const response = handleI18nRouting(request);

  const durationMs = Date.now() - startTime;
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-response-time', `${durationMs}ms`);

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|html)$).*)',
  ],
};
