'use client';

import { useState, useMemo, useCallback, useRef, Fragment } from 'react';
import { X, Folder, FileText, Plus, Download, ImagePlus, Trash2 } from 'lucide-react';
import { Box, Popover, IconButton, Chip, Typography, CircularProgress } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { POPOVER_WIDTH } from '../constants';
import type { PopoverPlacement } from '../types';
import { folderData } from '@/components/projects/ProjectsTree';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import UploadDialog from '@/components/documents/UploadDialog';
import { api } from '@/trpc/react';

type DocItem = {
  id: string;
  name: string;
  blobUrl: string;
  mimeType: string;
  size: number;
  folderId: string;
  uploadedBy?: { name: string | null } | null;
};

function PopoverFolderNode({
  folder,
  taskId,
  projectId,
  organizationId,
  allDocs,
  counts,
}: {
  folder: (typeof folderData)[0];
  taskId: string;
  projectId: string;
  organizationId: string;
  allDocs: DocItem[];
  counts: Record<string, number> | undefined;
}) {
  const folderId = `popover-${taskId}-${folder.id}`;
  const [uploadOpen, setUploadOpen] = useState(false);
  const utils = api.useUtils();

  const folderDocs = useMemo(
    () => allDocs.filter((d) => d.folderId === folder.id),
    [allDocs, folder.id]
  );

  const documentCount = counts?.[folder.id] || 0;

  const handleUploadComplete = () => {
    void utils.document.countByTask.invalidate({ organizationId, projectId, taskId });
    void utils.document.listByTask.invalidate({ organizationId, projectId, taskId });
    void utils.document.listByFolder.invalidate();
  };

  return (
    <Fragment>
      <TreeItem
        key={folderId}
        itemId={folderId}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
            <Folder size={14} style={{ color: '#f59e0b' }} />
            <Box sx={{ fontWeight: 500, flexGrow: 1 }}>{folder.name}</Box>
            {documentCount > 0 && (
              <Chip
                label={documentCount}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  bgcolor: 'warning.light',
                  color: 'warning.dark',
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            )}
            <IconButton
              size="small"
              aria-label={`Upload file to ${folder.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setUploadOpen(true);
              }}
              sx={{
                p: 0.5,
                color: 'text.disabled',
                '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <Plus size={14} />
            </IconButton>
          </Box>
        }
      >
        {!folder.isLeaf &&
          folder.children &&
          folder.children
            .filter((child) => (counts?.[child.id] ?? 0) > 0)
            .map((child) => {
              const childId = `popover-${taskId}-${folder.id}-${child.id}`;
              const childDocCount = counts?.[child.id] || 0;
              const childDocs = allDocs.filter((d) => d.folderId === child.id);

              return (
                <TreeItem
                  key={childId}
                  itemId={childId}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                      <FileText size={14} style={{ color: '#6b7280' }} />
                      <Box sx={{ flexGrow: 1 }}>{child.name}</Box>
                      {childDocCount > 0 && (
                        <Chip
                          label={childDocCount}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            bgcolor: 'action.hover',
                            color: 'text.secondary',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      )}
                      <IconButton
                        size="small"
                        aria-label={`Upload file to ${child.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadOpen(true);
                        }}
                        sx={{
                          p: 0.5,
                          color: 'text.disabled',
                          '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
                        }}
                      >
                        <Plus size={14} />
                      </IconButton>
                    </Box>
                  }
                >
                  {childDocs.map((doc) => (
                    <TreeItem
                      key={`popover-${taskId}-doc-${doc.id}`}
                      itemId={`popover-${taskId}-doc-${doc.id}`}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
                          <FileText size={12} style={{ color: '#3b82f6' }} />
                          <Box
                            sx={{
                              flexGrow: 1,
                              fontSize: '0.8rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.name}
                          </Box>
                        </Box>
                      }
                    />
                  ))}
                </TreeItem>
              );
            })}
        {folderDocs.map((doc) => (
          <TreeItem
            key={`popover-${taskId}-doc-${doc.id}`}
            itemId={`popover-${taskId}-doc-${doc.id}`}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.25 }}>
                <FileText size={12} style={{ color: '#3b82f6' }} />
                <Box
                  sx={{
                    flexGrow: 1,
                    fontSize: '0.8rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {doc.name}
                </Box>
              </Box>
            }
          />
        ))}
      </TreeItem>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        projectId={projectId}
        taskId={taskId}
        folderId={folder.id}
        folderName={folder.name}
        onUploadComplete={handleUploadComplete}
      />
    </Fragment>
  );
}

function DocumentPreview({ doc, onClose }: { doc: DocItem; onClose: () => void }) {
  const isPdf = doc.mimeType === 'application/pdf';
  const isImage = doc.mimeType.startsWith('image/');

  return (
    <Box
      sx={{
        width: POPOVER_WIDTH,
        borderLeft: '1px solid',
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Box
          component="button"
          onClick={onClose}
          sx={{
            p: 0.5,
            borderRadius: 1,
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' },
            transition: 'background-color 0.2s',
          }}
          aria-label="Close preview"
        >
          <X size={16} style={{ color: 'var(--text-secondary)' }} />
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            bgcolor: isPdf ? '#dc2626' : 'text.primary',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FileText size={16} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.8125rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {doc.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {(doc.size / 1024).toFixed(1)} KB
            {doc.uploadedBy?.name && ` · ${doc.uploadedBy.name}`}
          </Typography>
        </Box>
        <IconButton
          component="a"
          href={doc.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={doc.name}
          size="small"
          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          aria-label="Download"
        >
          <Download size={16} />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1,
          bgcolor: 'action.hover',
          overflow: 'hidden',
          minHeight: 180,
        }}
      >
        {isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.blobUrl}
            alt={doc.name}
            style={{
              maxWidth: '100%',
              maxHeight: 280,
              objectFit: 'contain',
              borderRadius: 4,
            }}
          />
        )}
        {isPdf && (
          <iframe
            src={doc.blobUrl}
            title={doc.name}
            style={{ width: '100%', height: 360, border: 'none', borderRadius: 4 }}
          />
        )}
        {!isImage && !isPdf && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <FileText size={40} style={{ color: '#d1d5db', marginBottom: 8 }} />
            <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 1 }}>
              {doc.name}
            </Typography>
            <Typography
              component="a"
              href={doc.blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={doc.name}
              variant="body2"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Download ↗
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

type TaskDetailsPopoverProps = {
  open: boolean;
  taskName: string;
  taskId?: string;
  popoverPlacement: PopoverPlacement | null;
  onClose: () => void;
};

export function TaskDetailsPopover({
  open,
  taskName,
  taskId,
  popoverPlacement,
  onClose,
}: TaskDetailsPopoverProps) {
  const { projectId, organizationId } = useProjectContext();
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();

  const { data: taskDetail } = api.gantt.taskDetail.useQuery(
    { organizationId, projectId, taskId: taskId! },
    { enabled: !!organizationId && !!projectId && !!taskId }
  );

  const { data: allDocs } = api.document.listByTask.useQuery(
    { organizationId, projectId, taskId: taskId! },
    { enabled: !!organizationId && !!projectId && !!taskId }
  );

  const { data: counts } = api.document.countByTask.useQuery(
    { organizationId, projectId, taskId: taskId! },
    { enabled: !!organizationId && !!projectId && !!taskId }
  );

  const coverImageUrl = taskDetail?.coverImageUrl ?? null;

  const handleCoverUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !taskId) return;

      setCoverUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('taskId', taskId);

        const res = await fetch('/api/gantt/cover-image', { method: 'POST', body: formData });
        if (res.ok) {
          void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
        }
      } finally {
        setCoverUploading(false);
        // Reset input so the same file can be re-selected
        if (coverInputRef.current) coverInputRef.current.value = '';
      }
    },
    [taskId, projectId, organizationId, utils]
  );

  const handleCoverRemove = useCallback(async () => {
    if (!taskId) return;
    setCoverUploading(true);
    try {
      const res = await fetch('/api/gantt/cover-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, taskId }),
      });
      if (res.ok) {
        void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
      }
    } finally {
      setCoverUploading(false);
    }
  }, [taskId, projectId, organizationId, utils]);

  const handleSelectedItemsChange = useCallback(
    (_event: React.SyntheticEvent | null, itemId: string | null) => {
      if (!itemId || !allDocs) {
        setSelectedDoc(null);
        return;
      }
      const docPrefix = `popover-${taskId}-doc-`;
      if (!itemId.startsWith(docPrefix)) {
        setSelectedDoc(null);
        return;
      }
      const docId = itemId.slice(docPrefix.length);
      const doc = allDocs.find((d) => d.id === docId);
      if (doc) {
        setSelectedDoc({
          id: doc.id,
          name: doc.name,
          blobUrl: doc.blobUrl,
          mimeType: doc.mimeType,
          size: doc.size,
          folderId: doc.folderId,
          uploadedBy: doc.uploadedBy,
        });
      }
    },
    [allDocs, taskId]
  );

  const handleClose = () => {
    setSelectedDoc(null);
    onClose();
  };

  const isExpanded = selectedDoc !== null;

  return (
    <Popover
      open={open}
      anchorReference="anchorPosition"
      anchorPosition={popoverPlacement?.anchorPosition}
      onClose={handleClose}
      transformOrigin={popoverPlacement?.transformOrigin ?? { vertical: 'center', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            m: popoverPlacement?.paperMargin ?? '0 0 0 8px',
            transition: 'width 0.2s ease',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', width: isExpanded ? POPOVER_WIDTH * 2 : POPOVER_WIDTH, transition: 'width 0.2s ease' }}>
        {/* Left panel: cover image + tree (always visible) */}
        <Box sx={{ width: POPOVER_WIDTH, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Cover image area */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: 'none' }}
            onChange={handleCoverUpload}
          />

          {coverImageUrl ? (
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: 120,
                '&:hover .cover-actions': { opacity: 1 },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt="Task cover"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              <Box
                className="cover-actions"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
              >
                {coverUploading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  <>
                    <IconButton
                      size="small"
                      onClick={() => coverInputRef.current?.click()}
                      sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}
                      aria-label="Change cover image"
                    >
                      <ImagePlus size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleCoverRemove}
                      sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(220,38,38,0.6)' } }}
                      aria-label="Remove cover image"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </>
                )}
              </Box>
            </Box>
          ) : (
            <Box
              component="button"
              onClick={() => coverInputRef.current?.click()}
              sx={{
                width: '100%',
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                border: 'none',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'action.hover',
                cursor: 'pointer',
                color: 'text.secondary',
                fontSize: '0.75rem',
                '&:hover': { bgcolor: 'action.selected', color: 'text.primary' },
                transition: 'background-color 0.2s, color 0.2s',
              }}
            >
              {coverUploading ? (
                <CircularProgress size={16} />
              ) : (
                <>
                  <ImagePlus size={14} />
                  Add cover image
                </>
              )}
            </Box>
          )}

          {/* Task name + folder tree */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Box component="h3" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                  {taskName}
                </Box>
              </Box>
              {!isExpanded && (
                <Box
                  component="button"
                  onClick={handleClose}
                  sx={{
                    p: 0.5,
                    borderRadius: 1,
                    border: 'none',
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.2s',
                  }}
                  aria-label="Close"
                >
                  <X size={16} style={{ color: 'var(--text-secondary)' }} />
                </Box>
              )}
            </Box>
            {taskId && (
              <SimpleTreeView onSelectedItemsChange={handleSelectedItemsChange}>
                {folderData.map((folder) => (
                  <PopoverFolderNode
                    key={folder.id}
                    folder={folder}
                    taskId={taskId}
                    projectId={projectId}
                    organizationId={organizationId}
                    allDocs={allDocs ?? []}
                    counts={counts}
                  />
                ))}
              </SimpleTreeView>
            )}
          </Box>
        </Box>

        {/* Right panel: preview (visible when doc selected) */}
        {selectedDoc && (
          <DocumentPreview doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
        )}
      </Box>
    </Popover>
  );
}
