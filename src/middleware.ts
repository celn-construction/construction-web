import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isLocalhost = request.nextUrl.hostname === "localhost";
  const cookieName = isLocalhost
    ? "better-auth.session_token"
    : "__Secure-better-auth.session_token";
  const sessionCookie = request.cookies.get(cookieName);
  const onboardingComplete = request.cookies.get("onboarding-complete");
  const activeOrgSlugCookie = request.cookies.get("active-org-slug");
  // Only use the slug if it's a valid org slug (word chars + hyphens, no dots or slashes)
  const activeOrgSlug = activeOrgSlugCookie?.value && /^[a-z0-9-]+$/.test(activeOrgSlugCookie.value)
    ? activeOrgSlugCookie.value
    : null;
  const activeProjectSlugCookie = request.cookies.get("active-project-slug");
  const activeProjectSlug = activeProjectSlugCookie?.value && /^[a-z0-9-]+$/.test(activeProjectSlugCookie.value)
    ? activeProjectSlugCookie.value
    : null;
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
  const isApiRoute = pathname.startsWith("/api");
  const isLandingPage = pathname === "/";
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isInvitePage = pathname.startsWith("/invite");

  // Bypass auth for E2E tests (only in development/test environments)
  const isTestBypass = request.headers.get("x-playwright-test") === "true";
  if (isTestBypass && process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  // Allow API routes without authentication check
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Allow landing page for all users (authenticated and unauthenticated)
  if (isLandingPage) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from auth pages to their org or onboarding
  if (isAuthPage && sessionCookie) {
    if (onboardingComplete && activeOrgSlug) {
      return NextResponse.redirect(new URL(`/${activeOrgSlug}`, request.url));
    }
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Allow unauthenticated users to access auth pages
  if (isAuthPage) {
    return NextResponse.next();
  }

  // Redirect to sign-in if no session cookie for protected routes
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in?callbackUrl=" + pathname, request.url));
  }

  // Allow invite pages for authenticated users
  if (isInvitePage) {
    return NextResponse.next();
  }

  // Allow onboarding page if not complete
  if (isOnboardingPage) {
    // If onboarding is complete, redirect to org home
    if (onboardingComplete && activeOrgSlug) {
      return NextResponse.redirect(new URL(`/${activeOrgSlug}`, request.url));
    }
    return NextResponse.next();
  }

  // Enforce onboarding for all other protected routes
  if (!onboardingComplete) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // Fast-path: /dashboard with warm cookies skips the server component entirely
  if (pathname === "/dashboard") {
    if (activeOrgSlug && activeProjectSlug) {
      return NextResponse.redirect(
        new URL(`/${activeOrgSlug}/projects/${activeProjectSlug}/gantt`, request.url)
      );
    }
    return NextResponse.next();
  }

  // Update active-org-slug cookie from URL for any org-scoped route
  const staticPrefixes = ['api', 'sign-in', 'sign-up', 'forgot-password', 'reset-password', 'onboarding', 'invite', 'dashboard', '_next'];
  const segments = pathname.split('/');
  const firstSegment = segments[1];
  if (firstSegment && !staticPrefixes.includes(firstSegment) && /^[a-z0-9-]+$/.test(firstSegment)) {
    const response = NextResponse.next();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 365,
    };
    response.cookies.set("active-org-slug", firstSegment, cookieOptions);
    // Track active project slug from project-scoped routes: /{orgSlug}/projects/{projectSlug}/...
    if (segments[2] === 'projects' && segments[3] && /^[a-z0-9-]+$/.test(segments[3])) {
      response.cookies.set("active-project-slug", segments[3], cookieOptions);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images folder (public images)
     */
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|images).*)",
  ],
};
