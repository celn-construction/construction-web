# Data Flows

## Middleware Routing (`src/middleware.ts`)

Cookies used: `better-auth.session_token`, `onboarding-complete`, `active-org-slug`

```
Request
  |-- /api/*                         --> pass through (no auth check)
  |-- /                              --> pass through
  |-- Auth pages + session           --> redirect /{orgSlug} or /onboarding
  |-- Auth pages + no session        --> pass through
  |-- No session cookie              --> redirect /sign-in?callbackUrl=...
  |-- /invite/* + session            --> pass through
  |-- /onboarding + complete         --> redirect /{orgSlug}
  |-- Any route + onboarding incomplete --> redirect /onboarding
  |-- /{orgSlug}/* (org-scoped)      --> set active-org-slug cookie, pass through
```

## User Signup and Onboarding

**Router**: `onboarding.ts` | **Procedure**: protectedProcedure

```
Sign up (better-auth) --> session created --> middleware redirects to /onboarding
  --> onboarding.getStatus checks user.onboardingComplete
  --> User fills org form (name, companyType, phone, address, license#)
  --> onboarding.createOrganization:
       generateUniqueSlug(name) --> DB transaction:
         Create Organization --> Create Membership (role: "owner") --> user.onboardingComplete = true
  --> Client redirects to /{orgSlug}
```

Slug collisions: appends `-1`, `-2`, etc. until unique.

## Invitation Flow

**Router**: `invitation.ts` | orgProcedure (send/revoke/resend), publicProcedure (getByToken), protectedProcedure (accept)

**Send invite**:
```
Admin --> invitation.create:
  canInviteMembers + canAssignRole checks
  --> Reject if already member or pending invite exists
  --> Generate 32-byte hex token, expiresAt = now + 7 days
  --> Create Invitation record --> sendInvitationEmail
  --> If email fails: delete Invitation, throw error
```

**Accept invite**:
```
Recipient clicks /invite?token=xxx
  --> getByToken: validate token, expiry, status = PENDING
  --> User signs in/up --> invitation.accept:
       Verify session.email === invitation.email
       --> DB transaction:
            Create Membership --> invitation.status = ACCEPTED
            --> user.onboardingComplete = true
            --> Create MEMBER_JOINED notifications for existing members
  --> Client redirects to /{orgSlug}
```

**Revoke**: sets status = REVOKED | **Resend**: resets expiresAt +7 days, status = PENDING, re-sends email

## Project Creation

**Router**: `project.ts` | **Procedure**: protectedProcedure

```
User submits project form (name, template)
  --> project.create:
       Resolve orgId (input or active org) --> validate membership
       --> getTemplateData(template) --> project config + seed tasks/resources
       --> generateUniqueProjectSlug(name, orgId)
       --> Create Project (name, slug, status: "active", calendar config)
       --> If template tasks: ganttTask.createMany
       --> If template resources: ganttResource.createMany
       --> Set user.activeProjectId = project.id
  --> Client redirects to /{orgSlug}/projects/{projectSlug}
```

Templates: `BLANK` (default) or named templates with pre-built task/resource sets.

## Gantt Chart Load

**Endpoint**: `GET /api/gantt/load?projectId=xxx`
**Path**: route.ts --> tRPC `gantt.load` --> `ganttTree.ts`

```
Bryntum CrudManager GET --> auth check --> resolve active orgId
  --> gantt.load: query all project data (tasks, deps, resources, assignments, timeRanges)
  --> buildTaskTree: flat tasks --> nested tree (two-pass: map by ID, then nest by parentId)
  --> Sort recursively by orderIndex
  --> Map DB field names to Bryntum names (fromTaskId --> fromTask, taskId --> event, etc.)
  --> Return { success, tasks: { rows: tree }, dependencies, resources, assignments,
       timeRanges, project: { calendar, hoursPerDay } }
```

Response cached: `private, max-age=60, stale-while-revalidate=300`

## Gantt Chart Sync

**Endpoint**: `POST /api/gantt/sync?projectId=xxx`
**Path**: route.ts --> tRPC `gantt.sync` --> `ganttSync.ts`

```
Bryntum CrudManager POST { tasks, dependencies, resources, assignments, timeRanges }
  --> auth check --> resolve orgId
  --> DB $transaction with shared phantomIdMap (client temp IDs --> real cuid2 IDs):
       1. syncTasks: remove --> add (topological sort, parents before children) --> update
       2. syncDependencies: resolve fromTask/toTask phantom IDs
       3. syncResources
       4. syncAssignments: resolve event + resource phantom IDs
       5. syncTimeRanges
  --> Return { success, requestId, [store]: { rows: [{ $PhantomId, id }] } }
```

Phantom ID flow: Bryntum assigns temp `$PhantomId` to new records --> server maps to cuid2 IDs
--> response returns mapping --> client updates local store.

## Document Upload

**Endpoint**: `POST /api/upload` (multipart FormData)
**Router**: `document.ts` (orgProcedure for queries/delete)

```
User drops file --> POST /api/upload (file, projectId, taskId, folderId)
  --> Auth + validate (size <= 50 MB, MIME: images/PDF/Excel/Word/CSV/CAD)
  --> Verify project + org membership
  --> put() to Vercel Blob: projects/{projectId}/{taskId}/{folderId}/{filename}
  --> Create Document record (name, blobUrl, mimeType, size, taskId, folderId, uploadedById)
```

**Queries**: `listByFolder` | `listByTask` | `countByTask` (returns `{ [folderId]: count }`)
**Delete**: verify org ownership --> `del(blobUrl)` from Vercel Blob --> delete DB record

## Organization and Project Context

### OrgProvider (`(app)/[orgSlug]/layout.tsx` --> `OrgProvider.tsx`)

```
Request to /{orgSlug}/* --> server layout:
  Auth check --> DB: org by slug + user membership
  --> Not found/not member: redirect to user's first org or /onboarding
  --> Sync user.activeOrganizationId in DB
  --> <OrgProvider value={{ orgId, orgSlug, orgName, memberRole }}>
```

Client access: `useOrgContext()` --> `{ orgId, orgSlug, orgName, memberRole }`

### ProjectProvider (`(app)/[orgSlug]/projects/[projectSlug]/layout.tsx` --> `ProjectProvider.tsx`)

```
Request to /{orgSlug}/projects/{projectSlug}/* --> server layout:
  Auth check --> resolve org --> resolve project by (orgId, slug)
  --> Not found: redirect to /{orgSlug}
  --> Sync user.activeProjectId in DB
  --> <ProjectProvider value={{ projectId, projectSlug, projectName, organizationId }}>
```

Client access: `useProjectContext()` --> `{ projectId, projectSlug, projectName, organizationId }`

### Active Entity Tracking

Both layouts sync the user's active org/project in the DB on every page load. API routes
(e.g., `/api/gantt/load`) resolve the active org via `getActiveOrganizationId(db, userId)`
without requiring it in the URL.
