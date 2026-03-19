// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "@/middleware";

describe("Middleware", () => {
  const SESSION_COOKIE = "better-auth.session_token";

  const createRequest = (
    pathname: string,
    cookies: Record<string, string> = {},
    headers: Record<string, string> = {}
  ) => {
    const url = `http://localhost:5050${pathname}`;
    const request = new NextRequest(url);

    Object.entries(cookies).forEach(([name, value]) => {
      request.cookies.set(name, value);
    });

    Object.entries(headers).forEach(([name, value]) => {
      (request.headers as any).set(name, value);
    });

    return request;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Early exits (no auth needed) ---

  it("allows API routes without auth", () => {
    const response = middleware(createRequest("/api/auth/session"));
    expect((response as NextResponse).status).not.toBe(307);
  });

  it("allows landing page for all users", () => {
    const response = middleware(createRequest("/"));
    expect((response as NextResponse).status).not.toBe(307);
  });

  it("allows invite pages without auth", () => {
    const response = middleware(createRequest("/invite/test-token"));
    expect((response as NextResponse).status).not.toBe(307);
  });

  it("bypasses auth with x-playwright-test header in non-production", () => {
    vi.stubEnv("NODE_ENV", "test");
    const response = middleware(
      createRequest("/some-org", {}, { "x-playwright-test": "true" })
    );
    expect((response as NextResponse).status).not.toBe(307);
    vi.unstubAllEnvs();
  });

  // --- Auth pages ---

  it("allows unauthenticated users to access auth pages", () => {
    const response = middleware(createRequest("/sign-in"));
    expect((response as NextResponse).status).not.toBe(307);
  });

  it("allows authenticated users through auth pages (page handles redirect)", () => {
    const response = middleware(
      createRequest("/sign-in", { [SESSION_COOKIE]: "valid-token" })
    );
    expect((response as NextResponse).status).not.toBe(307);
  });

  // --- Flow pages (verify-email, onboarding) ---

  it("allows /verify-email without session", () => {
    const response = middleware(createRequest("/verify-email"));
    expect((response as NextResponse).status).not.toBe(307);
  });

  it("allows /onboarding without session", () => {
    const response = middleware(createRequest("/onboarding"));
    expect((response as NextResponse).status).not.toBe(307);
  });

  // --- Protected routes ---

  it("redirects unauthenticated users to /sign-in with callbackUrl", () => {
    const response = middleware(createRequest("/acme")) as NextResponse;
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:5050/sign-in?callbackUrl=/acme"
    );
  });

  it("allows authenticated users to access protected routes", () => {
    const response = middleware(
      createRequest("/acme", { [SESSION_COOKIE]: "valid-token" })
    );
    expect((response as NextResponse).status).not.toBe(307);
  });
});
