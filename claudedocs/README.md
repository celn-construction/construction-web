# Claude Docs Index

Developer documentation for the construction SaaS codebase. Core docs are @imported into `CLAUDE.md` and load automatically each session.

---

## Core Docs (auto-loaded via CLAUDE.md)

| File | Covers |
|------|--------|
| `codebase-overview.md` | Directory structure, tech stack, key patterns |
| `environment-setup.md` | Env vars, local dev setup, npm scripts, Vercel deployment |
| `auth-and-permissions.md` | Better Auth config, RBAC roles/permissions, middleware routing |
| `data-flows.md` | Signup, invite, project creation, Gantt sync, document upload |
| `architecture-and-typescript.md` | Architecture standards, anti-patterns, TS/Next.js/tRPC/Prisma/Zod rules |
| `testing-guide.md` | Vitest + RTL patterns, Playwright setup, mocking conventions, coverage map |
| `components-guide.md` | Component directory structure, naming, styling, data fetching, UI primitives |

---

## Reference Docs (read on demand)

| File | Covers |
|------|--------|
| `review/systematic-code-review.md` | Code review playbook, severity levels, review order |

---

## Conventions

- Add new core docs to the CLAUDE.md `@import` list and to this index.
- Update docs in the same task as the code change that affects them (see Documentation Update Rules in CLAUDE.md).
- Update `testing-guide.md` coverage map when new tests are added.
