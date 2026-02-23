# Data Flows

## Middleware Routing (`src/middleware.ts`)

Cookies used: `better-auth.session_token`, `onboarding-complete`, `active-org-slug`, `active-project-slug`

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
  |-- /dashboard + warm cookies      --> redirect /{orgSlug}/projects/{projectSlug}/gantt (fast-path)
  |-- /dashboard + no project cookie --> pass through
  |-- /{orgSlug}/* (org-scoped)      --> set active-org-slug cookie, pass through
  |-- /{orgSlug}/projects/{slug}/*   --> also set active-project-slug cookie, pass through
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

## Gantt Task Detail

**Router**: `gantt.ts` | **Procedure**: orgProcedure (`gantt.taskDetail`)

```
TaskDetailsPopover --> gantt.taskDetail({ projectId, taskId }):
  Verify project belongs to org --> query GanttTask by (id, projectId)
  --> Return { id, name, percentDone, startDate, endDate, coverImageUrl, group }
```

## Gantt Task Cover Image

**Endpoint**: `POST /api/gantt/cover-image` | `DELETE /api/gantt/cover-image`

```
Upload:
  User clicks "Add cover image" in TaskDetailsPopover
  --> POST /api/gantt/cover-image (multipart: file, projectId, taskId)
  --> Auth check --> verifyAccess (project exists, org membership, task exists)
  --> Validate file (size <= 10 MB, MIME: JPEG/PNG/GIF/WebP)
  --> Delete old blob if exists --> put() to Vercel Blob: projects/{projectId}/covers/{taskId}/{filename}
  --> Update GanttTask.coverImageUrl --> return { coverImageUrl }

Delete:
  User clicks "Remove" on existing cover image
  --> DELETE /api/gantt/cover-image (JSON: projectId, taskId)
  --> Auth check --> verifyAccess --> del() from Vercel Blob
  --> Set GanttTask.coverImageUrl = null --> return { success }
```

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

**Embedding on upload**: If `VOYAGE_API_KEY` is set and the document has an AI-generated description,
the upload route calls `embedDocuments([description])` (Voyage AI `voyage-4-lite`, 1024 dims),
converts to pgvector format via `toVectorSql()`, and writes to `Document.embedding` via `$executeRaw`.
Failures are caught and logged without failing the upload.

## Document Search

**Router**: `document.ts` | **Procedure**: orgProcedure

### Fuzzy Search (`document.search`)

```
User types in document explorer search bar (auto-debounced 300ms)
  --> document.search({ projectId, query, limit, offset, folderIds? }):
       Verify project belongs to org
       --> Empty query: return all documents (Prisma findMany, ordered by createdAt DESC)
       --> Short query (< 3 chars): ILIKE prefix match (trigrams need 3-char windows)
       --> Full query (3+ chars): hybrid fuzzy + full-text search
            $transaction:
              SET LOCAL pg_trgm.similarity_threshold = 0.3
              --> pg_trgm similarity (d.name % query) OR full-text (search_vector @@ websearch_to_tsquery)
              --> Rank = GREATEST(trigram_similarity, ts_rank_cd)
              --> COUNT(*) OVER() for total count (single query, no separate count)
  --> Return { results: shaped documents with uploader info, total }
```

### AI Semantic Search (`document.aiSearch`)

```
User enables AI toggle, types query, clicks search button
  --> document.aiSearch({ projectId, query, limit, offset, folderIds? }):
       Verify project belongs to org
       --> embedQuery(query) via Voyage AI (input_type: "query")
       --> toVectorSql(embedding) converts to pgvector format
       --> $queryRaw: cosine similarity search (d.embedding <=> vector)
            Filter: embedding IS NOT NULL, projectId, optional folderIds
            Rank = (1 - cosine_distance)
            ORDER BY cosine distance ASC (closest first)
  --> Return { results: shaped documents with uploader info, total }
```

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
