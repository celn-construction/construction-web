# tRPC Best Practices

Authoritative guide for all tRPC-related code in this project. Follow these patterns exactly.

---

## 1. Procedure Hierarchy

```
publicProcedure          → No auth. ctx: { db, session (nullable) }
protectedProcedure       → Auth required. ctx: { db, session.user (guaranteed) }
orgProcedure             → Auth + org membership. ctx: { db, session.user, membership, organization }
projectProcedure         → Auth + project membership. ctx: { db, session.user, projectMember, project, organization }
```

**When to use each:**

| Scope | Procedure | Example |
|-------|-----------|---------|
| No auth needed | `publicProcedure` | Beta code validation, public invite lookup |
| User-level (no org/project context) | `protectedProcedure` | User profile, org list, onboarding |
| Organization-scoped | `orgProcedure` | Members list, org stats, documents |
| Project-scoped | `projectProcedure` | Invitations, project members, Gantt data |

**What each procedure auto-injects into input:**
- `orgProcedure` adds `{ organizationId: z.string() }` — access via `input.organizationId` or `ctx.organization.id`
- `projectProcedure` adds `{ projectId: z.string() }` — access via `input.projectId` or `ctx.project.id`

---

## 2. Router Patterns

**File location:** `src/server/api/routers/<feature>.ts`
**Registration:** `src/server/api/root.ts`

### Minimal orgProcedure router (canonical example: `src/server/api/routers/member.ts`)

```ts
import { createTRPCRouter, orgProcedure } from "@/server/api/trpc";

export const memberRouter = createTRPCRouter({
  list: orgProcedure.query(async ({ ctx, input }) => {
    return ctx.db.membership.findMany({
      where: { organizationId: input.organizationId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
  }),
});
```

### projectProcedure router with permissions (canonical: `src/server/api/routers/invitation.ts`)

```ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, projectProcedure } from "@/server/api/trpc";
import { canInviteMembers, canAssignRole } from "@/lib/permissions";
import { createInvitationSchema } from "@/lib/validations/invitation";

export const invitationRouter = createTRPCRouter({
  create: projectProcedure
    .input(createInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!canInviteMembers(ctx.projectMember.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "..." });
      }
      if (!canAssignRole(ctx.projectMember.role, input.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "..." });
      }
      // ... create logic
    }),
});
```

### Registering a router (`src/server/api/root.ts`)

```ts
import { featureRouter } from "@/server/api/routers/feature";

export const appRouter = createTRPCRouter({
  // ... existing
  feature: featureRouter,
});
```

---

## 3. Error Handling

Always use `TRPCError` with appropriate codes:

```ts
throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid input" });
throw new TRPCError({ code: "UNAUTHORIZED" }); // no session
throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "..." });
```

---

## 4. Zod Validation Schemas

**File location:** `src/lib/validations/<feature>.ts`

### Rules

- Same schema shared between tRPC router `.input()` and React Hook Form `zodResolver()`
- Export `z.infer<>` type aliases — never write type shapes manually
- Use `.trim()` on all string fields
- Use `.strict()` on API input schemas to reject unknown keys
- Compose update schemas from create schemas via `.partial()` / `.extend()` / `.pick()`
- Do NOT include `organizationId` or `projectId` in schemas used with `orgProcedure` / `projectProcedure` — those are injected by the procedure middleware

### Pattern (canonical: `src/lib/validations/project.ts`)

```ts
import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100).trim(),
  template: z.enum(["BLANK"]).default("BLANK").optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

### Composing schemas

```ts
// Update = partial create + required id
export const updateFeatureSchema = createFeatureSchema
  .partial()
  .extend({ id: z.string().cuid() })
  .strict();

export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;

// Summary = pick fields from create
export const featureSummarySchema = createFeatureSchema.pick({ name: true, status: true });
```

---

## 5. Prisma Query Rules

### Tenant scoping — ALWAYS required

```ts
// orgProcedure — scope to organization
await ctx.db.model.findMany({
  where: { organizationId: ctx.organization.id },
});

// projectProcedure — scope to project
await ctx.db.model.findMany({
  where: { projectId: ctx.project.id },
});
```

### findUnique over findFirst

Use `findUnique` on uniquely-constrained columns — it's faster and semantically correct:

```ts
// ✅ Correct — compound unique key
await ctx.db.membership.findUnique({
  where: { userId_organizationId: { userId, organizationId } },
});

// ❌ Wrong — findFirst on a unique constraint
await ctx.db.membership.findFirst({
  where: { userId, organizationId },
});
```

### Select only what you need

```ts
// ✅ Explicit select
await ctx.db.user.findMany({
  select: { id: true, name: true, email: true },
});

// ❌ Fetching entire model when only 3 fields are needed
await ctx.db.user.findMany();
```

### Parallel queries with Promise.all

```ts
const [tasks, members, documents] = await Promise.all([
  ctx.db.task.findMany({ where: { projectId } }),
  ctx.db.projectMember.findMany({ where: { projectId } }),
  ctx.db.document.findMany({ where: { projectId } }),
]);
```

### Transactions for multi-table writes

```ts
await ctx.db.$transaction(async (tx) => {
  const item = await tx.model.create({ data: { ... } });
  await tx.otherModel.update({ where: { id }, data: { ... } });
  return item;
});
```

---

### Lazy backfill on first read

A few procedures deal with data that was migrated additively — a new table sits next to a legacy column without backfilling rows in the migration itself. The pattern is to backfill **on first read** inside the read procedure:

- `gantt.listSlots` lazily creates `TaskRequirementSlot` rows the first time a task with a non-zero `requiredSubmittals` / `requiredInspections` is read. The legacy count column remains the source of truth for the count; the new table holds the per-slot metadata (`name`, `dueDate`, `approverId`).
- Mutations that change the count (`gantt.setSlotCount`) keep the legacy column synced inside the same `$transaction` so existing readers (`gantt.taskDetail`, `gantt.requirementStats`, the inline popover progress) don't need to change.

Use this pattern when a migration is purely additive and the read path can self-heal — it avoids destructive bulk-write migrations on the shared dev DB.

## 6. Helper Functions

**File location:** `src/server/api/helpers/`

Always accept `db: PrismaClient` as the first parameter so the helper works with both the global `db` and a transaction client `tx`:

```ts
import type { PrismaClient } from "@prisma/client";

export async function resolveActiveProject(db: PrismaClient, organizationId: string) {
  // use db param, not the global import
}
```

Call from a router:
```ts
// With global db
await resolveActiveProject(ctx.db, orgId);

// Inside a transaction
await ctx.db.$transaction(async (tx) => {
  await resolveActiveProject(tx, orgId);
});
```

---

## 7. Frontend Data Fetching

### Server Components (`src/trpc/server.ts`)

```ts
import { api } from "@/trpc/server";

// Direct call — no hooks
const projects = await api.project.list({ organizationId });
```

### Client Components (`src/trpc/react`)

```ts
'use client';
import { api } from "@/trpc/react";

// Queries
const { data: items = [], isLoading } = api.feature.list.useQuery(
  { organizationId },
  { retry: false, enabled: !!organizationId },
);

// Mutations
const utils = api.useUtils();
const createMutation = api.feature.create.useMutation({
  onSuccess: () => {
    void utils.feature.list.invalidate();
  },
  onError: (error) => {
    showSnackbar(error.message || "Failed to create", "error");
  },
});

// Trigger mutation
createMutation.mutate({ ...data, organizationId });
```

### Cache invalidation rules

- Always fire-and-forget: `void utils.feature.list.invalidate()`
- Invalidate specifically — not `utils.invalidate()` (which invalidates everything)
- Invalidate all related queries after a mutation (e.g., list + getActive after create)

---

## 8. Forms (react-hook-form + Zod + MUI)

Canonical example: `src/components/projects/AddProjectDialog.tsx`

```tsx
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { api } from '@/trpc/react';
import { createFeatureSchema, type CreateFeatureInput } from '@/lib/validations/feature';

export default function CreateFeatureDialog({ open, onOpenChange }: Props) {
  const utils = api.useUtils();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateFeatureInput>({
    resolver: zodResolver(createFeatureSchema),
    defaultValues: { name: '' },
  });

  const createMutation = api.feature.create.useMutation({
    onSuccess: () => {
      void utils.feature.list.invalidate();
      reset();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit((data) => createMutation.mutate(data))}>
        <DialogTitle>Create Feature</DialogTitle>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="contained" type="submit" disabled={createMutation.isPending}>
            Create
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
```

### Key rules

- Import the Zod schema AND its inferred type from `src/lib/validations/`
- Use `zodResolver(schema)` — single source of truth for validation
- Wrap MUI inputs with `Controller`, spread `{...field}`
- Show errors via `error={!!errors.fieldName}` and `helperText={errors.fieldName?.message}`
- `reset()` form on successful mutation

---

## 9. Testing tRPC Components

**Stack:** Vitest + React Testing Library

### Mocking tRPC hooks

```tsx
import { vi } from 'vitest';

vi.mock('@/trpc/react', () => ({
  api: {
    feature: {
      list: { useQuery: vi.fn(() => ({ data: [], isLoading: false })) },
      create: { useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })) },
    },
    useUtils: vi.fn(() => ({
      feature: { list: { invalidate: vi.fn() } },
    })),
  },
}));
```

### Selector priority

```ts
// ✅ Preferred (accessibility-first)
screen.getByRole('button', { name: /create/i });
screen.getByLabelText(/email/i);
screen.getByText(/loading/i);

// ❌ Avoid
screen.getByTestId('submit-btn');
```

---

## 10. Anti-Patterns — Do NOT

| Don't | Do instead |
|-------|-----------|
| Redeclare `organizationId` in `.input()` on `orgProcedure` | It's already injected — use `input.organizationId` or `ctx.organization.id` |
| Redeclare `projectId` in `.input()` on `projectProcedure` | It's already injected — use `input.projectId` or `ctx.project.id` |
| `throw new Error("...")` in a router | `throw new TRPCError({ code: "NOT_FOUND", message: "..." })` |
| Import `db` directly in a helper | Accept `db: PrismaClient` as parameter |
| `findFirst` on a unique constraint | `findUnique` with compound key |
| `findMany` without `select` when only a few fields needed | Always `select` or `include` only what's used |
| `utils.invalidate()` (invalidates everything) | `void utils.feature.list.invalidate()` (specific) |
| Write type shapes manually | `z.infer<typeof schema>` |
| `z.any()` | `z.unknown()` — forces explicit narrowing |
| Duplicate Zod field definitions across create/update | Compose: `createSchema.partial().extend({ id })` |
| Fetch data in client components via `fetch()` | Use tRPC hooks: `api.feature.list.useQuery()` |
| Module-level variables for caching in server code | `React.cache()` for per-request deduplication |
| `memberRole: string` | Use `Role` from `src/lib/permissions.ts` |

---

## 11. File Location Quick Reference

| What | Where |
|------|-------|
| Procedure definitions | `src/server/api/trpc.ts` |
| Router registration | `src/server/api/root.ts` |
| Routers | `src/server/api/routers/<feature>.ts` |
| Helpers | `src/server/api/helpers/<helper>.ts` |
| Zod schemas | `src/lib/validations/<feature>.ts` |
| Permissions | `src/lib/permissions.ts` |
| Domain constants | `src/lib/constants/<feature>.ts` |
| Components | `src/components/<feature>/` |
| Pages (org-scoped) | `src/app/(app)/[orgSlug]/<feature>/page.tsx` |
| Pages (project-scoped) | `src/app/(app)/[orgSlug]/projects/[projectSlug]/<feature>/page.tsx` |
| tRPC client hooks | `src/trpc/react.tsx` — import `{ api }` |
| tRPC server caller | `src/trpc/server.ts` — import `{ api }` |
| Type inference helpers | `src/trpc/react.tsx` — `RouterInputs`, `RouterOutputs` |
