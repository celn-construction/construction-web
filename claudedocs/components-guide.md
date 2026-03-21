# Components Guide

Conventions for adding, naming, and structuring components in `src/components/`.

---

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `ui/` | Shared design-system primitives (Button, Label, dropdowns, image helpers, spinner) |
| `layout/` | App shell: Header, Sidebar, MobileDrawer, OrgSwitcher, ProjectSwitcher, UserMenu, PageHeader |
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

Lucide icons are always sized via `style={{ width: N, height: N }}` (not `sx`). Phosphor icons use the `size` prop instead: `<Icon size={18} />`.

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

`ui/` components wrap MUI with project-specific conveniences. Prefer them over bare MUI when available.

| Component | MUI base | Notes |
|-----------|----------|-------|
| `Button` | `MuiButton` | Wraps MUI Button; adds `loading` and `loadingPosition` (`'start'` \| `'end'`) props with auto-sized spinner per MUI size (`small`=14px, `medium`=16px, `large`=18px). Uses MUI's native `variant` and `size` props. |
| `DropdownMenu` | Radix primitive via Shadcn | Use for action menus; compatible with `asChild` |
| `sheet.tsx` | Radix Sheet | Slide-in panels |
| `Label` | MUI | Accessible form labels |
| `LoadingSpinner` | `CircularProgress` | Standard loading indicator |
| `ImageWithFallback` / `OptimizedImage` | `next/image` | Always use over bare `<img>` |
| `FileDropzone` | `react-dropzone` | Standalone or embedded dropzone; accepts `getRootProps`/`getInputProps` for standalone mode |
| `UploadOverlay` | `CircularProgress` | Upload progress overlay with spinner; variants: `dark` (image overlay), `light` (form area) |

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

**IMPORTANT: Always consult the Bryntum Gantt documentation before making any changes to Gantt-related code.** Bryntum has many non-obvious internal behaviors (e.g. parent task duration being auto-calculated and non-editable by default, event firing order, scheduling engine quirks) that are not apparent from the config alone. The docs and support forum are the authoritative source:
- API docs: https://bryntum.com/products/gantt/docs/api/
- Forum: https://forum.bryntum.com/
- Support issues: https://github.com/bryntum/support/issues

---

## Tight Typography & Spacing (Sidebar Density Pattern)

The sidebar, mobile drawer, and project tree use a deliberate **compact density** that differs from MUI's loose defaults. Apply these exact values whenever building sidebar-style navigation, trees, or any panel that needs to show a lot of content without scrolling.

### Typography scale

| Role | `fontSize` | `fontWeight` | Notes |
|---|---|---|---|
| Section label (ALL CAPS) | `0.5625rem` (9px) | 600 | `letterSpacing: '0.12em'`, `textTransform: 'uppercase'`, `userSelect: 'none'` |
| Nav item / tree item | `0.8125rem` (13px) | 400–500 | Active items: `fontWeight: 550`, `letterSpacing: '-0.005em'` |
| Secondary / meta text | `0.6875rem` (11px) | 400–500 | Task counts, email, status labels |
| Document filename | `0.75rem`–`0.8rem` | 400 | Always truncate — see text overflow rule below |

Always set `lineHeight` explicitly — MUI's default (1.5) is too loose:
- Single-line rows: `lineHeight: 1`
- Stacked name + secondary (e.g. user profile): `lineHeight: 1.2`

### Spacing

```tsx
// Nav item row
sx={{ px: 1.25, py: 0.875, borderRadius: '8px' }}  // 10px / 7px

// Tree item label Box (the inner label wrapper)
sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.375 }}  // 3px vertical

// Gap between sibling nav rows
gap: '1px'

// Icon-to-label gap
gap: 1       // 8px — tree items
gap: 1.25    // 10px — sidebar nav items
```

### Icons

| Context | Library | Size | Notes |
|---|---|---|---|
| Sidebar nav | Phosphor | `size={17}` | `weight={isActive ? 'fill' : 'regular'}` |
| Tree folders / tasks | Phosphor | `size={14}` | |
| Tree documents | Phosphor | `size={12}` | |
| Utility (refresh, add) | Phosphor | `size={14}` | `weight="bold"` for action buttons |
| Chevrons / small indicators | Phosphor | `style={{ width: 13, height: 13 }}` | |

### Active-state indicator (left bar)

```tsx
<Box sx={{
  position: 'absolute',
  left: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  width: '2.5px',
  height: 16,
  borderRadius: '0 2px 2px 0',
  bgcolor: 'sidebar.indicator',
}} />
```

### Key rules

- **Never rely on MUI's default `minHeight`** on `ListItem` / `MenuItem` — it adds ~48px. Override explicitly or avoid those components in favour of plain `Box` rows.
- **Set `lineHeight` every time.** Omitting it inherits 1.5 from the theme and breaks compact rows.
- **Truncate long text** — always add `overflow: 'hidden'`, `textOverflow: 'ellipsis'`, `whiteSpace: 'nowrap'` on the text `Box`, and `minWidth: 0` on its flex parent so it can actually shrink.
- **`borderRadius: '8px'`** on all interactive row backgrounds for consistency (avatars use `10px`).
- **`userSelect: 'none'`** on non-interactive labels (section headers, group names).

### Reference implementations

- `src/components/layout/Sidebar.tsx` — nav items, section labels, user profile footer
- `src/components/layout/MobileDrawer.tsx` — identical density at 300px width
- `src/components/projects/ProjectsTree.tsx` — MUI `SimpleTreeView` with compact `TreeItem` labels

---

## Adding a New Feature Slice

1. Create `src/components/<feature>/` directory.
2. Use PascalCase filenames matching exported component names.
3. Add `'use client'` only where needed — split into server/client parts if a component is mostly static.
4. Define Zod schema in `src/lib/validations/<feature>.ts` before building forms.
5. Add tRPC router in `src/server/routers/<feature>.ts` and register in `src/server/root.ts`.
6. Update `claudedocs/codebase-overview.md` if the new slice changes the directory structure.
