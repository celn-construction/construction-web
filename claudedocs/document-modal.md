# Document Management Modal

## Overview

The SplitViewModal is a comprehensive document management interface for construction tasks. It provides a split-view interface with a folder tree on the left and document details on the right, allowing users to organize and manage construction documents, photos, submittals, and RFIs.

## Location

```
src/components/gantt/document-modal/
├── variants/
│   └── SplitViewModal.tsx      # Main modal component
├── types.ts                     # TypeScript type definitions
├── mockData.ts                  # Sample data structure
└── index.ts                     # Barrel exports
```

## Component Structure

### SplitViewModal

**Path:** `src/components/gantt/document-modal/variants/SplitViewModal.tsx`

A full-screen modal with a two-panel layout for managing construction documents.

**Props:**
```typescript
interface DocumentModalWithTaskProps {
  category: {
    name: string;
    folders: Folder[];
  };
  feature: GanttFeature;  // Task/feature information
  group: string;          // Group name
  onCoverImageChange?: (featureId: string, coverImage: string | undefined) => void;
  onDelete?: (featureId: string) => void;
}
```

**Features:**
- **Left Panel:** Folder tree navigation with expandable/collapsible folders
- **Right Panel:** Document list with upload, download, and management actions
- **Task Info Bar:** Shows task name, dates, duration, and status
- **File Type Support:** PDF, images (JPG/PNG), DWG files
- **Document Actions:** Upload, download, delete, set as cover image
- **Status Indicators:** Color-coded status badges (approved, pending, revision, submitted, overdue)

## Key Components

### TreeItem

Reusable tree item component for folder navigation.

**Props:**
- `label` - Folder/item name
- `icon` - Custom icon component
- `count` - Number of items in folder
- `isSelected` - Selected state
- `isExpanded` - Expanded state
- `hasChildren` - Whether item has children
- `depth` - Nesting level for indentation
- `onToggle` - Expand/collapse handler
- `onSelect` - Selection handler

### DocumentItem

Individual document row in the document list.

**Props:**
- `doc` - Document data
- `onDownload` - Download handler
- `onDelete` - Delete handler
- `onSetCover` - Set as cover image handler

## Data Types

### Folder Structure

```typescript
interface Folder {
  id: string;
  name: string;
  icon?: string;           // Icon name (e.g., 'clipboard-list', 'folder-open')
  subFolders: SubFolder[];
}

interface SubFolder {
  id: string;
  name: string;
  icon?: string;
  documents: Document[];
}

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'jpg' | 'png' | 'dwg';
  size: string;            // Human-readable size (e.g., '2.4 MB')
  date: Date;              // Upload/modification date
  status: 'approved' | 'pending' | 'revision' | 'submitted' | 'overdue';
  uploader: string;        // User who uploaded
}
```

### Category Structure

```typescript
interface Category {
  name: string;      // e.g., 'Earthwork'
  folders: Folder[];
}
```

## Supported Folder Icons

The modal supports the following Lucide icons for folders:
- `clipboard-list` - ClipboardList
- `folder-open` - FolderOpen
- `file-pen` - FilePen
- `camera` - Camera
- `clipboard-check` - ClipboardCheck
- `file` - FileIcon

## Supported File Types

- **PDF** - Red icon, FileText
- **JPG/PNG** - Blue icon, Image
- **DWG** - Purple icon, File
- **Other** - Gray icon, File

## Status Colors

- **Approved** - Green (`bg-green-500/10`, `text-green-500`)
- **Pending** - Yellow (`bg-yellow-500/10`, `text-yellow-500`)
- **Revision** - Orange (`bg-orange-500/10`, `text-orange-500`)
- **Submitted** - Blue (`bg-blue-500/10`, `text-blue-500`)
- **Overdue** - Red (`bg-red-500/10`, `text-red-500`)

## Usage Example

### Basic Usage

```tsx
import { SplitViewModal } from '@/components/gantt/document-modal';

// Sample category data
const earthworkCategory = {
  name: 'Earthwork',
  folders: [
    {
      id: 'submittals',
      name: 'Submittals',
      icon: 'clipboard-list',
      subFolders: [
        {
          id: 'soil-reports',
          name: 'Soil Reports',
          documents: [
            {
              id: 'doc-1',
              name: 'Geotechnical Report.pdf',
              type: 'pdf',
              size: '2.4 MB',
              date: new Date('2024-01-15'),
              status: 'approved',
              uploader: 'John Smith',
            },
          ],
        },
      ],
    },
  ],
};

// Usage in component
<SplitViewModal
  category={earthworkCategory}
  feature={currentFeature}
  group={groupName}
  onCoverImageChange={(featureId, coverImage) => {
    // Handle cover image update
  }}
  onDelete={(featureId) => {
    // Handle task deletion
  }}
/>
```

### With TimelineBarPopover Wrapper

```tsx
import TimelineBarPopover from '@/components/gantt/TimelineBarPopover';

<TimelineBarPopover
  feature={feature}
  group={groupName}
  onCoverImageChange={handleCoverImageChange}
  onDelete={handleDelete}
/>
```

## Features in Detail

### Folder Navigation

- **Expandable Tree:** Click folder names to expand/collapse
- **Visual Indicators:** ChevronRight/ChevronDown icons show expansion state
- **Document Count:** Badge shows number of documents in each folder
- **Nested Structure:** Supports unlimited folder depth with proper indentation

### Document Management

- **Upload:** Click "Upload" button to add new documents
- **Download:** Click download icon to save documents
- **Delete:** Click trash icon to remove documents
- **Set Cover:** Click "Set as cover" to use image as task cover
- **Visual Preview:** File type icons and status badges

### Task Information Bar

Shows at the top of the modal:
- **Task Name** - Bold, large text
- **Dates** - Start and end dates with calendar icon
- **Duration** - Calculated days between start and end
- **Status** - Color-coded status badge
- **Group** - Task group/category

### Responsive Design

- Full-screen modal overlay
- Split-panel layout with proportional sizing
- Scrollable panels for long lists
- Dark mode support with theme variables

## Styling

Uses Tailwind CSS with dark mode support:
- Background: `bg-white dark:bg-[var(--bg-card)]`
- Borders: `border-gray-200 dark:border-[var(--border-color)]`
- Text: `text-gray-900 dark:text-white`
- Hover states: Interactive elements with hover effects

## Integration Points

### With Gantt Chart

Originally designed for custom Gantt chart integration:
- Triggered from timeline bar click/interaction
- Receives task/feature data from Gantt store
- Updates cover images on Gantt timeline bars

### With SVAR Gantt

Can be adapted for SVAR Gantt by:
- Mapping SVAR task format to GanttFeature format
- Triggering modal from SVAR task click events
- Updating SVAR tasks with cover image changes

## Mock Data

Sample data structure is provided in `mockData.ts`:

```typescript
export const earthworkCategory = {
  name: 'Earthwork',
  folders: [
    // Submittals folder with soil reports, equipment specs, etc.
    // Daily Reports folder with progress logs, site photos, etc.
    // RFIs folder with clarifications and responses
    // Testing folder with lab results and certifications
  ],
};
```

## Future Enhancements

Potential improvements:
- Real file upload/download API integration
- Document version history
- Search and filter functionality
- Bulk document operations
- Document preview/viewer
- Comments and annotations
- Permission-based access control
- Document templates

## Dependencies

- **Lucide React** - Icon library
- **Tailwind CSS** - Styling
- **@/components/ui/dropdown-menu** - Dropdown menus for actions

## Notes

- Currently uses mock data; requires backend integration for production
- File upload/download are placeholder functions
- Cover image updates work via callback props
- Fully memoized for performance optimization
