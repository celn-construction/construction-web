# SRC App Routes Reference

Generated on 2026-02-13.

This document maps every `src/app` page, layout, loading UI, and API route to implementation and dependencies.

For route groups like `(app)` and `(auth)`: `Folder Scope` shows the group folder, while `Public Route` shows the URL path without group segments.

## Route Modules

| Folder Scope | Public Route | Kind | Mode | Default Export | File |
|---|---|---|---|---|---|
| `(app)` | `/` | layout | client | `AppLayout` | `src/app/(app)/layout.tsx` |
| `(app)` | `/` | loading | server/default | `AppLoading` | `src/app/(app)/loading.tsx` |
| `(auth)` | `/` | layout | server/default | `AuthLayout` | `src/app/(auth)/layout.tsx` |
| `(onboarding)` | `/` | layout | server/default | `OnboardingLayout` | `src/app/(onboarding)/layout.tsx` |
| `(root)` | `/` | layout | server/default | `RootLayout` | `src/app/layout.tsx` |
| `(root)` | `/` | loading | server/default | `Loading` | `src/app/loading.tsx` |
| `(root)` | `/` | page | client | `Home` | `src/app/page.tsx` |
| `api/auth/[...all]` | `/api/auth/[...all]` | api-route | server/default | `-` | `src/app/api/auth/[...all]/route.ts` |
| `api/forgot-password` | `/api/forgot-password` | api-route | server/default | `-` | `src/app/api/forgot-password/route.ts` |
| `api/reset-password` | `/api/reset-password` | api-route | server/default | `-` | `src/app/api/reset-password/route.ts` |
| `api/trpc/[trpc]` | `/api/trpc/[trpc]` | api-route | server/default | `-` | `src/app/api/trpc/[trpc]/route.ts` |
| `api/upload` | `/api/upload` | api-route | server/default | `-` | `src/app/api/upload/route.ts` |
| `(app)/bryntum` | `/bryntum` | page | client | `BryntumPage` | `src/app/(app)/bryntum/page.tsx` |
| `(app)/dashboard` | `/dashboard` | loading | client | `DashboardLoading` | `src/app/(app)/dashboard/loading.tsx` |
| `(app)/dashboard` | `/dashboard` | page | client | `DashboardPage` | `src/app/(app)/dashboard/page.tsx` |
| `(app)/documents` | `/documents` | loading | server/default | `DocumentsLoading` | `src/app/(app)/documents/loading.tsx` |
| `(app)/documents` | `/documents` | page | client | `DocumentsPage` | `src/app/(app)/documents/page.tsx` |
| `(auth)/forgot-password` | `/forgot-password` | page | client | `ForgotPasswordPage` | `src/app/(auth)/forgot-password/page.tsx` |
| `invite/[token]` | `/invite/[token]` | page | client | `InvitePage` | `src/app/invite/[token]/page.tsx` |
| `(onboarding)/onboarding` | `/onboarding` | page | server/default | `async OnboardingPage` | `src/app/(onboarding)/onboarding/page.tsx` |
| `(app)/projects` | `/projects` | loading | server/default | `ProjectsLoading` | `src/app/(app)/projects/loading.tsx` |
| `(app)/projects` | `/projects` | page | client | `ProjectsPage` | `src/app/(app)/projects/page.tsx` |
| `(auth)/reset-password` | `/reset-password` | page | client | `ResetPasswordPage` | `src/app/(auth)/reset-password/page.tsx` |
| `(auth)/sign-in` | `/sign-in` | page | client | `SignInPage` | `src/app/(auth)/sign-in/page.tsx` |
| `(auth)/sign-up` | `/sign-up` | page | client | `SignUpPage` | `src/app/(auth)/sign-up/page.tsx` |
| `(app)/team` | `/team` | page | client | `TeamPage` | `src/app/(app)/team/page.tsx` |
| `(app)/timeline` | `/timeline` | loading | server/default | `TimelineLoading` | `src/app/(app)/timeline/loading.tsx` |
| `(app)/timeline` | `/timeline` | page | client | `TimelinePage` | `src/app/(app)/timeline/page.tsx` |

## Route Dependency Notes

### `src/app/(app)/bryntum/page.tsx`
- Folder Scope: `(app)/bryntum`
- Public Route: `/bryntum`
- Kind: `page`
- Mode: `client`
- Default Export: `BryntumPage`
- Local Components: -
- Key Dependencies: `next/dynamic`
- Behaviors: -

### `src/app/(app)/dashboard/loading.tsx`
- Folder Scope: `(app)/dashboard`
- Public Route: `/dashboard`
- Kind: `loading`
- Mode: `client`
- Default Export: `DashboardLoading`
- Local Components: `@/components/dashboard/GanttLoadingAnimation`
- Key Dependencies: -
- Behaviors: -

### `src/app/(app)/dashboard/page.tsx`
- Folder Scope: `(app)/dashboard`
- Public Route: `/dashboard`
- Kind: `page`
- Mode: `client`
- Default Export: `DashboardPage`
- Local Components: `@/components/projects/AddProjectDialog`
- Key Dependencies: `@/lib/auth-client`, `@/trpc/react`
- Behaviors: `trpc.query`, `session`

### `src/app/(app)/documents/loading.tsx`
- Folder Scope: `(app)/documents`
- Public Route: `/documents`
- Kind: `loading`
- Mode: `server/default`
- Default Export: `DocumentsLoading`
- Local Components: -
- Key Dependencies: -
- Behaviors: -

### `src/app/(app)/documents/page.tsx`
- Folder Scope: `(app)/documents`
- Public Route: `/documents`
- Kind: `page`
- Mode: `client`
- Default Export: `DocumentsPage`
- Local Components: `@/components/documents/DocumentTree`
- Key Dependencies: -
- Behaviors: -

### `src/app/(app)/layout.tsx`
- Folder Scope: `(app)`
- Public Route: `/`
- Kind: `layout`
- Mode: `client`
- Default Export: `AppLayout`
- Local Components: `@/components/layout/Header`, `@/components/layout/Sidebar`, `@/components/layout/MobileHeader`, `@/components/layout/MobileDrawer`
- Key Dependencies: -
- Behaviors: -

### `src/app/(app)/loading.tsx`
- Folder Scope: `(app)`
- Public Route: `/`
- Kind: `loading`
- Mode: `server/default`
- Default Export: `AppLoading`
- Local Components: -
- Key Dependencies: -
- Behaviors: -

### `src/app/(app)/projects/loading.tsx`
- Folder Scope: `(app)/projects`
- Public Route: `/projects`
- Kind: `loading`
- Mode: `server/default`
- Default Export: `ProjectsLoading`
- Local Components: -
- Key Dependencies: -
- Behaviors: -

### `src/app/(app)/projects/page.tsx`
- Folder Scope: `(app)/projects`
- Public Route: `/projects`
- Kind: `page`
- Mode: `client`
- Default Export: `ProjectsPage`
- Local Components: `@/components/projects/ProjectsTree`, `@/components/projects/ProjectDetailPanel`
- Key Dependencies: -
- Behaviors: -

### `src/app/(app)/team/page.tsx`
- Folder Scope: `(app)/team`
- Public Route: `/team`
- Kind: `page`
- Mode: `client`
- Default Export: `TeamPage`
- Local Components: `@/components/team/InviteDialog`, `@/components/team/MembersList`, `@/components/team/PendingInvitesList`
- Key Dependencies: `~/trpc/react`
- Behaviors: `trpc.query`

### `src/app/(app)/timeline/loading.tsx`
- Folder Scope: `(app)/timeline`
- Public Route: `/timeline`
- Kind: `loading`
- Mode: `server/default`
- Default Export: `TimelineLoading`
- Local Components: -
- Key Dependencies: -
- Behaviors: -

### `src/app/(app)/timeline/page.tsx`
- Folder Scope: `(app)/timeline`
- Public Route: `/timeline`
- Kind: `page`
- Mode: `client`
- Default Export: `TimelinePage`
- Local Components: -
- Key Dependencies: -
- Behaviors: -

### `src/app/(auth)/forgot-password/page.tsx`
- Folder Scope: `(auth)/forgot-password`
- Public Route: `/forgot-password`
- Kind: `page`
- Mode: `client`
- Default Export: `ForgotPasswordPage`
- Local Components: `@/components/ui/button`, `@/components/ui/Logo`
- Key Dependencies: `next/link`, `next/image`
- Behaviors: `fetch`

### `src/app/(auth)/layout.tsx`
- Folder Scope: `(auth)`
- Public Route: `/`
- Kind: `layout`
- Mode: `server/default`
- Default Export: `AuthLayout`
- Local Components: -
- Key Dependencies: -
- Behaviors: -

### `src/app/(auth)/reset-password/page.tsx`
- Folder Scope: `(auth)/reset-password`
- Public Route: `/reset-password`
- Kind: `page`
- Mode: `client`
- Default Export: `ResetPasswordPage`
- Local Components: `@/components/ui/button`, `@/components/ui/Logo`
- Key Dependencies: `next/navigation`, `next/link`, `next/image`
- Behaviors: `fetch`, `router`

### `src/app/(auth)/sign-in/page.tsx`
- Folder Scope: `(auth)/sign-in`
- Public Route: `/sign-in`
- Kind: `page`
- Mode: `client`
- Default Export: `SignInPage`
- Local Components: `@/components/ui/button`, `@/components/ui/Logo`
- Key Dependencies: `next/navigation`, `next/link`, `next/image`, `@/lib/auth-client`
- Behaviors: `router`, `searchParams`

### `src/app/(auth)/sign-up/page.tsx`
- Folder Scope: `(auth)/sign-up`
- Public Route: `/sign-up`
- Kind: `page`
- Mode: `client`
- Default Export: `SignUpPage`
- Local Components: `@/components/ui/Logo`
- Key Dependencies: `next/navigation`, `next/link`, `next/image`, `@/lib/auth-client`
- Behaviors: `router`, `searchParams`

### `src/app/(onboarding)/layout.tsx`
- Folder Scope: `(onboarding)`
- Public Route: `/`
- Kind: `layout`
- Mode: `server/default`
- Default Export: `OnboardingLayout`
- Local Components: `~/components/onboarding/BlueprintBackground`
- Key Dependencies: -
- Behaviors: -

### `src/app/(onboarding)/onboarding/page.tsx`
- Folder Scope: `(onboarding)/onboarding`
- Public Route: `/onboarding`
- Kind: `page`
- Mode: `server/default`
- Default Export: `async OnboardingPage`
- Local Components: `@/components/onboarding/OnboardingWizard`
- Key Dependencies: `next/navigation`, `@/lib/auth`
- Behaviors: `redirect`, `headers`

### `src/app/api/auth/[...all]/route.ts`
- Folder Scope: `api/auth/[...all]`
- Public Route: `/api/auth/[...all]`
- Kind: `api-route`
- Mode: `server/default`
- Default Export: `-`
- Local Components: -
- Key Dependencies: `@/lib/auth`, `better-auth/next-js`
- Behaviors: -

### `src/app/api/forgot-password/route.ts`
- Folder Scope: `api/forgot-password`
- Public Route: `/api/forgot-password`
- Kind: `api-route`
- Mode: `server/default`
- Default Export: `-`
- Local Components: -
- Key Dependencies: `next/server`, `@/server/db`
- Behaviors: -

### `src/app/api/reset-password/route.ts`
- Folder Scope: `api/reset-password`
- Public Route: `/api/reset-password`
- Kind: `api-route`
- Mode: `server/default`
- Default Export: `-`
- Local Components: -
- Key Dependencies: `next/server`, `@/server/db`, `better-auth/crypto`
- Behaviors: -

### `src/app/api/trpc/[trpc]/route.ts`
- Folder Scope: `api/trpc/[trpc]`
- Public Route: `/api/trpc/[trpc]`
- Kind: `api-route`
- Mode: `server/default`
- Default Export: `-`
- Local Components: -
- Key Dependencies: `@trpc/server/adapters/fetch`, `next/server`, `~/server/api/trpc`
- Behaviors: -

### `src/app/api/upload/route.ts`
- Folder Scope: `api/upload`
- Public Route: `/api/upload`
- Kind: `api-route`
- Mode: `server/default`
- Default Export: `-`
- Local Components: -
- Key Dependencies: `next/server`, `@vercel/blob`, `@/server/db`, `@/lib/auth`
- Behaviors: -

### `src/app/invite/[token]/page.tsx`
- Folder Scope: `invite/[token]`
- Public Route: `/invite/[token]`
- Kind: `page`
- Mode: `client`
- Default Export: `InvitePage`
- Local Components: `@/components/ui/Logo`, `@/components/onboarding/BlueprintBackground`
- Key Dependencies: `next/navigation`, `next/link`, `~/trpc/react`, `@/lib/auth-client`
- Behaviors: `trpc.query`, `trpc.mutation`, `session`, `router`

### `src/app/layout.tsx`
- Folder Scope: `(root)`
- Public Route: `/`
- Kind: `layout`
- Mode: `server/default`
- Default Export: `RootLayout`
- Local Components: `@/components/providers/LoadingProvider`, `@/components/providers/ThemeRegistry`
- Key Dependencies: `next/font/google`, `~/trpc/react`
- Behaviors: -

### `src/app/loading.tsx`
- Folder Scope: `(root)`
- Public Route: `/`
- Kind: `loading`
- Mode: `server/default`
- Default Export: `Loading`
- Local Components: `@/components/ui/loading-spinner`
- Key Dependencies: -
- Behaviors: -

### `src/app/page.tsx`
- Folder Scope: `(root)`
- Public Route: `/`
- Kind: `page`
- Mode: `client`
- Default Export: `Home`
- Local Components: `@/components/ui/Logo`, `@/components/ui/optimized-image`
- Key Dependencies: `next/link`, `@/lib/auth-client`
- Behaviors: `session`

## Non-Route Modules Under `src/app`

| File | Mode | Default Export |
|---|---|---|
| `src/app/(app)/timeline/events.ts` | server/default | `-` |
| `src/app/(app)/timeline/resources.ts` | server/default | `-` |
