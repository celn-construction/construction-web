# Systematic Code Review Playbook

This document defines how we review the codebase directory-by-directory before new feature work.

## Baseline Snapshot (2026-02-13)

- `npm run typecheck` fails with 5 errors:
  - `src/__tests__/auth/reset-password.test.tsx`: element type narrowing issues on indexed results.
  - `src/__tests__/middleware.test.ts`: `process.env.NODE_ENV` assignment flagged as readonly.
- `npm test` fails with 31 tests (auth-focused):
  - Most failures are `getByLabelText(...)` queries not matching current form markup.
  - This indicates accessibility/test contract drift in auth forms.

We should treat this as known debt and resolve during the auth/testing review slices.

## Review Rules (Every Directory)

1. Read all files in scope and map public surface area (exports, routes, API contracts).
2. Check correctness paths:
   - happy path
   - error path
   - empty/loading states
3. Check security and data boundaries:
   - auth/authz checks
   - server/client separation
   - validation at entry points
4. Check maintainability:
   - duplication
   - dead code
   - unclear abstractions
5. Check tests for the same scope:
   - coverage of critical behavior
   - brittle selectors/implementation coupling
6. Run verification commands:
   - targeted tests for scope
   - then full `npm run typecheck` and `npm test` after fixes
7. Log findings and leave the directory only when exit criteria pass.

## Severity

- `P0`: data loss, auth bypass, production outage risk
- `P1`: broken core behavior, severe regression risk
- `P2`: functional bugs with workaround, major test gaps
- `P3`: clarity/refactor/doc debt without immediate user impact

## Exit Criteria Per Directory

- No open `P0`/`P1` findings in that directory.
- Tests for changed behavior exist and pass.
- No new typecheck or test failures introduced.
- Findings recorded with file/line references and status.

## Fixed Review Order

Use this exact sequence:

1. `prisma/`
2. `src/env.js`, `src/types/`, `src/lib/validations/`
3. `src/lib/` (auth, permissions, email, utils)
4. `src/middleware.ts`
5. `src/server/`, `src/trpc/`, `src/app/api/`
6. `src/store/`, `src/hooks/`
7. `src/theme/`, `src/styles/`, `src/components/providers/`, `src/components/ui/`
8. `src/app/layout.tsx`, `src/app/loading.tsx`, `src/app/page.tsx`
9. Auth slice: `src/app/(auth)/`, `src/app/reset-password/`, `src/app/invite/[token]/`, `src/__tests__/auth/`
10. Onboarding slice: `src/app/(onboarding)/`, `src/components/onboarding/`
11. Dashboard slice: `src/app/(app)/dashboard/`, `src/components/dashboard/`
12. Projects/documents/team slice:
    - `src/app/(app)/projects/`, `src/components/projects/`
    - `src/app/(app)/documents/`, `src/components/documents/`
    - `src/app/(app)/team/`, `src/components/team/`
13. Timeline/Gantt/Bryntum slice:
    - `src/app/(app)/timeline/`, `src/app/(app)/gantt/`, `src/app/(app)/bryntum/`
    - `src/components/bryntum/`
14. Remaining test infra: `src/__tests__/`, `vitest.config.ts`, `playwright.config.ts`, `tests/`
15. Static/runtime assets and configs: `public/`, `next.config.js`, `vercel.json`, root scripts/config

## Tracking Board

| Order | Scope | Status | Owner | Notes |
|---|---|---|---|---|
| 1 | prisma | TODO | - | |
| 2 | env + types + validations | TODO | - | |
| 3 | lib | TODO | - | |
| 4 | middleware | TODO | - | |
| 5 | server + trpc + api routes | TODO | - | |
| 6 | store + hooks | TODO | - | |
| 7 | theme/styles/providers/ui | TODO | - | |
| 8 | root app shell | TODO | - | |
| 9 | auth slice + auth tests | IN PROGRESS | Codex | Baseline failures concentrated here |
| 10 | onboarding slice | TODO | - | |
| 11 | dashboard slice | TODO | - | |
| 12 | projects/documents/team slice | TODO | - | |
| 13 | timeline/gantt/bryntum slice | TODO | - | |
| 14 | test infra | TODO | - | |
| 15 | assets + root configs | TODO | - | |

## Review Log Template (Copy/Paste)

```md
### Directory Review: <scope>
- Date:
- Reviewer:
- Files reviewed:

#### Findings
1. [P?] <title> - <file:line>
   - Impact:
   - Evidence:
   - Fix:

#### Tests
- Commands:
- Result:

#### Decision
- Status: PASS | PASS WITH DEBT | BLOCKED
- Follow-ups:
```

