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

E2E tests live in `tests/` (currently empty). The dev server starts automatically on `localhost:5050`.

Auth bypass for tests: middleware skips session checks when the `x-playwright-test: true` header is present (non-production only). This is set automatically via `playwright.config.ts` `extraHTTPHeaders`.

```ts
// tests/example.spec.ts
import { test, expect } from "@playwright/test";

test("user can sign in and reach dashboard", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill("user@example.com");
  await page.getByLabel(/password/i).fill("password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/[\w-]+/); // org slug route
});
```

---

## Coverage Map

| Area | Unit | E2E |
|------|------|-----|
| Auth forms (sign-in, sign-up, forgot/reset password) | ✅ | ❌ |
| Middleware routing | ✅ | ❌ |
| tRPC routers | ❌ | ❌ |
| Onboarding flow | ❌ | ❌ |
| Org / project creation | ❌ | ❌ |
| Invitation accept flow | ❌ | ❌ |
| Gantt sync | ❌ | ❌ |
| Document upload | ❌ | ❌ |
| Permissions enforcement | ❌ | ❌ |

**Priority gaps:** E2E for the invite→join flow, org creation, and Gantt sync are the highest-value additions given zero current coverage of those paths.
