# Codebase Overview

This is a full-stack SaaS application for construction project management built on the T3 Stack. It provides Gantt chart scheduling, team collaboration, document management, and multi-organization support.

- **Deployment**: Vercel (`construction-web`)
- **Database**: Neon PostgreSQL
- **Production URL**: https://construction-web-ashen.vercel.app

---

## Top-Level Directory Structure

```
cebu-v1/
├── claudedocs/        # Developer notes, research, and implementation logs
├── prisma/            # Database schema and migrations
├── public/            # Static assets (images, icons, Bryntum themes)
├── src/               # Application source code
├── generated/         # Auto-generated Prisma client
├── .github/           # GitHub CI/CD workflows
├── CLAUDE.md          # Project notes for AI assistants
├── components.json    # Shadcn/ui configuration
├── next.config.js     # Next.js configuration
├── package.json       # Dependencies and scripts
├── playwright.config.ts # E2E test configuration
├── tsconfig.json      # TypeScript configuration
├── vercel.json        # Vercel deployment configuration
└── vitest.config.ts   # Unit test configuration
```

---

## Source Code (`src/`)

### `src/app/` — Next.js App Router

Pages and API routes organized by route groups:

| Directory | Purpose |
|-----------|---------|
| `(app)/` | Main authenticated application shell |
| `(app)/dashboard/` | Dashboard page |
| `(app)/[orgSlug]/` | Organization-scoped routes |
| `(app)/[orgSlug]/projects/[projectSlug]/` | Project-level pages (Gantt, Files) |
| `(auth)/` | Sign-in, sign-up, forgot/reset password pages |
| `(onboarding)/` | New user onboarding wizard |
| `api/auth/` | Better Auth handler |
| `api/trpc/` | tRPC endpoint |
| `api/gantt/` | Gantt load/sync REST endpoints |
| `api/upload/` | File upload handler |
| `invite/[token]/` | Invitation acceptance page |

### `src/components/` — React Components

| Directory | Purpose |
|-----------|---------|
| `bryntum/` | Gantt chart wrapper, config, hooks, and popover components |
| `dashboard/` | Dashboard stats, project list, team activity |
| `documents/` | File list, drag-and-drop upload, upload dialog |
| `layout/` | Header, Sidebar, mobile nav, org switcher, user menu |
| `onboarding/` | Multi-step onboarding wizard and its steps |
| `projects/` | Project tree, project detail panel, add project dialog |
| `providers/` | React context providers (Org, Project, Theme, Loading) |
| `team/` | Invite dialog, members list, pending invites, role selector |
| `ui/` | Base UI components (Shadcn/ui + custom: buttons, dropdowns, spinners, images) |

### `src/server/` — Backend Logic

| Directory | Purpose |
|-----------|---------|
| `api/trpc.ts` | tRPC initialization and context |
| `api/root.ts` | Root router combining all sub-routers |
| `api/routers/` | Feature routers: `organization`, `project`, `user`, `member`, `invitation`, `document`, `notification`, `gantt`, `onboarding` |
| `api/helpers/` | Shared server utilities (active org/project resolution, Gantt sync/tree helpers, slug generation) |
| `db.ts` | Prisma database client singleton |
| `gantt/` | Gantt task template defaults |

### `src/lib/` — Utilities and Configuration

| File/Directory | Purpose |
|----------------|---------|
| `auth.ts` | Better Auth server configuration |
| `auth-client.ts` | Better Auth browser client |
| `email.ts` | Email templates and Resend integration |
| `permissions.ts` | Role-based access control logic |
| `constants/` | App-wide constants (invitation types, etc.) |
| `utils/` | Gantt utilities, base URL helper, slug generation |
| `validations/` | Zod schemas for forms and API inputs |

### `src/trpc/` — tRPC Client

| File | Purpose |
|------|---------|
| `react.tsx` | tRPC React hooks and provider |
| `server.ts` | Server-side tRPC caller |
| `query-client.ts` | React Query client configuration |

### Other `src/` Directories

| Directory | Purpose |
|-----------|---------|
| `hooks/` | Custom React hooks (`useSnackbar`) |
| `store/` | Zustand stores (`useThemeStore`) |
| `styles/` | Global CSS with CSS custom properties for theming |
| `theme/` | MUI theme configuration |
| `middleware.ts` | Route protection and auth middleware |
| `__tests__/` | Unit and integration tests mirroring `src/` structure |

---

## Database (`prisma/`)

### Schema file: `prisma/schema.prisma`

**Auth tables** (managed by Better Auth):
- `User` — User accounts with active org/project tracking
- `Session` — Active sessions
- `Account` — OAuth provider accounts
- `Verification` — Email verification tokens

**Application tables:**
- `Organization` — Company/org profiles
- `Project` — Projects belonging to an organization
- `Document` — Files uploaded to projects
- `Membership` — User ↔ organization relationship with roles
- `Invitation` — Pending team invitations
- `Notification` — User notifications

**Gantt tables:**
- `GanttTask` — Tasks with hierarchy, scheduling, and dependency data
- `GanttDependency` — Task-to-task dependencies
- `GanttResource` — People and resources
- `GanttAssignment` — Task ↔ resource assignments
- `GanttTimeRange` — Calendar and time range definitions

Migrations live in `prisma/migrations/` and run automatically on Vercel builds.

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| API Layer | tRPC 11 + React Query 5 |
| Auth | Better Auth 1.4 |
| Database ORM | Prisma 6 + Neon PostgreSQL |
| UI Components | MUI 7, Shadcn/ui, Tailwind CSS |
| Gantt Chart | Bryntum Gantt 7 |
| State Management | Jotai (local), Zustand (theme) |
| Forms | React Hook Form + Zod |
| Drag & Drop | dnd-kit |
| File Storage | Vercel Blob |
| Email | Resend |
| Animation | Framer Motion |
| Unit Tests | Vitest + Testing Library |
| E2E Tests | Playwright |

---

## Key Patterns

- **Path alias**: `@/*` maps to `src/*`
- **Auth protection**: `src/middleware.ts` guards all `(app)` routes
- **Data fetching**: tRPC procedures called via React Query hooks in client components; server-side via `api/trpc/server.ts`
- **Organization/Project context**: `OrgProvider` and `ProjectProvider` supply active org/project to the component tree; server helpers resolve them from cookies
- **Gantt sync**: Bryntum sends changes to `api/gantt/sync` → `ganttSync.ts` applies them to the database; `api/gantt/load` fetches the full dataset
- **Permissions**: `src/lib/permissions.ts` defines role checks used in both server routers and UI components
