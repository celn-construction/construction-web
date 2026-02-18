export interface Selection {
  type: 'task' | 'folder' | 'document';
  nodeId: string;
  taskId: string;
  folderName?: string;
  parentFolderName?: string;
  folderId?: string;
  documentId?: string;
  documentName?: string;
  blobUrl?: string;
  mimeType?: string;
}

export function deriveStatus(percentDone: number) {
  if (percentDone >= 100) return { name: 'Completed', color: '#10b981' };
  if (percentDone > 0) return { name: 'In Progress', color: '#3b82f6' };
  return { name: 'Planned', color: '#6b7280' };
}
