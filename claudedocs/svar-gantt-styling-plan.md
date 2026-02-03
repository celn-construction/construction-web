# SVAR Gantt Chart Styling Plan

## Objective
Make the SVAR Gantt chart (`/dashboard/svar-gantt`) visually match the custom Gantt chart on the main dashboard, including adding a Quick Add toolbar for rapid task creation.

---

## Current State Analysis

### Custom Gantt (Main Dashboard)
**Location:** `src/components/ui/gantt.tsx` + `src/components/ui/gantt/`

**Key Visual Features:**
- Clean, minimal design with subtle borders
- Sidebar with task list (sticky positioning)
- Staging zone for unscheduled tasks
- Drag-and-drop with visual feedback (blue highlight)
- Today marker (blue pill with date tooltip)
- Row hover effects with smooth transitions
- Status color indicators (colored dots)
- Dark mode support via CSS variables
- Custom scrollbars
- Framer Motion animations
- Context menus for actions

**Styling Approach:**
- Tailwind CSS with dark mode variants
- CSS variables: `--bg-card`, `--bg-primary`, `--text-primary`, `--border-color`, `--accent-purple`
- Row height: `var(--gantt-row-height)`
- Header height: `var(--gantt-header-height)`
- Sidebar width: `var(--gantt-sidebar-width)`

### SVAR Gantt (Current)
**Location:** `src/components/gantt/SVARGanttChart.tsx`

**Current Styling:**
- Uses `@svar-ui/react-gantt` library
- Custom CSS in `/public/css/svar-gantt-custom.css`
- Already has dark mode variables mapped
- Basic theme overrides in place

---

## Gap Analysis

| Feature | Custom Gantt | SVAR Gantt | Action Needed |
|---------|-------------|------------|---------------|
| Task bar style | Rounded, colored by status | Generic bars | Style task bars |
| Sidebar | Custom with status dots | Default grid | Customize columns |
| **Quick Add toolbar** | **Staging zone with Add button** | **None** | **Add Quick Add toolbar** |
| Today marker | Blue pill + line | Basic line | Style marker |
| Drag feedback | Blue dashed outline | Default | Enhance drag states |
| Hover effects | Scale + shadow | Basic hover | Add hover transitions |
| Row dividers | Subtle gray lines | Default | Match border colors |
| Header style | Sticky, minimal | Default | Style header |
| Animations | Framer Motion | None | Add CSS transitions |

---

## Implementation Plan

### Phase 0: Quick Add Toolbar (NEW - HIGH PRIORITY)
**Estimated Effort:** Medium
**Priority:** HIGH - Implements core functionality parity

#### 0.1 Overview

Add a Quick Add toolbar above the SVAR Gantt chart that allows users to rapidly create new tasks. Unlike the custom Gantt's drag-from-staging approach, this will use a simpler "click to add" pattern since SVAR has its own internal drag system.

#### 0.2 Feature Requirements

```
┌─────────────────────────────────────────────────────────────────────┐
│ Quick Add                                                           │
│ ┌─────────────┐  ┌─────────────────┐  ┌──────────────┐  [+ Add Task]│
│ │ Group:  ▼   │  │ Status:     ▼   │  │ Duration: 7d │             │
│ └─────────────┘  └─────────────────┘  └──────────────┘             │
├─────────────────────────────────────────────────────────────────────┤
│ SVAR Gantt Chart                                                    │
│ ...                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Toolbar Elements:**
1. **Group Selector** - Dropdown to choose task group (Foundation, Structural, MEP, Finishing)
2. **Status Selector** - Dropdown to choose initial status (Planned, In Progress, Completed)
3. **Duration Input** - Number input for task duration in days (default: 7)
4. **Add Task Button** - Creates task at today's date with selected options

#### 0.3 Technical Architecture

**Data Flow:**
```
User clicks "Add Task"
    ↓
Create GanttFeature object:
  - id: `task-${Date.now()}`
  - name: `New Task #${counter}`
  - group: selected group
  - status: selected status
  - startAt: today
  - endAt: today + duration days
  - progress: 0
    ↓
Call useFeatureActions().add(feature)
    ↓
Store updates → SVAR Gantt re-renders with new task
```

**Store Integration:**
- Uses existing `useConstructionStore` via `useFeatureActions` hook
- `addFeature` action already exists and handles state updates
- Features are persisted to localStorage automatically

**Existing Infrastructure:**
```typescript
// From src/store/hooks/useFeatureActions.ts
interface FeatureActions {
  add: (feature: GanttFeature) => void;      // ← Use this
  update: (id: FeatureId, updates: Partial<GanttFeature>) => void;
  remove: (id: FeatureId) => void;
  move: (id: FeatureId, startAt: Date, endAt: Date, targetRow?: number) => void;
  // ...
}

// From src/store/useConstructionStore.ts
const DEFAULT_GROUPS = [
  'Foundation & Site Work',
  'Structural Work',
  'MEP (Mechanical, Electrical, Plumbing)',
  'Finishing & Inspection',
];

const DEFAULT_STATUSES = {
  completed: { id: 'completed', name: 'Completed', color: '#10b981' },
  'in-progress': { id: 'in-progress', name: 'In Progress', color: '#3b82f6' },
  planned: { id: 'planned', name: 'Planned', color: '#6b7280' },
};
```

#### 0.4 Component Design

**New File:** `src/components/gantt/SVARQuickAddToolbar.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useFeatureActions, useGroups, useStatuses } from '@/store/hooks';
import type { GanttFeature, GanttStatus } from '@/components/ui/gantt/types';

interface SVARQuickAddToolbarProps {
  taskCount: number; // For generating unique names
}

export function SVARQuickAddToolbar({ taskCount }: SVARQuickAddToolbarProps) {
  const { add: addFeature } = useFeatureActions();
  const groups = useGroups();
  const statuses = useStatuses();

  const [selectedGroup, setSelectedGroup] = useState(groups[0]);
  const [selectedStatus, setSelectedStatus] = useState<GanttStatus>(statuses['planned']);
  const [duration, setDuration] = useState(7);

  const handleAddTask = () => {
    const today = new Date();
    const newFeature: GanttFeature = {
      id: `task-${Date.now()}`,
      name: `New Task #${taskCount + 1}`,
      group: selectedGroup,
      status: selectedStatus,
      startAt: today,
      endAt: addDays(today, duration),
      progress: 0,
    };
    addFeature(newFeature);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 dark:bg-blue-950/30 border-b border-dashed border-blue-200 dark:border-blue-800">
      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
        Quick Add
      </span>

      {/* Group Selector */}
      <select
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
        className="..."
      >
        {groups.map(group => (
          <option key={group} value={group}>{group}</option>
        ))}
      </select>

      {/* Status Selector */}
      <select
        value={selectedStatus.id}
        onChange={(e) => setSelectedStatus(statuses[e.target.value])}
        className="..."
      >
        {Object.values(statuses).map(status => (
          <option key={status.id} value={status.id}>{status.name}</option>
        ))}
      </select>

      {/* Duration Input */}
      <input
        type="number"
        min={1}
        max={365}
        value={duration}
        onChange={(e) => setDuration(parseInt(e.target.value) || 7)}
        className="..."
      />
      <span className="text-xs text-gray-500">days</span>

      {/* Add Button */}
      <Button onClick={handleAddTask} size="sm" className="gap-1">
        <Plus className="h-4 w-4" />
        Add Task
      </Button>
    </div>
  );
}
```

#### 0.5 Page Integration

**Update:** `src/app/dashboard/svar-gantt/page.tsx`

```typescript
// Add import
import { SVARQuickAddToolbar } from '@/components/gantt/SVARQuickAddToolbar';

// In the component, add toolbar above chart:
<div className="flex-1 p-4 overflow-hidden flex flex-col">
  {/* Quick Add Toolbar */}
  <SVARQuickAddToolbar taskCount={allFeaturesWithIndex.length} />

  {/* SVAR Gantt Chart */}
  <div className="flex-1">
    <SVARGanttChart ... />
  </div>
</div>
```

#### 0.6 Styling Specifications

**Toolbar Container:**
```css
/* Match staging zone style from custom Gantt */
.quick-add-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 246, 255, 0.5);  /* blue-50/50 */
  border-bottom: 2px dashed rgb(191, 219, 254);  /* blue-200 */
}

.dark .quick-add-toolbar {
  background: rgba(23, 37, 84, 0.3);  /* blue-950/30 */
  border-color: rgb(30, 58, 138);  /* blue-800 */
}
```

**Select Dropdowns:**
```css
/* Compact, rounded selects matching app design */
.quick-add-select {
  height: 32px;
  padding: 0 0.75rem;
  font-size: 12px;
  border-radius: 6px;
  background: white;
  border: 1px solid #e5e7eb;
}

.dark .quick-add-select {
  background: var(--bg-input);
  border-color: var(--border-color);
  color: var(--text-primary);
}
```

**Add Button:**
```css
/* Blue accent button */
.quick-add-button {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.quick-add-button:hover {
  background: #2563eb;
}
```

#### 0.7 Enhanced Features (Optional)

**Inline Name Editing:**
After adding, allow quick rename:
```typescript
const [editingId, setEditingId] = useState<string | null>(null);

const handleAddTask = () => {
  const id = `task-${Date.now()}`;
  // ... create feature
  addFeature(newFeature);
  setEditingId(id); // Open inline editor
};
```

**Keyboard Shortcut:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      handleAddTask();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleAddTask]);
```

**Toast Notification:**
```typescript
import { toast } from 'sonner';

const handleAddTask = () => {
  // ... create feature
  addFeature(newFeature);
  toast.success(`Created "${newFeature.name}"`, {
    description: `${selectedGroup} • Starts today`,
  });
};
```

#### 0.8 Testing Checklist

- [ ] Add Task creates feature with correct properties
- [ ] New task appears immediately in SVAR Gantt
- [ ] Group selector shows all 4 default groups
- [ ] Status selector shows all 3 statuses with colors
- [ ] Duration input validates (min 1, max 365)
- [ ] Persists to localStorage correctly
- [ ] Works in both light and dark mode
- [ ] Keyboard shortcut (Cmd/Ctrl+N) works
- [ ] Toast notification appears on add

---

### Phase 1: CSS Variable Alignment
**Estimated Effort:** Low

1. Update `/public/css/svar-gantt-custom.css` to use the same CSS variables as custom Gantt
2. Map SVAR variables to app theme variables:
   ```css
   --wx-gantt-bg: var(--bg-card);
   --wx-gantt-border-color: var(--border-color);
   --wx-color-font: var(--text-primary);
   ```

### Phase 2: Task Bar Styling
**Estimated Effort:** Medium

1. Style task bars to be rounded with subtle shadows
2. Add status-based coloring (need to pass status to SVAR)
3. Add hover effects (scale, shadow)
4. Style progress bars inside tasks

**CSS Changes:**
```css
.wx-gantt .wx-task-bar {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}
.wx-gantt .wx-task-bar:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

### Phase 3: Header & Sidebar
**Estimated Effort:** Medium

1. Style header to match custom Gantt's sticky header
2. Add "Issues" label styling
3. Configure columns to show task name with status dot
4. Style scale headers (month/day)

### Phase 4: Interactive States
**Estimated Effort:** Medium

1. Style drag ghost element
2. Add drop zone indicators
3. Style selected/active rows
4. Add keyboard focus states

### Phase 5: Today Marker
**Estimated Effort:** Low

1. Style today marker line to be blue
2. Add pill-style label at top

---

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/gantt/SVARQuickAddToolbar.tsx` | **CREATE** | New Quick Add toolbar component |
| `src/app/dashboard/svar-gantt/page.tsx` | MODIFY | Integrate Quick Add toolbar |
| `/public/css/svar-gantt-custom.css` | MODIFY | Main styling overrides |
| `src/components/gantt/SVARGanttChart.tsx` | MODIFY | Component props/config |

---

## Priority Recommendation (Updated)

**High Priority (do first):**
1. **Phase 0: Quick Add Toolbar** ← NEW, enables rapid task creation
2. Phase 1: CSS variable alignment
3. Phase 2: Task bar styling

**Medium Priority:**
4. Phase 5: Today marker
5. Phase 3: Header & sidebar
6. Phase 4: Interactive states

---

## Alternative Approach

If SVAR Gantt proves too difficult to style consistently, consider:
1. Extend the custom Gantt with SVAR's features (links, dependencies)
2. Use SVAR only for dependency management, custom Gantt for display
3. Replace SVAR with another library that's more themeable

---

## Success Criteria (Updated)

- [ ] **Quick Add toolbar allows creating tasks with one click**
- [ ] **New tasks appear immediately in SVAR Gantt**
- [ ] **Group and status can be selected before adding**
- [ ] Task bars have same rounded style with hover effects
- [ ] Colors match in both light and dark mode
- [ ] Today marker is styled consistently
- [ ] Header and sidebar match visual weight
- [ ] Transitions feel smooth and consistent
- [ ] No jarring visual differences when switching between views

---

## Implementation Order

```
1. Create SVARQuickAddToolbar.tsx component
2. Add toolbar to svar-gantt/page.tsx
3. Test add functionality works with store
4. Style toolbar to match staging zone aesthetic
5. Add optional enhancements (toast, keyboard shortcut)
6. Proceed with CSS styling phases
```
