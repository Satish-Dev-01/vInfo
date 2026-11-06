import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that unauthenticated users are allowed to access.
 */
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function getRequestAuthToken(request: NextRequest): string | null {
  const authToken = request.cookies.get('auth_token')?.value;
  const accessToken = request.cookies.get('accessToken')?.value;
  const genericAccessToken = request.cookies.get('access_token')?.value;
  const token = request.cookies.get('token')?.value;

  const candidate = authToken || accessToken || genericAccessToken || token;
  if (!candidate || candidate === 'null' || candidate === 'undefined' || candidate.trim() === '') {
    return null;
  }
  return candidate.trim();
}

/**
 * Next.js 16 Proxy
 * Intercepts requests on the server before routes are rendered to enforce authentication.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getRequestAuthToken(request);
  const isAuthenticated = Boolean(token);

  // Allow public authentication routes
  if (isPublicPath(pathname)) {
    // If user is already authenticated and visits /login or /signup,
    // redirect them to their active onboarding step or dashboard
    if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
      const nextStep = request.cookies.get('next_step')?.value;
      if (nextStep === 'VERIFY_EMAIL') {
        return NextResponse.next();
      }
      if (nextStep === 'ORG_BILLING_DETAILS') {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
      if (nextStep === 'DEPARTMENTS_AND_LEVELS') {
        return NextResponse.redirect(new URL('/onboarding/departments', request.url));
      }
      if (nextStep === 'USER_DETAILS') {
        return NextResponse.redirect(new URL('/onboarding/user-details', request.url));
      }
      if (nextStep === 'INVITE_TEAM') {
        return NextResponse.redirect(new URL('/onboarding/invite', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Root '/' is handled by src/app/page.tsx
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Protected Routes: If unauthenticated, redirect to login with return target
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Strict sequential onboarding: users cannot go back to Step 1 or access completed onboarding
  if (pathname.startsWith('/onboarding')) {
    const nextStep = request.cookies.get('next_step')?.value;

    if (nextStep === 'DASHBOARD' || nextStep === 'COMPLETED') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Step 1 (Organisation & billing) cannot be revisited once advanced
    if (pathname === '/onboarding') {
      if (nextStep === 'DEPARTMENTS_AND_LEVELS') {
        return NextResponse.redirect(new URL('/onboarding/departments', request.url));
      }
      if (nextStep === 'USER_DETAILS') {
        return NextResponse.redirect(new URL('/onboarding/user-details', request.url));
      }
      if (nextStep === 'INVITE_TEAM') {
        return NextResponse.redirect(new URL('/onboarding/invite', request.url));
      }
    }

    const isStep1Done =
      request.cookies.get('onboarding_step_1_completed')?.value === 'true' ||
      nextStep === 'DEPARTMENTS_AND_LEVELS' ||
      nextStep === 'USER_DETAILS' ||
      nextStep === 'INVITE_TEAM' ||
      nextStep === 'DASHBOARD' ||
      nextStep === 'COMPLETED';

    // Step 2 & 3 cannot be skipped ahead if Step 1 not completed
    if (nextStep === 'ORG_BILLING_DETAILS' && pathname !== '/onboarding' && !isStep1Done) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    const isStep2Done = request.cookies.get('onboarding_step_2_completed')?.value === 'true';
    if (nextStep === 'DEPARTMENTS_AND_LEVELS' && pathname === '/onboarding/invite' && !isStep2Done) {
      return NextResponse.redirect(new URL('/onboarding/departments', request.url));
    }

    // Unauthenticated step skips: cannot skip ahead to departments if Step 1 not started
    if (!nextStep && pathname !== '/onboarding' && !isStep1Done) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API route handlers have separate authentication checks)
     * - _next/static (static client bundles)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, and public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
