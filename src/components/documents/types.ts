export interface DocumentResult {
  id: string;
  name: string;
  blobUrl: string;
  mimeType: string;
  size: number;
  tags: string[];
  description: string;
  taskId: string | null;
  folderId: string | null;
  projectId: string;
  uploadedById: string;
  createdAt: Date;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
}
