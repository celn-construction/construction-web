import { folderData } from '@/lib/folders';

export function getCategoryLabel(folderId: string): string {
  for (const folder of folderData) {
    if (folder.id === folderId) return folder.name;
    if (folder.children) {
      const child = folder.children.find((c) => c.id === folderId);
      if (child) return child.name;
    }
  }
  return folderId;
}
