# Code Review Playbook

Process for reviewing the codebase directory-by-directory before new feature work or after significant changes.

**Get current baseline before starting:**
```bash
npm run typecheck   # see current TS errors
npm test            # see current test failures
```

---

## Review Rules (Every Directory)

1. Map public surface area — exports, routes, API contracts
2. Check correctness:
   - Happy path, error path, empty/loading states
3. Check security and data boundaries:
   - Auth/authz checks present
   - Server/client separation respected
   - Validation at all entry points
4. Check maintainability:
   - Duplication, dead code, unclear abstractions
5. Check tests:
   - Critical behavior covered
   - No brittle selectors or implementation coupling
6. Run verification:
   - `npm run typecheck` and `npm test` after any fixes
7. Log findings and leave the directory only when exit criteria pass

---

## Severity

| Level | Meaning |
|-------|---------|
| `P0` | Data loss, auth bypass, production outage risk |
| `P1` | Broken core behavior, severe regression risk |
| `P2` | Functional bugs with workaround, major test gaps |
| `P3` | Clarity/refactor/doc debt without immediate user impact |

---

## Exit Criteria Per Directory

- No open P0/P1 findings
- Tests for changed behavior exist and pass
- No new typecheck or test failures introduced
- Findings recorded with file/line references and status

---

## Review Order

| # | Scope | Notes |
|---|-------|-------|
| 1 | `prisma/` | Schema, migrations, indexes |
| 2 | `src/env.js`, `src/lib/validations/` | Validation schemas, env safety |
| 3 | `src/lib/` | Auth, permissions, email, utils |
| 4 | `src/middleware.ts` | Route protection logic |
| 5 | `src/server/`, `src/trpc/`, `src/app/api/` | All backend logic |
| 6 | `src/store/`, `src/hooks/` | Client state |
| 7 | `src/theme/`, `src/styles/`, `src/components/providers/`, `src/components/ui/` | Design system base |
| 8 | `src/app/layout.tsx`, `src/app/loading.tsx`, `src/app/page.tsx` | Root shell |
| 9 | Auth slice: `src/app/(auth)/`, `src/app/invite/[token]/`, `src/__tests__/auth/` | Auth forms + tests |
| 10 | Onboarding slice: `src/app/(onboarding)/`, `src/components/onboarding/` | Onboarding wizard |
| 11 | Dashboard: `src/app/(app)/dashboard/`, `src/components/dashboard/` | |
| 12 | Projects/documents/team: pages + components | Feature slice |
| 13 | Gantt slice: `src/app/(app)/[orgSlug]/projects/[projectSlug]/gantt/`, `src/components/bryntum/` | |
| 14 | Test infra: `src/__tests__/`, `vitest.config.ts`, `playwright.config.ts`, `tests/` | |
| 15 | Static/configs: `public/`, `next.config.js`, `vercel.json` | |

---

## Finding Log Template

```md
### Directory Review: <scope>
- Date:
- Reviewer:
- Files reviewed:

#### Findings
1. [P?] <title> — <file:line>
   - Impact:
   - Evidence:
   - Fix:

#### Verification
- Commands run:
- Result:

#### Decision
- Status: PASS | PASS WITH DEBT | BLOCKED
- Follow-ups:
```
