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
    index.ts           # Custom `test` with auto-cleanup fixtures and POM injection
    db.ts              # Standalone Prisma client for test DB
    otp.ts             # OTP code reader from verification table
    test-user.ts       # User seeding (createTestUser, createVerifiedUser, createUserWithOrg) and cleanup
    auth.ts            # signInTestUser() — signs in via Better Auth API
  helpers/
    otp-input.ts       # MUI OTP input filler (fills 6 individual <input> elements)
  pages/               # Page Object Models — centralized selectors and actions
    sign-up.page.ts
    sign-in.page.ts
    onboarding.page.ts
    verify-email.page.ts
    forgot-password.page.ts  # includes ResetPasswordPage
  global-teardown.ts   # Safety-net cleanup of @e2e.local users after all tests
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

**Custom fixtures (import from `../fixtures`)**: All spec files import `{ test, expect }` from `tests/fixtures/index.ts` instead of `@playwright/test`. This provides auto-cleanup user fixtures (`testUser`, `verifiedUser`, `userWithOrg`) and auto-instantiated Page Object Models (`signUpPage`, `signInPage`, `onboardingPage`, etc.). Fixture teardown is guaranteed even when tests throw.

**Page Object Models**: Selectors and common actions live in `tests/pages/*.page.ts`. Tests use POM methods instead of inline selectors — one UI change only requires one update.

**Test user isolation**: Each test generates unique emails (`test-{uuid}@e2e.local`). Fixture teardown deletes users and cascaded records. A `global-teardown.ts` safety net removes any orphaned `@e2e.local` users after the entire suite.

**OTP codes**: Read directly from the `verification` table (identifier: `email-verification-otp-{email}`, value format: `{otp}:{attemptCount}`). The `getOtpForEmail()` helper polls with retries.

**Authenticated tests**: Use `signInTestUser(page, email, password)` to sign in via the Better Auth API endpoint. This creates a real signed session cookie. Do NOT inject raw session tokens — Better Auth signs cookies and will reject unsigned values.

**Password reset tokens**: Read from `verification` table (identifier: `password-reset:{userId}`).

```ts
// Example: test with auto-cleanup fixtures and POMs
import { test, expect, signInTestUser } from "../fixtures";

test("verified user sees onboarding", async ({ verifiedUser, page, onboardingPage }) => {
  await signInTestUser(page, verifiedUser.email, verifiedUser.password);
  await onboardingPage.goto();
  await expect(onboardingPage.heading).toBeVisible();
  // cleanup is automatic via fixture teardown
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
