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

/**
 * Navigation context passed alongside a selected doc so the preview dialog can
 * step through siblings (‹ / ›, ←/→) without closing. `siblings` is the ordered
 * set the clicked doc belongs to (and includes it); `approvable` shows the
 * in-header approve toggle (trackable submittal/inspection folders only).
 */
export interface PreviewNav {
  siblings: PreviewDoc[];
  approvable?: boolean;
}

export interface FolderContentProps {
  docs: DocumentItem[];
  onSelectDoc: (doc: PreviewDoc, nav?: PreviewNav) => void;
  selectedDocId: string | null;
  /**
   * Open the upload dialog for this folder. Pass a `slotId` to bind the
   * upload to a specific slot (per-slot upload button on a trackable folder);
   * omit it to let the server auto-link to the first empty slot.
   */
  onUpload: (slotId?: string) => void;
  /**
   * Direct file upload bound to a specific slot — bypasses the dialog and
   * routes through trackUpload so the global chip shows progress. Used by
   * per-slot drag-and-drop on trackable folders.
   */
  onUploadFile?: (slotId: string, file: File) => void;
  folderName: string;
  // Task/org context — consumed by trackable folders for slot mutations
  projectId?: string;
  taskId?: string;
  organizationId?: string;
  // Approval context — only consumed by trackable folders (submittals, inspections)
  memberRole?: string;
  /**
   * Slot ids whose upload is currently in-flight. The trackable folder reads
   * this to render each row's in-place "Uploading…" state alongside the
   * global upload chip.
   */
  uploadingSlotIds?: Set<string>;
}
