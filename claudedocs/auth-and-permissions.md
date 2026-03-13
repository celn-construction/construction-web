# Authentication & Permissions

## Auth System

- **Provider**: Better Auth 1.4 with Prisma adapter (PostgreSQL)
- **Auth method**: Email + password (min 8 chars, max 128, auto sign-in on register)
- **Base path**: `/api/auth`
- **Session**: Cookie-cached for 5 minutes (`cookieCache.maxAge = 300`)
- **Cookie names**: `better-auth.session_token` (localhost) / `__Secure-better-auth.session_token` (production)
- **Custom pages**: `/sign-in`, `/sign-up`
- **Trusted origins**: Dynamic — in development, any `localhost` origin (any port) is trusted; in production, only `APP_URL` and `VERCEL_URL`

### Client Setup

`authClient` is created via `createAuthClient` pointing at `{baseURL}/api/auth`. Exports: `signIn`, `signUp`, `signOut`, `useSession`.

## Roles & Permissions Matrix

| Role | Rank | INVITE | REMOVE | MANAGE_ROLES | MANAGE_ORG | CREATE_PROJ | DELETE_PROJ | MANAGE_PROJ | VIEW_PROJ |
|------|------|--------|--------|--------------|------------|-------------|-------------|-------------|-----------|
| owner | 4 | Y | Y | Y | Y | Y | Y | Y | Y |
| admin | 3 | Y | Y | Y | - | Y | Y | Y | Y |
| project_manager | 2 | - | - | - | - | Y | - | Y | Y |
| member | 1 | - | - | - | - | - | - | - | Y |
| viewer | 0 | - | - | - | - | - | - | - | Y |

**Role hierarchy rule**: A user can only assign roles strictly below their own rank (e.g., admin can assign project_manager, member, viewer but not admin or owner).

## Permission Utilities

**Source**: `src/lib/permissions.ts`

| Function | Purpose |
|----------|---------|
| `hasPermission(role, permission)` | Core check -- returns `true` if role includes the given `Permission` |
| `canInviteMembers(role)` | Shorthand for `hasPermission(role, "INVITE_MEMBERS")` |
| `canRemoveMembers(role)` | Shorthand for `hasPermission(role, "REMOVE_MEMBERS")` |
| `canManageRoles(role)` | Shorthand for `hasPermission(role, "MANAGE_ROLES")` |
| `canManageOrganization(role)` | Shorthand for `hasPermission(role, "MANAGE_ORGANIZATION")` |
| `canAssignRole(inviterRole, targetRole)` | Returns `true` if inviter rank > target rank |

### Server-side (tRPC routers)

Use `orgProcedure` to get `ctx.membership.role`, then call permission helpers:

```ts
if (!canInviteMembers(ctx.membership.role)) {
  throw new TRPCError({ code: "FORBIDDEN", message: "..." });
}
```

### Client-side (UI components)

Import helpers directly and pass the current user's role from the membership query:

```ts
import { canInviteMembers } from "@/lib/permissions";
if (canInviteMembers(currentMember.role)) { /* show button */ }
```

## tRPC Procedure Layers

| Procedure | Auth | Membership | Provides on ctx |
|-----------|------|------------|-----------------|
| `publicProcedure` | No | No | `db`, `session` (nullable) |
| `protectedProcedure` | Yes | No | `db`, `session.user` (guaranteed) |
| `orgProcedure` | Yes | Org | Above + `membership`, `organization` |
| `projectProcedure` | Yes | Project | Above + `projectMember`, `project`, `organization` |

`orgProcedure` requires `{ organizationId }` in input and verifies the user has a `Membership` record.

`projectProcedure` requires `{ projectId }` in input and verifies the user has a `ProjectMember` record. It auto-creates one for org owners, admins, and project_managers; org members and viewers must be explicitly invited to individual projects.

## Middleware Route Protection

**Source**: `src/middleware.ts`

### Public routes (no session required)

- `/` (landing page)
- `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`
- `/api/*` (all API routes bypass middleware auth)

### Protected route logic (sequential checks)

1. **Auth pages + session cookie** -- redirect to `/{activeOrgSlug}` (if onboarded) or `/onboarding`
2. **Auth pages + no session** -- allow through
3. **`/invite/*`** -- allow for all users (the invite page handles auth state inline)
4. **No session cookie** -- redirect to `/sign-in?callbackUrl={pathname}`
5. **`/onboarding`** -- allow if not onboarded; redirect to org home if already onboarded
6. **Not onboarded** -- redirect to `/onboarding`
7. **Org-scoped route** (first segment matches `[a-z0-9-]+` and is not a static prefix) -- set `active-org-slug` cookie (httpOnly, 1-year TTL)

### Test bypass

Header `x-playwright-test: true` skips all checks in non-production environments.

## Key Auth Flows

### Sign up -> onboarding -> first org

1. User registers at `/sign-up` (email + password, auto sign-in)
2. Middleware detects no `onboarding-complete` cookie, redirects to `/onboarding`
3. User creates their first organization (sets `onboardingComplete` on user record)
4. `active-org-slug` cookie is set; user lands at `/{orgSlug}`

### Sign in -> redirect to active org

1. User signs in at `/sign-in`
2. Middleware checks `onboarding-complete` + `active-org-slug` cookies
3. Redirects to `/{activeOrgSlug}` or `/onboarding` if not yet completed

### Invite accept -> join existing org

1. Invitation created via `invitation.create` (requires `INVITE_MEMBERS` + role hierarchy check)
2. Email sent with token link; token expires in 7 days
3. Recipient visits `/invite?token=...` (public lookup via `getByToken`)
4. Authenticated user calls `invitation.accept` (email must match invitation)
5. Transaction: creates membership, marks invitation accepted, sets `onboardingComplete`
6. Notifications sent to all existing org members

### Password reset

1. User visits `/forgot-password`
2. Better Auth handles the reset email flow via `/api/auth`
3. User resets password at `/reset-password`
