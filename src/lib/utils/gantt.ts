export interface Selection {
  type: 'task' | 'folder';
  nodeId: string;
  taskId: string;
  folderName?: string;
  parentFolderName?: string;
  folderId?: string;
}

export function deriveStatus(percentDone: number) {
  if (percentDone >= 100) return { name: 'Completed', color: '#10b981' };
  if (percentDone > 0) return { name: 'In Progress', color: '#3b82f6' };
  return { name: 'Planned', color: '#6b7280' };
}
