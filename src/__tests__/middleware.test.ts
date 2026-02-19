// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "@/middleware";

describe("Middleware", () => {
  const createRequest = (
    pathname: string,
    cookies: Record<string, string> = {},
    headers: Record<string, string> = {}
  ) => {
    const url = `http://localhost:5050${pathname}`;
    const request = new NextRequest(url);

    // Set cookies
    Object.entries(cookies).forEach(([name, value]) => {
      request.cookies.set(name, value);
    });

    // Set headers
    Object.entries(headers).forEach(([name, value]) => {
      (request.headers as any).set(name, value);
    });

    return request;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows API routes without auth", () => {
    const request = createRequest("/api/auth/session");
    const response = middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect((response as NextResponse).status).not.toBe(307); // Not a redirect
  });

  it("allows landing page for all users", () => {
    const request = createRequest("/");
    const response = middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect((response as NextResponse).status).not.toBe(307);
  });

  it("redirects authenticated users from auth pages to org home", () => {
    const request = createRequest("/sign-in", {
      "better-auth.session_token": "valid-token",
      "onboarding-complete": "true",
      "active-org-slug": "my-org",
    });
    const response = middleware(request) as NextResponse;

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:5050/my-org");
  });

  it("allows unauthenticated users to access auth pages", () => {
    const request = createRequest("/sign-in");
    const response = middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect((response as NextResponse).status).not.toBe(307);
  });

  it("redirects unauthenticated users to /sign-in with callbackUrl", () => {
    const request = createRequest("/acme");
    const response = middleware(request) as NextResponse;

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:5050/sign-in?callbackUrl=/acme"
    );
  });

  it("allows invite pages for authenticated users", () => {
    const request = createRequest("/invite/test-token", {
      "better-auth.session_token": "valid-token",
      "onboarding-complete": "true",
    });
    const response = middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect((response as NextResponse).status).not.toBe(307);
  });

  it("redirects to org home if onboarding complete and visiting /onboarding", () => {
    const request = createRequest("/onboarding", {
      "better-auth.session_token": "valid-token",
      "onboarding-complete": "true",
      "active-org-slug": "my-org",
    });
    const response = middleware(request) as NextResponse;

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:5050/my-org");
  });

  it("allows /onboarding if not complete", () => {
    const request = createRequest("/onboarding", {
      "better-auth.session_token": "valid-token",
    });
    const response = middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect((response as NextResponse).status).not.toBe(307);
  });

  it("redirects to /onboarding for protected routes if not complete", () => {
    const request = createRequest("/acme", {
      "better-auth.session_token": "valid-token",
    });
    const response = middleware(request) as NextResponse;

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:5050/onboarding");
  });

  it("bypasses auth with x-playwright-test header in non-production", () => {
    vi.stubEnv("NODE_ENV", "test");

    const request = createRequest(
      "/acme",
      {},
      { "x-playwright-test": "true" }
    );
    const response = middleware(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect((response as NextResponse).status).not.toBe(307);

    vi.unstubAllEnvs();
  });
});
