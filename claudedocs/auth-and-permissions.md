# Authentication & Permissions

## Auth System

- **Provider**: Better Auth 1.4 with Prisma adapter (PostgreSQL)
- **Auth method**: Email + password (min 8 chars, max 128, auto sign-in on register) with email OTP verification on sign-up
- **Email verification**: Better Auth `emailOTP` plugin — sends a 6-digit code on sign-up, must be verified before proceeding to onboarding
- **Base path**: `/api/auth`
- **Session**: Cookie-cached for 5 minutes (`cookieCache.maxAge = 300`)
- **Cookie names**: `better-auth.session_token` (localhost) / `__Secure-better-auth.session_token` (production)
- **Custom pages**: `/sign-in`, `/sign-up`
- **Trusted origins**: Dynamic — in development, any `localhost` origin (any port) is trusted; in production, `APP_URL` and `VERCEL_URL`. `APP_URL` is also set as `baseURL` in the auth config, so it is the single env var controlling Better Auth's base URL and trusted origins.

### Client Setup

`authClient` is created via `createAuthClient` pointing at `{baseURL}/api/auth` with `emailOTPClient()` plugin. Exports: `signIn`, `signUp`, `signOut`, `useSession`. OTP methods: `authClient.emailOtp.sendVerificationOtp()`, `authClient.emailOtp.verifyEmail()`.

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

The middleware is a thin session-cookie guard. It does NOT read the database or manage any application cookies (`onboarding-complete`, `active-org-slug`, etc.). Email verification and onboarding gates are enforced in the `(app)` layout via DB queries (see below).

### Pass-through routes (no session cookie required)

- `/` (landing page)
- `/api/*` (all API routes)
- `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` (auth pages)
- `/verify-email` (email verification page)
- `/onboarding` (onboarding page)
- `/invite/*` (invitation acceptance — the page handles auth state inline)

### Protected routes

All other routes require a session cookie. If no session cookie is present, the middleware redirects to `/sign-in?callbackUrl={pathname}`.

Auth pages always pass through — they handle already-signed-in users internally (e.g., redirecting to the dashboard).

### Server-side gates (`src/app/(app)/layout.tsx`)

The `(app)` layout performs DB-authoritative checks after the middleware passes:

1. **No session** → redirect to `/sign-in`
2. **Email not verified** (`user.emailVerified === false`) → redirect to `/verify-email`
3. **Onboarding incomplete** (`user.onboardingComplete === false`) → redirect to `/onboarding`

### Test bypass

Header `x-playwright-test: true` skips all middleware checks in non-production environments.

## Key Auth Flows

### Sign up -> email verification -> onboarding -> first org

1. User registers at `/sign-up` (email + password + beta code, auto sign-in)
2. Better Auth `emailOTP` plugin sends a 6-digit verification code to the user's email (console-logged in dev when `RESEND_API_KEY` is not set)
3. Sign-up page shows OTP input step — user enters the code and verifies via `authClient.emailOtp.verifyEmail()`
4. On successful verification, user is redirected to `/onboarding`
5. User creates their first organization (sets `onboardingComplete` on user record)
6. User lands at `/{orgSlug}`

### Sign in -> redirect to active org

1. User signs in at `/sign-in`
2. Sign-in page redirects to `/dashboard` (or `callbackUrl` if present)
3. The `(app)` layout checks email verification and onboarding status via DB, redirecting if needed

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
