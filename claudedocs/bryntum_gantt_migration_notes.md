# Bryntum Gantt Migration Notes

## Completed Migration

The Bryntum Gantt chart has been successfully migrated from static JSON data to a full database-backed system.

### What Was Migrated

1. **Database Schema** (`prisma/schema.prisma`)
   - Added `activeProjectId` to User model
   - Extended Project model with Gantt configuration fields (template, calendar, hoursPerDay, etc.)
   - Created new models: GanttTask, GanttDependency, GanttResource, GanttAssignment, GanttTimeRange
   - All models have proper indexes and CASCADE relationships

2. **Backend Architecture**
   - **tRPC Router** (`src/server/api/routers/gantt.ts`): `load` and `sync` procedures
   - **API Bridge Routes** (`src/app/api/gantt/load`, `/sync`): HTTP endpoints for Bryntum CrudManager
   - **Helper Functions**:
     - `ganttTree.ts`: Tree builder + field mappers (DB ↔ Bryntum format)
     - `ganttSync.ts`: CRUD operations with phantom ID resolution
     - `getActiveProject.ts`: Active project resolution logic
   - **Template System** (`src/server/gantt/templates/index.ts`): Extensible project templates

3. **Project Router Extensions**
   - `getActive`: Returns user's active project with org validation
   - `setActive`: Sets user's active project and persists to DB
   - `create`: Now accepts template, seeds template data, sets as active project

4. **Frontend Integration**
   - **Project-Scoped Route**: `/projects/[projectId]/gantt` replaces `/bryntum`
   - **BryntumGanttWrapper**: Accepts `projectId` prop, configures transport URLs
   - **ganttConfig**: Supports both static (demo) and DB-backed modes
   - **Header**: Project switcher uses tRPC `setActive` + `router.push` instead of Zustand
   - **AddProjectDialog**: Creates project with template, navigates to Gantt page

### What Was Removed

- `public/data/bryntum-sample.json` - Static demo data
- `src/app/(dashboard)/bryntum/page.tsx` - Old static Gantt route
- Gantt nav item from `navItems.ts` (now project-scoped, access via project switcher)

### What Was Intentionally Left

The following files/components were left in place because they serve a different purpose (construction phases tree view, not Gantt):

- `src/store/useConstructionStore.ts` - Powers the ProjectsTree phases view
- `src/store/hooks/useGanttFeatures.ts` - Used by ProjectsTree
- `src/store/hooks/useFeatureActions.ts` - Used by ProjectDetailPanel
- `src/types/gantt-types.ts` - Type definitions for the phases view
- `src/components/projects/ProjectsTree.tsx` - Construction phases tree
- `src/components/projects/ProjectDetailPanel.tsx` - Phase detail panel
- `src/app/(dashboard)/projects/page.tsx` - Projects split view

These components represent a separate "construction phases" feature distinct from the Gantt chart. They use Zustand for local state and should be evaluated separately for potential migration.

## Data Flow

```
Browser (Bryntum CrudManager)
  ├─ GET  /api/gantt/load?projectId=xxx
  │   └─ Next.js Route → tRPC ganttRouter.load → DB query → Tree builder → Response
  └─ POST /api/gantt/sync?projectId=xxx
      └─ Next.js Route → tRPC ganttRouter.sync → Transaction → CRUD operations → Response
```

## Key Features

1. **Project-Scoped**: Each project has its own Gantt data
2. **Active Project Tracking**: User's last visited project persists in DB
3. **Template System**: Extensible project templates (currently only BLANK)
4. **Hierarchical Tasks**: Parent-child relationships with tree rendering
5. **Auto-Sync**: Changes automatically save to DB
6. **Phantom ID Resolution**: New records created rapidly get proper DB IDs
7. **Transaction Safety**: All sync operations wrapped in DB transaction

## Future Enhancements

1. Add more project templates (Residential, Commercial, etc.)
2. Add project overview route (`/projects/[projectId]/overview`)
3. Make navigation project-aware (dynamic Gantt link based on active project)
4. Migrate construction phases view to DB-backed system
5. Add project-level permissions and access control
6. Implement project archiving/deletion workflows
