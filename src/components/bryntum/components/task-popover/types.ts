export interface PreviewDoc {
  id: string;
  name: string;
  blobUrl: string;
  mimeType: string;
  size: number;
  createdAt: string | Date;
  uploadedBy: { name: string | null } | null;
}

export interface DocumentItem {
  id: string;
  name: string;
  blobUrl: string;
  mimeType: string;
  size: number;
  folderId: string;
  createdAt: Date;
  uploadedBy: { name: string | null } | null;
}

export interface FolderContentProps {
  docs: DocumentItem[];
  onSelectDoc: (doc: PreviewDoc) => void;
  selectedDocId: string | null;
  onUpload: () => void;
  folderName: string;
}
