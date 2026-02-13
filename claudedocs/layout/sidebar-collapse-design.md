# Sidebar & Mobile Navigation Design

## Overview

Simplify the sidebar by removing the hamburger menu on desktop. Add responsive mobile navigation with a dedicated mobile header and drawer.

## Current State

| Property | Value |
|----------|-------|
| Sidebar Width | Fixed 80px (`w-20`) |
| Navigation | Icon-only buttons |
| Hamburger | Non-functional (to be removed) |
| Mobile Support | None |

### Current Files
- `src/components/layout/Sidebar.tsx` - Sidebar component
- `src/app/(app)/layout.tsx` - App layout container
- `src/components/layout/Header.tsx` - Top header bar

---

## Design: Desktop vs Mobile

### Breakpoint Strategy

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px (`md`) | Mobile header + drawer |
| Desktop | >= 768px | Fixed sidebar (no hamburger) |

---

## Desktop Layout (>= 768px)

### Visual Layout

```
┌────────┬──────────────────────────────────────┐
│        │  Header (BuildTrack Pro + actions)   │
│  Side  ├──────────────────────────────────────┤
│  bar   │                                      │
│  80px  │         Main Content                 │
│        │                                      │
│  🏠    │                                      │
│  📊    │                                      │
│  ⚡    │                                      │
│  📋    │                                      │
└────────┴──────────────────────────────────────┘
```

### Desktop Sidebar Changes

- **Remove hamburger button** - not needed on desktop
- Keep fixed 80px width with icon-only navigation
- Navigation icons remain: Home, LayoutGrid, Zap, Clipboard
- Active state styling (dark background on current page)

---

## Mobile Layout (< 768px)

### Visual Layout - Default State

```
┌──────────────────────────────────────────────┐
│  ☰  BuildTrack Pro              🔍 👤  +     │
├──────────────────────────────────────────────┤
│                                              │
│              Main Content                    │
│           (full width, no sidebar)           │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

### Visual Layout - Drawer Open

```
┌──────────────────────────────────────────────┐
│  ✕  BuildTrack Pro              🔍 👤  +     │
├──────────────┬───────────────────────────────┤
│              │                               │
│  🏠 Dashboard│     Main Content              │
│  📊 Projects │     (dimmed overlay)          │
│  ⚡ Tasks    │                               │
│  📋 Reports  │                               │
│              │                               │
│   Drawer     │                               │
│   280px      │                               │
└──────────────┴───────────────────────────────┘
```

---

## Component Architecture

```
LayoutWrapper
├── Desktop (hidden md:flex)
│   ├── Sidebar (fixed 80px, no hamburger)
│   └── Content + Header
│
└── Mobile (flex md:hidden)
    ├── MobileHeader
    │   ├── Hamburger button
    │   ├── Logo
    │   └── Action buttons
    ├── MobileDrawer (conditional)
    │   ├── Close button
    │   ├── Nav items with labels
    │   └── Overlay backdrop
    └── Content (full width)
```

---

## Component Specifications

### MobileHeader

```typescript
interface MobileHeaderProps {
  onMenuOpen: () => void;
}

// Features:
// - Hamburger (Menu icon) on left
// - Logo + app name centered or left-aligned
// - Action buttons on right (search, avatar, add task)
// - Fixed at top of viewport
```

### MobileDrawer

```typescript
interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Features:
// - Slide in from left (transform translateX)
// - 280px width
// - Full height
// - Close button (X) at top
// - Nav items with icon + label
// - Backdrop overlay (click to close)
// - Body scroll lock when open
```

---

## Responsive Classes

### LayoutWrapper

```tsx
<div className="min-h-screen bg-[#e8e9f3]">
  {/* Desktop Layout */}
  <div className="hidden md:flex">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Header />
      <main>{children}</main>
    </div>
  </div>

  {/* Mobile Layout */}
  <div className="flex flex-col md:hidden">
    <MobileHeader onMenuOpen={() => setDrawerOpen(true)} />
    <main className="flex-1 p-4">{children}</main>
  </div>

  {/* Mobile Drawer */}
  {drawerOpen && (
    <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
  )}
</div>
```

### Sidebar (Desktop Only)

```tsx
// Remove hamburger button, keep nav icons only
<aside className="w-20 bg-[#d8d9e8] flex flex-col items-center py-6 gap-4">
  {/* No hamburger - removed */}

  <NavButton icon={Home} isActive href="/dashboard" />
  <NavButton icon={LayoutGrid} href="/projects" />
  <NavButton icon={Zap} href="/tasks" />
  <NavButton icon={Clipboard} href="/reports" />
</aside>
```

---

## Navigation Items (Shared)

```typescript
import { Home, LayoutGrid, Zap, Clipboard, type LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
  { id: 'projects', label: 'Projects', icon: LayoutGrid, href: '/projects' },
  { id: 'tasks', label: 'Tasks', icon: Zap, href: '/tasks' },
  { id: 'reports', label: 'Reports', icon: Clipboard, href: '/reports' },
];
```

---

## MobileDrawer Styling

```tsx
// Drawer container
<div className={`
  fixed inset-y-0 left-0 z-50 w-70 bg-[#d8d9e8]
  transform transition-transform duration-300 ease-out
  ${isOpen ? 'translate-x-0' : '-translate-x-full'}
`}>
  {/* Close button */}
  <button className="p-4">
    <X className="w-6 h-6" />
  </button>

  {/* Nav items with labels */}
  <nav className="flex flex-col gap-2 p-4">
    {navItems.map(item => (
      <a
        key={item.id}
        href={item.href}
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50"
      >
        <item.icon className="w-6 h-6" />
        <span>{item.label}</span>
      </a>
    ))}
  </nav>
</div>

// Backdrop overlay
{isOpen && (
  <div
    className="fixed inset-0 z-40 bg-black/30"
    onClick={onClose}
  />
)}
```

---

## Animation Guidelines

Use CSS transitions only (no Framer Motion entrance animations):

```css
/* Drawer slide */
.drawer {
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
}
.drawer.open {
  transform: translateX(0);
}

/* Backdrop fade */
.backdrop {
  opacity: 0;
  transition: opacity 200ms ease-out;
}
.backdrop.visible {
  opacity: 1;
}
```

---

## State Management

```typescript
// In LayoutWrapper
const [drawerOpen, setDrawerOpen] = useState(false);

// Close drawer on route change
const pathname = usePathname();
useEffect(() => {
  setDrawerOpen(false);
}, [pathname]);

// Lock body scroll when drawer open
useEffect(() => {
  if (drawerOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [drawerOpen]);
```

---

## Accessibility

| Feature | Implementation |
|---------|----------------|
| `aria-expanded` | On hamburger button |
| `aria-label` | "Open menu" / "Close menu" |
| Focus trap | Trap focus within drawer when open |
| Escape key | Close drawer on Escape press |
| Screen reader | Announce drawer state changes |

---

## Files to Modify

| File | Changes |
|------|---------|
| `Sidebar.tsx` | Remove hamburger button |
| `src/app/(app)/layout.tsx` | Add responsive layout, drawer state |
| `Header.tsx` | Hide on mobile (replaced by MobileHeader) |

## Files to Create

| File | Purpose |
|------|---------|
| `MobileHeader.tsx` | Mobile-only header with hamburger |
| `MobileDrawer.tsx` | Slide-out navigation drawer |

---

## Implementation Checklist

- [ ] Remove hamburger button from `Sidebar.tsx`
- [ ] Add `hidden md:flex` to desktop layout in `LayoutWrapper`
- [ ] Create `MobileHeader.tsx` component
- [ ] Create `MobileDrawer.tsx` component
- [ ] Add drawer state management to `LayoutWrapper`
- [ ] Add body scroll lock when drawer open
- [ ] Close drawer on route change
- [ ] Add escape key handler
- [ ] Test on mobile viewport sizes
- [ ] Verify desktop layout unchanged

---

## Breakpoint Reference

| Tailwind | Width | Usage |
|----------|-------|-------|
| `sm` | 640px | Small phones landscape |
| `md` | 768px | **Desktop/Mobile breakpoint** |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
