import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isLocalhost = request.nextUrl.hostname === "localhost";
  const cookieName = isLocalhost
    ? "better-auth.session_token"
    : "__Secure-better-auth.session_token";
  const sessionCookie = request.cookies.get(cookieName);
  const onboardingComplete = request.cookies.get("onboarding-complete");
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

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/projects", request.url));
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
    // If onboarding is complete, redirect to dashboard
    if (onboardingComplete) {
      return NextResponse.redirect(new URL("/projects", request.url));
    }
    return NextResponse.next();
  }

  // Enforce onboarding for all other protected routes
  if (!onboardingComplete) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
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
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
