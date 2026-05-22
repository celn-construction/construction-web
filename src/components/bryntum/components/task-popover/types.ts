export interface ApprovedByUser {
  id: string;
  name: string | null;
  email?: string;
}

export interface PreviewDoc {
  id: string;
  name: string;
  blobUrl: string;
  mimeType: string;
  size: number;
  createdAt: string | Date;
  uploadedBy: { name: string | null } | null;
  folderId: string;
  approvalStatus: string;
  approvedAt: Date | string | null;
  approvedBy: ApprovedByUser | null;
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
  approvalStatus: string;
  approvedAt: Date | string | null;
  approvedBy: ApprovedByUser | null;
}

export interface FolderContentProps {
  docs: DocumentItem[];
  onSelectDoc: (doc: PreviewDoc) => void;
  selectedDocId: string | null;
  /**
   * Open the upload dialog for this folder. Pass a `slotId` to bind the
   * upload to a specific slot (per-slot upload button on a trackable folder);
   * omit it to let the server auto-link to the first empty slot.
   */
  onUpload: (slotId?: string) => void;
  folderName: string;
  // Optional pin context — only consumed by the Photos folder
  projectId?: string;
  taskId?: string;
  organizationId?: string;
  pinnedDocId?: string | null;
  // Approval context — only consumed by trackable folders (submittals, inspections)
  memberRole?: string;
}
