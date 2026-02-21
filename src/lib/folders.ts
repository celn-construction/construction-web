// Static construction document folder structure (same for every project)
// Source of truth for both frontend UI and backend search filtering.
// Move to a DB table if orgs ever need custom folder categories.

interface FolderChild {
  id: string;
  name: string;
}

export interface Folder {
  id: string;
  name: string;
  isLeaf: boolean;
  children?: FolderChild[];
}

export const folderData: Folder[] = [
  {
    id: 'rfi',
    name: 'RFI',
    isLeaf: true,
  },
  {
    id: 'submittals',
    name: 'Submittals',
    isLeaf: false,
    children: [
      { id: 'submittals-product', name: 'Product Data' },
      { id: 'submittals-shop', name: 'Shop Drawings' },
      { id: 'submittals-certs', name: 'Certs' },
    ],
  },
  {
    id: 'change-orders',
    name: 'Change Orders',
    isLeaf: true,
  },
  {
    id: 'photos',
    name: 'Photos',
    isLeaf: true,
  },
  {
    id: 'inspections',
    name: 'Inspections',
    isLeaf: false,
    children: [
      { id: 'inspections-structural', name: 'Structural' },
      { id: 'inspections-mep', name: 'MEP' },
      { id: 'inspections-safety', name: 'Safety' },
    ],
  },
];

/**
 * Expands a top-level folder ID into all folder IDs it covers (itself + children).
 * e.g. expandFolderIds('submittals') → ['submittals', 'submittals-product', 'submittals-shop', 'submittals-certs']
 */
export function expandFolderIds(topLevelId: string): string[] {
  const folder = folderData.find((f) => f.id === topLevelId);
  if (!folder) return [topLevelId];
  const childIds = folder.children ? folder.children.map((c) => c.id) : [];
  return [topLevelId, ...childIds];
}
