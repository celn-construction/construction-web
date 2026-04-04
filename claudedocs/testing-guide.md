# Testing Guide

## Stack

| Layer | Tool | Location |
|-------|------|----------|
| Unit / component | Vitest + React Testing Library | `src/**/*.test.{ts,tsx}` |
| E2E | Playwright (Chromium) | `tests/` *(currently empty)* |
| Type checking | `tsc --noEmit` | — |

---

## Running Tests

```bash
npm test               # unit tests, run once (CI mode)
npm run test:watch     # unit tests, watch mode
npm run typecheck      # TypeScript only

npx playwright test                    # E2E (requires dev server)
npx playwright test --ui               # E2E with interactive UI
npx playwright show-report             # view last HTML report
```

---

## Unit Test Setup

Global mocks live in `src/__tests__/setup.ts` and apply to every test automatically:

| Mock | What it does |
|------|-------------|
| `next/navigation` | `useRouter`, `usePathname`, `useSearchParams`, `redirect` — all `vi.fn()` |
| `next/image` | Replaced with `<img>` |
| `next/link` | Replaced with `<a>` |
| `@/components/ui/Logo` | Replaced with SVG stub |

DOM is cleaned up after every test via `afterEach(cleanup)`. Mocks are reset between tests (`mockReset: true` in vitest config).

---

## Writing Unit Tests

### Middleware tests

Middleware runs in Node, not jsdom — add the directive at the top:

```ts
// @vitest-environment node
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

const req = (pathname: string, cookies: Record<string, string> = {}) => {
  const r = new NextRequest(`http://localhost:5050${pathname}`);
  Object.entries(cookies).forEach(([k, v]) => r.cookies.set(k, v));
  return r;
};

it("redirects unauthenticated users", () => {
  const res = middleware(req("/dashboard"));
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toContain("/sign-in");
});
```

### Component / page tests

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

// 1. Mock dependencies at the top of the file
vi.mock("@/lib/auth-client", () => ({
  signIn: { email: vi.fn() },
}));

// 2. Grab the mock for assertions
import { signIn } from "@/lib/auth-client";
const mockSignIn = signIn.email as ReturnType<typeof vi.fn>;

// 3. Override router per-test when needed
import { useRouter } from "next/navigation";
const mockPush = vi.fn();
(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });

it("redirects to /onboarding on successful sign-in", async () => {
  mockSignIn.mockImplementation(async ({ fetchOptions }) => {
    fetchOptions?.onSuccess?.();
  });

  const user = userEvent.setup();
  render(<SignInPage />);

  await user.type(screen.getByLabelText(/email/i), "test@example.com");
  await user.type(screen.getByLabelText(/password/i), "password123");
  await user.click(screen.getByRole("button", { name: /sign in/i }));

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith("/onboarding");
  });
});
```

### Mocking `fetch` (for direct API routes)

```ts
beforeEach(() => {
  globalThis.fetch = vi.fn();
});

(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
});
```

### Query selectors — accessibility first

```ts
// Prefer (in order):
screen.getByRole("button", { name: /submit/i })
screen.getByLabelText(/email address/i)
screen.getByText(/check your email/i)

// Avoid:
screen.getByTestId("submit-btn")   // fragile, not meaningful to users
```

---

## E2E Tests (Playwright)

E2E tests live in `tests/`. The dev server must be running on `localhost:3000` (or set `BASE_URL` env var). Playwright config will auto-start it if not running.

Auth bypass for tests: middleware skips session checks when the `x-playwright-test: true` header is present (non-production only). This is set automatically via `playwright.config.ts` `extraHTTPHeaders`.

### Directory structure

```
tests/
  fixtures/
    db.ts              # Standalone Prisma client for test DB
    otp.ts             # OTP code reader from verification table
    test-user.ts       # User seeding (createTestUser, createVerifiedUser, createUserWithOrg) and cleanup
    auth.ts            # signInTestUser() — signs in via Better Auth API
  helpers/
    otp-input.ts       # MUI OTP input filler (fills 6 individual <input> elements)
  smoke/
    full-journey.spec.ts   # Golden path: sign-up → OTP → onboarding → dashboard
  auth/
    sign-up.spec.ts
    sign-in.spec.ts
    forgot-password.spec.ts
    verify-email.spec.ts
  onboarding/
    wizard.spec.ts
```

### Key patterns

**Test user isolation**: Each test generates unique emails (`test-{uuid}@e2e.local`). Cleanup in `afterAll` deletes users and cascaded records.

**OTP codes**: Read directly from the `verification` table (identifier: `email-verification-otp-{email}`, value format: `{otp}:{attemptCount}`). The `getOtpForEmail()` helper polls with retries.

**Authenticated tests**: Use `signInTestUser(page, email, password)` to sign in via the Better Auth API endpoint. This creates a real signed session cookie. Do NOT inject raw session tokens — Better Auth signs cookies and will reject unsigned values.

**Password reset tokens**: Read from `verification` table (identifier: `password-reset:{userId}`).

```ts
// Example: test requiring authenticated user
import { createVerifiedUser, cleanupUser } from "../fixtures/test-user";
import { signInTestUser } from "../fixtures/auth";

test("authenticated user can access onboarding", async ({ page }) => {
  const user = await createVerifiedUser({ onboardingComplete: false });
  await signInTestUser(page, user.email, user.password);
  await page.goto("/onboarding");
  await expect(page.getByText("Welcome to BuildTrack Pro")).toBeVisible();
  // cleanup in afterAll
});
```

### Running E2E tests

```bash
npx playwright test                    # all E2E tests
npx playwright test tests/smoke/      # smoke tests only
npx playwright test --ui               # interactive UI mode
npx playwright show-report             # view last HTML report
```

---

## Coverage Map

| Area | Unit | E2E |
|------|------|-----|
| Auth forms (sign-in, sign-up, forgot/reset password) | ✅ | ✅ |
| Middleware routing | ✅ | ✅ (via auth flow tests) |
| Email verification (OTP) | ❌ | ✅ |
| Onboarding flow | ❌ | ✅ |
| Password reset (full flow) | ❌ | ✅ |
| tRPC routers | ❌ | ❌ |
| Org / project creation | ❌ | ✅ (via onboarding) |
| Invitation accept flow | ❌ | ❌ |
| Gantt sync | ❌ | ❌ |
| Document upload | ❌ | ❌ |
| Permissions enforcement | ❌ | ❌ |

**Priority gaps:** E2E for the invite→join flow, Gantt sync, and document upload are the highest-value additions.
