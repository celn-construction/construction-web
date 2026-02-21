# Architecture and TypeScript Standards

Standards for this Next.js 15 T3 SaaS codebase. Authoritative — follow these exactly.

---

## 1. Architecture Standards

### tRPC Procedure Hierarchy

```
publicProcedure
  └── protectedProcedure   (guarantees ctx.session)
        └── orgProcedure   (requires organizationId input, validates membership,
                            injects ctx.membership + ctx.organization)
```

Every org-scoped router MUST use `orgProcedure`. `ctx.organization.id` is always available inside `orgProcedure` handlers — no null checks needed. Do NOT redeclare `organizationId` in `.input()` when using `orgProcedure`.

### Key Structural Rules

| Pattern | Implementation |
|---|---|
| Zod schemas | Live in `src/lib/validations/`. Export `z.infer<>` aliases. Same schema imported by tRPC router AND React Hook Form. |
| Context providers | `createContext<T \| null>(null)` + hook that throws if used outside provider. No optional chaining at call sites. |
| Parallel DB queries | `Promise.all([...])` for independent fetches in a single procedure. |
| Multi-table writes | `db.$transaction(async (tx) => { ... })` — always. |
| Server helpers | `src/server/api/helpers/` — accept `db: PrismaClient` as param, never import global `db` singleton. |
| Domain constants | `src/lib/constants/` — never co-locate with UI components. |

---

## 2. Anti-Patterns to Avoid

| Don't | Do instead |
|---|---|
| Manually check org membership in a router | Use `orgProcedure` |
| `throw new Error(...)` inside a tRPC procedure | `throw new TRPCError({ code: "NOT_FOUND", message: "..." })` |
| Import `db` directly in a helper file | Accept `db: PrismaClient` as a parameter |
| `memberRole: string` at provider/function boundaries | Use `Role` from `src/lib/permissions.ts` |
| `z.any()` for external/opaque data | `z.unknown()` — forces explicit narrowing before use |
| Hardcoded hex colors or CSS variables in components | MUI `sx` with theme tokens (`theme.palette.primary.main`) |
| Propagating `any` for 3rd-party libs (Bryntum, etc.) | Define a minimal named interface for the methods actually called |
| Exporting domain constants from a UI component | Place in `src/lib/constants/` |
| `as unknown as X` in application code | Only at genuine 3rd-party integration boundaries |
| Redundant `.input({ organizationId })` on `orgProcedure` | `orgProcedure` already requires it |

---

## 3. TypeScript Rules

```ts
// Type aliases from schema — never write shapes manually
type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Helper signatures use PrismaClient to accept tx clients from $transaction
import type { PrismaClient } from "@prisma/client";
export function myHelper(db: PrismaClient, ...) {}

// Role union — not string
import type { Role } from "~/lib/permissions";
function canPerform(role: Role) {}

// satisfies for config objects
const config = { timeout: 5000, retries: 3 } satisfies RequestConfig;

// Named interfaces for repeated structural shapes
interface FolderItem { id: string; name: string; parentId: string | null; }
```

tRPC return types are inferred from the resolver — do not annotate them manually.

---

## 4. Next.js 15 Patterns

Server Components are default. Add `"use client"` only when you need event handlers, `useState`/`useEffect`, browser APIs, or context consumers. Never fetch data in Client Components — fetch in Server Components and pass as props, or use tRPC hooks.

**Critical: `"use client"` infects the entire import graph below it.** Every module a client file imports also becomes client JS. Push the directive as deep as possible — to the leaf interactive component, not the parent layout.

**Critical: Never use module-level variables for caching in server code.** They are shared across ALL requests from ALL users (data leak). Use `React.cache()` — it is per-request and deduplicates within a single render pass.

```ts
// WRONG — shared across all users
let cachedUser: User | null = null;

// RIGHT — per-request, deduplicated
import { cache } from "react";
export const getUser = cache(async (id: string) => db.user.findUnique({ where: { id } }));
```

**Critical: `revalidatePath()` inside a Route Handler does NOT clear the Router Cache.** Only Server Actions clear it. Use Server Actions for user-triggered mutations that need fresh data.

| Rule | Detail |
|---|---|
| `await params` | `params` is a Promise in Next.js 15 — always `await params` |
| tRPC in Server Components | `api.procedure()` from `src/trpc/server.ts` |
| tRPC in Client Components | `api.procedure.useQuery()` / `.useMutation()` |
| Auth redirects | `redirect()` in server components — not client navigation |
| Layouts | Handle auth checks and data fetching; pages stay thin |
| DOM-dependent 3rd-party | `dynamic(() => import("..."), { ssr: false })` (e.g. Bryntum Gantt) |
| Server-only modules | Add `import "server-only"` to any file that calls `db.*` or reads secrets |
| Client Component props | Never pass full Prisma model objects — use explicit `Pick<Model, ...>` props |

---

## 5. tRPC Patterns

```ts
// Org-scoped — organizationId NOT redeclared in input
listProjects: orgProcedure
  .input(z.object({ search: z.string().optional() }))
  .query(async ({ ctx, input }) => {
    const orgId = ctx.organization.id; // always defined
  }),

// Errors — always TRPCError
throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });

// Invalidate specifically after mutations
await utils.project.list.invalidate({ organizationId }); // NOT utils.invalidate()

// Map errors in components
if (err instanceof TRPCClientError) setError(err.message);
```

---

## 6. Prisma Patterns

```ts
// Always scope to tenant — organizationId or projectId required on every query
await tx.task.findMany({
  where: { project: { organizationId: ctx.organization.id } },
  select: { id: true, name: true, status: true }, // only what you need
});

// findUnique on unique-constrained columns — not findFirst
// Membership has @@unique([userId, organizationId]) — use compound key
await db.membership.findUnique({
  where: { userId_organizationId: { userId, organizationId } },
});

// Pass tx to helpers — not global db
await db.$transaction(async (tx) => {
  const project = await tx.project.create({ data: { ... } });
  await resolveActiveProject(tx, project.organizationId); // tx, not db
});

// Derive types from query shapes — not raw Prisma model types
type ProjectCard = Prisma.ProjectGetPayload<{
  select: { id: true; name: true; slug: true; status: true };
}>;
```

Never call `findMany` without `select` or `include` when only a subset of fields is needed. Never use `findFirst` on a uniquely-constrained column — `findUnique` is faster and semantically correct.

---

## 7. Zod Patterns

```ts
// Compose from existing schemas — never duplicate
const updateSchema = createSchema.extend({ id: z.string().cuid() });
const summarySchema = createSchema.pick({ name: true, status: true });

// Normalize at parse time
const nameField = z.string().trim().toLowerCase();

// Tagged unions — faster and safer than z.union()
const eventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("created"), projectId: z.string() }),
  z.object({ type: z.literal("deleted"), projectId: z.string() }),
]);

// Opaque external data — never z.any()
z.object({ data: z.unknown() }); // then narrow explicitly before use

// Dynamic keys
z.record(z.string(), z.string());

// Reject unknown keys on API inputs
const createSchema = z.object({ name: z.string() }).strict();
```
