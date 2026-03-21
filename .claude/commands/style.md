---
name: style
description: "Project-aware UI development with automatic design system enforcement and component pattern guidance"
category: workflow
complexity: standard
---

# /style - Project Design System Development

> **Context Framework Note**: This behavioral instruction activates when users type `/style` patterns. It ensures all UI work follows the established design system — theme tokens, typography, spacing, icon conventions, and component patterns — producing consistent, production-grade interfaces.

## Triggers
- Any new UI component, page, or feature development
- Styling changes or visual refinements
- Layout modifications (sidebar, drawers, panels, dialogs)
- Component creation or restructuring
- Dark mode implementation or theme token usage

## Context Trigger Pattern
```
/style [task-description] [--scope sidebar|dialog|page|card|form|table|tree] [--review-only]
```

## Behavioral Flow

### Step 1: Read the Design System (MANDATORY)
Before making ANY UI changes, you MUST review these files:

1. **Theme tokens**: `src/theme/theme.ts` — MUI light/dark palettes with custom extensions
2. **CSS variables**: `src/styles/globals.css` — CSS custom properties for both themes
3. **Component guide**: `claudedocs/components-guide.md` — conventions, naming, structure
4. **Reference implementation**: `src/components/layout/Sidebar.tsx` — canonical compact density

### Step 2: Apply the Design System

#### Color Palette

**Light Theme Core**
| Token | Value | Usage |
|-------|-------|-------|
| `primary.main` | `#2B2D42` | Primary actions, active indicators |
| `background.default` | `#F0F0F3` | Page background |
| `background.paper` | `#FFFFFF` | Cards, panels |
| `text.primary` | `#1A1A2E` | Body text, headings |
| `text.secondary` | `#8D99AE` | Secondary/muted text |
| `text.disabled` | `#B0B8C4` | Disabled, section labels |
| `divider` | `#D9DBE1` | Borders, separators |
| `error.main` | `#D93C15` | Destructive actions |

**Dark Theme Core**
| Token | Value | Usage |
|-------|-------|-------|
| `primary.main` | `#4A90D9` | Primary actions |
| `background.default` | `#111111` | Page background |
| `background.paper` | `#1A1A1A` | Cards, panels |
| `text.primary` | `#FFFFFF` | Body text |
| `text.secondary` | `#B8B9B6` | Secondary text |
| `divider` | `#2E2E2E` | Borders |

**Custom Palette Extensions** — always access via `theme.palette.*`:
- `sidebar.*` — background, border, indicator, activeBg, hoverBg, activeItemBg
- `status.*` — active, inProgress, onHold, completed, archived (+ bg/text variants)
- `accent.*` — dark, gradientEnd (used for avatar gradients)
- `warm.*` — main, dark (amber accent)
- `docExplorer.*` — destructive variants, linkedGreen, badgeBg, aiPurple
- `card.background`, `input.background`

**CSS Variables** (use in non-MUI contexts or raw CSS):
```css
--accent-primary    --text-primary    --bg-primary
--sidebar-border    --sidebar-indicator    --sidebar-active-bg
--status-green      --status-amber    --status-red    --status-blue
--border-color      --border-light    --focus-ring
```

#### Typography

**Font**: `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif` — set in MUI theme. Never use Inter, Arial, Roboto, or other fonts directly.

**Scale** (compact density — used across sidebar, drawers, trees, panels):

| Role | fontSize | fontWeight | lineHeight | Notes |
|------|----------|------------|------------|-------|
| Section label (ALL CAPS) | `0.5625rem` (9px) | 600 | — | `letterSpacing: '0.12em'`, `textTransform: 'uppercase'`, `userSelect: 'none'` |
| Nav/tree item | `0.8125rem` (13px) | 400–500 | 1 | Active: `fontWeight: 550`, `letterSpacing: '-0.005em'` |
| Secondary/meta text | `0.6875rem` (11px) | 400–500 | 1.2 | Task counts, email, status labels |
| Document filename | `0.75rem`–`0.8rem` | 400 | — | Always truncate |

**Critical**: Always set `lineHeight` explicitly. MUI's default `1.5` breaks compact rows.

#### Spacing

```tsx
// Nav item row
sx={{ px: 1.25, py: 0.875, borderRadius: '8px' }}  // 10px / 7px

// Tree item label
sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.375 }}  // 3px vertical

// Gap between sibling nav rows
gap: '1px'

// Icon-to-label gaps
gap: 1       // 8px — tree items
gap: 1.25    // 10px — sidebar nav items
```

#### Icons

| Context | Library | Size | Notes |
|---------|---------|------|-------|
| Sidebar nav | Phosphor (`@phosphor-icons/react`) | `size={17}` | `weight={isActive ? 'fill' : 'regular'}` |
| Tree folders/tasks | Lucide (`lucide-react`) | `size={14}` | |
| Tree documents | Lucide | `size={12}` | |
| Utility (refresh, add) | Lucide | `size={14}` | |
| Chevrons/indicators | Lucide | `style={{ width: 13, height: 13 }}` | |
| MUI Button icons | Auto-sized by theme | 16px (default), 18px (lg), 14px (sm) | |

Lucide icons use `style={{ width: N, height: N }}` (not `sx`). Phosphor icons use the `size` prop.

#### Border Radius
- Interactive row backgrounds: `borderRadius: '8px'`
- Avatars: `borderRadius: '10px'`
- Buttons: `borderRadius: 4` (set in MUI theme)
- Global shape: `borderRadius: 8` (MUI theme default)

#### Active State Indicator (Sidebar Pattern)
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

#### Text Overflow (Always Apply on Long Text)
```tsx
sx={{
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}}
// Parent flex container needs: minWidth: 0
```

### Step 3: Follow Component Conventions

**Styling**: MUI `sx` prop is primary. Use theme tokens (`theme.palette.*`, `'text.primary'`, `'divider'`). CSS variables for one-off non-MUI elements. No CSS modules, no Tailwind on MUI components, no hardcoded hex colors.

**UI Primitives** (from `src/components/ui/`):
| Component | When to use |
|-----------|-------------|
| `Button` | Actions — variants: `default`, `outline`, `ghost`, `destructive`; `loading` prop |
| `DropdownMenu` | Action menus with `asChild` support |
| `Sheet` | Slide-in panels |
| `Label` | Accessible form labels |
| `LoadingSpinner` | Loading states — `size="lg" fullScreen` for page-level |
| `ImageWithFallback` / `OptimizedImage` | Always use over bare `<img>` |
| `FileDropzone` | File upload areas |
| `UploadOverlay` | Upload progress — variants: `dark` (image), `light` (form) |
| `OtpInput` | OTP verification input |

For MUI components without a `ui/` wrapper, use MUI directly. Don't create wrappers unless used in 3+ places.

**Forms**: `react-hook-form` + `zodResolver` + Zod schema from `src/lib/validations/`. Wrap MUI inputs with `Controller`.

**Data fetching**: tRPC hooks (`api.feature.list.useQuery()`). Never `fetch()` in client components.

### Step 4: Validate Your Work

After implementing UI changes:
- [ ] All colors use theme tokens or CSS variables (no hardcoded hex)
- [ ] Typography uses Geist Sans via theme (never set `fontFamily` directly)
- [ ] `lineHeight` is set explicitly on compact rows
- [ ] Long text has overflow/ellipsis handling
- [ ] Icons use correct library (Phosphor for nav, Lucide for utility)
- [ ] Both light and dark themes work (test with `.dark` class)
- [ ] `'use client'` only where needed (hooks, events, browser APIs)
- [ ] No MUI default `minHeight` on ListItem/MenuItem in compact areas
- [ ] Interactive rows have `borderRadius: '8px'`

## Anti-Patterns — Do NOT

| Don't | Do instead |
|-------|-----------|
| Hardcoded hex colors (`#fff`, `#333`) | Theme tokens (`'background.paper'`, `'text.primary'`) |
| `fontFamily: 'Inter'` or any direct font | Let theme handle it (already set to Geist Sans) |
| MUI default `minHeight` on list items | Override or use plain `Box` rows |
| Omit `lineHeight` on compact text | Always set `lineHeight: 1` or `1.2` |
| CSS modules or Tailwind on MUI | `sx` prop with theme tokens |
| `<img>` tags | `ImageWithFallback` or `OptimizedImage` |
| New providers for feature state | Zustand stores in `src/store/` |
| Icons without correct sizing | Follow icon size table above |
| Random aesthetic choices | Follow established patterns from Sidebar, MobileDrawer, ProjectsTree |
| Purple gradients, Inter font, generic AI aesthetics | Project's navy (`#2B2D42`) / blue (`#4A90D9`) palette with Geist Sans |

## Key Reference Files

| File | What it provides |
|------|------------------|
| `src/theme/theme.ts` | Complete MUI light + dark theme with all custom palette extensions |
| `src/styles/globals.css` | CSS custom properties for both themes, Gantt/Bryntum overrides |
| `src/components/layout/Sidebar.tsx` | Canonical compact density: spacing, typography, active states |
| `src/components/layout/MobileDrawer.tsx` | Same density at 300px width |
| `src/components/projects/ProjectsTree.tsx` | SimpleTreeView with compact TreeItem labels |
| `src/components/ui/` | Shared design primitives |
| `claudedocs/components-guide.md` | Full component conventions, naming, directory structure |

## Examples

### Build a New Settings Page
```
/style create an organization settings page with profile, billing, and danger zone sections
# 1. Read theme.ts and components-guide.md
# 2. Use MUI sx with theme tokens throughout
# 3. Follow page layout patterns from existing pages
# 4. Use ui/Button destructive variant for danger zone
# 5. Validate dark mode support
```

### Add a Status Badge Component
```
/style create a reusable status badge for project cards
# 1. Read status tokens from theme.ts (status.active, status.activeBg, etc.)
# 2. Use compact typography (0.6875rem, fontWeight 500)
# 3. Follow existing badge patterns in the codebase
# 4. Support all 5 statuses: active, inProgress, onHold, completed, archived
```

### Redesign a Dialog
```
/style improve the invite member dialog styling --scope dialog
# 1. Read existing dialog implementations
# 2. Follow form patterns (react-hook-form + zodResolver)
# 3. Use ui/Button variants, MUI TextField with Controller
# 4. Ensure consistent border radius, spacing, and typography
```

## Boundaries

**Will:**
- Always read theme.ts and globals.css before making UI changes
- Follow the existing design system exactly
- Use theme tokens for all colors and the established typography scale
- Match compact density patterns for sidebar/drawer/tree contexts
- Support both light and dark themes
- Follow `claudedocs/components-guide.md` directory and naming conventions

**Will Not:**
- Introduce new fonts, color palettes, or design aesthetics
- Use hardcoded colors, CSS modules, or Tailwind on MUI components
- Create new context providers for feature-scoped state
- Add UI primitives to `ui/` unless used in 3+ places
- Make bold/creative/unexpected design choices that deviate from the established system
- Ignore dark mode support
