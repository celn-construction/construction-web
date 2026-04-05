import type { Page } from "@playwright/test";

/**
 * Signs in a test user via the Better Auth API endpoint.
 * This creates a real session with properly signed cookies.
 *
 * After calling this, the page's browser context will have the
 * session cookie set, so subsequent navigations will be authenticated.
 */
export async function signInTestUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Call Better Auth's sign-in endpoint directly via page.request.
  // Must include Origin header — page.request.post() doesn't send it
  // automatically, and Better Auth rejects POST requests without Origin
  // when cookies are present (CSRF protection).
  const origin = process.env.BASE_URL ?? "http://localhost:3000";
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password },
    headers: {
      Origin: origin,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Failed to sign in test user ${email}: ${response.status()} ${body}`);
  }
}
