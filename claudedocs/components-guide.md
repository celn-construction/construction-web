# Components Guide

Conventions for adding, naming, and structuring components in `src/components/`.

---

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `ui/` | Shared design-system primitives (Button, Label, dropdowns, image helpers, spinner) |
| `layout/` | App shell: Header, Sidebar, MobileHeader, OrgSwitcher, UserMenu, PageHeader |
| `providers/` | React context providers: ThemeRegistry, OrgProvider, ProjectProvider, LoadingProvider |
| `dashboard/` | Dashboard feature components (StatsCards, ProjectsList, TeamActivity) |
| `projects/` | Project CRUD dialogs and trees (AddProjectDialog, ProjectsTree, ProjectDetailPanel) |
| `documents/` | Document feature components (DocumentList, UploadDialog, FileDropzone) |
| `team/` | Team/invite management (MembersList, InviteDialog, RoleSelect, PendingInvitesList) |
| `onboarding/` | Onboarding wizard and step components |
| `bryntum/` | Gantt chart integration — has its own internal structure (see below) |

**Rule:** New feature components go in a directory named after their feature, not in `ui/` or `layout/`.

---

## Custom Hooks

Hooks are placed based on their scope:

- **`src/hooks/`** — Shared cross-feature hooks used by 2+ unrelated components (e.g. `useOrgFromUrl`, `useNotifications`, `useInvitationActions`). Mark with `'use client'`.
- **`src/components/<feature>/hooks/`** — Hooks scoped to a single feature (e.g. `bryntum/hooks/useGanttControls.ts`).

Use `src/hooks/` when the logic is consumed by components in different feature directories. Co-locate in the feature directory when the hook is only used within that feature.

---

## Shared Utilities (`src/lib/utils/`)

Pure, reusable utility functions live in `src/lib/utils/`. Current modules:

| File | Purpose |
|------|---------|
| `gantt.ts` | Gantt-specific data helpers |
| `getBaseURL.ts` | Base URL resolution |
| `slug.ts` | Slug generation |
| `files.tsx` | `getFileIcon(mimeType)` — returns Lucide icon for a file type |
| `formatting.ts` | `formatRole(role)`, `formatFileSize(bytes)` — display formatting helpers |

---

## Naming Conventions

- **Component files**: PascalCase matching the default export — `AddProjectDialog.tsx`
- **Hook files**: camelCase prefixed with `use` — `useTaskPopover.ts`
- **Utility files**: camelCase — `calculatePopoverPlacement.ts`
- **Constant/config files**: camelCase — `ganttConfig.ts`, `constants.ts`
- **Type files**: camelCase — `types.ts`
- No `index.ts` barrel files in component directories.

---

## Component File Structure

```tsx
'use client'; // Only when using hooks, browser APIs, or event handlers

import { ... } from '@mui/material';
import { api } from '@/trpc/react';          // tRPC client
import { useRouter, useParams } from 'next/navigation';
import OtherComponent from '@/components/feature/OtherComponent';

// 1. Props interface — always explicit, never inline
interface MyComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 2. Default export — named function matching filename
export default function MyComponent({ open, onOpenChange }: MyComponentProps) {
  // 3. Hooks at the top
  // 4. Derived state
  // 5. Mutations / queries
  // 6. Handlers
  // 7. JSX
}
```

- Always `export default` for page/feature components.
- Named exports for re-usable UI primitives (see `ui/button.tsx`).
- Props interface named `<ComponentName>Props` in the same file.

---

## When to Add `'use client'`

Add `'use client'` when the component:
- Uses React hooks (`useState`, `useEffect`, `useRef`, etc.)
- Calls tRPC client hooks (`api.xxx.useQuery`, `api.xxx.useMutation`)
- Handles browser events or reads browser APIs
- Uses `useRouter`, `useParams`, `usePathname`

Omit `'use client'` for pure presentational components that receive all data as props and have no interactivity. These can remain RSCs and be imported into client components without issue.

---

## Styling

MUI `sx` prop is the primary styling mechanism. Do not use CSS modules or Tailwind classes on MUI components.

```tsx
// ✅ MUI sx — use theme tokens
<Box sx={{ bgcolor: 'background.paper', borderColor: 'divider', p: 2 }}>

// ✅ CSS variables — for one-off colors from the design system
<Icon style={{ color: 'var(--accent-primary)' }} />

// ❌ Avoid hardcoded colors
<Box sx={{ bgcolor: '#fff', color: '#333' }}>
```

Lucide icons are always sized via `style={{ width: N, height: N }}` (not `sx`).

---

## Data Fetching

Components fetch their own data via tRPC — do not thread props through multiple layers.

```tsx
// ✅ Fetch inside the component that needs it
const { data: projects = [], isLoading } = api.project.list.useQuery(
  { organizationId },
  { retry: false, enabled: !!organizationId }
);

// ✅ Derive org context from URL params + org list (standard pattern)
const params = useParams<{ orgSlug?: string }>();
const { data: organizations = [] } = api.organization.list.useQuery(undefined, { retry: false });
const currentOrg = organizations.find((o) => o.slug === params.orgSlug);
```

Cache invalidation after mutations: `void utils.xxx.invalidate()` — always fire-and-forget with `void`.

---

## Forms

Use `react-hook-form` + `zodResolver` + a Zod schema from `src/lib/validations/`.

```tsx
const { control, handleSubmit, reset, formState: { errors } } = useForm<InputType>({
  resolver: zodResolver(schema),
  defaultValues: { ... },
});

// Wrap MUI inputs with Controller
<Controller
  name="fieldName"
  control={control}
  render={({ field }) => (
    <TextField {...field} error={!!errors.fieldName} helperText={errors.fieldName?.message} />
  )}
/>
```

---

## UI Primitives (`ui/`)

`ui/` components wrap MUI with a Shadcn-compatible API. Prefer them over bare MUI when available.

| Component | MUI base | Notes |
|-----------|----------|-------|
| `Button` | `MuiButton` / `IconButton` | Variants: `default`, `outline`, `ghost`, `destructive`; sizes: `default`, `sm`, `lg`, `icon`; `loading` prop |
| `DropdownMenu` | Radix primitive via Shadcn | Use for action menus; compatible with `asChild` |
| `sheet.tsx` | Radix Sheet | Slide-in panels |
| `Label` | MUI | Accessible form labels |
| `LoadingSpinner` | `CircularProgress` | Standard loading indicator |
| `ImageWithFallback` / `OptimizedImage` | `next/image` | Always use over bare `<img>` |

For any MUI component without a `ui/` wrapper, use MUI directly — do not create wrappers unless the abstraction is used in 3+ places.

---

## Providers (`providers/`)

Providers wrap context around the app. They are initialized in `src/app/(app)/layout.tsx`.

- `OrgProvider` — exposes `useOrg()` for current organization
- `ProjectProvider` — exposes `useProject()` for active project
- `LoadingProvider` — global loading overlay (`useLoading()` → `showLoading` / `hideLoading`)
- `ThemeRegistry` — MUI emotion SSR setup

Do not create new providers for feature-scoped state — use Zustand stores in `src/store/` instead.

---

## Bryntum (`bryntum/`)

The Gantt chart integration has its own internal structure because of the complexity of the Bryntum library:

```
bryntum/
  BryntumGanttWrapper.tsx   ← main wrapper (entry point)
  types.ts                  ← shared TypeScript types
  constants.ts              ← event names, column IDs, etc.
  config/
    ganttConfig.ts          ← Bryntum config object
  components/
    TaskDetailsPopover.tsx
    BryntumPanelHeader.tsx
  hooks/
    useTaskPopover.ts
    useBryntumThemeAssets.ts
  utils/
    calculatePopoverPlacement.ts
```

Follow this sub-structure if adding more Gantt-related code. Do not add Gantt logic to other `components/` folders.

---

## Adding a New Feature Slice

1. Create `src/components/<feature>/` directory.
2. Use PascalCase filenames matching exported component names.
3. Add `'use client'` only where needed — split into server/client parts if a component is mostly static.
4. Define Zod schema in `src/lib/validations/<feature>.ts` before building forms.
5. Add tRPC router in `src/server/routers/<feature>.ts` and register in `src/server/root.ts`.
6. Update `claudedocs/codebase-overview.md` if the new slice changes the directory structure.
