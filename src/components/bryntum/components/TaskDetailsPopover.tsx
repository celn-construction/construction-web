'use client';

import { useState, useCallback, useRef } from 'react';
import {
  X,
  Folder,
  FileText,
  Plus,
  ImagePlus,
  Trash2,
  Pencil,
  MoreHorizontal,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Upload,
  FolderTree,
  Calendar,
  Timer,
} from 'lucide-react';
import { Box, Popover, IconButton, Typography, CircularProgress } from '@mui/material';
import { POPOVER_WIDTH } from '../constants';
import type { PopoverPlacement } from '../types';
import { folderData } from '@/lib/folders';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import UploadDialog from '@/components/documents/UploadDialog';
import { api } from '@/trpc/react';

function getStatusInfo(percentDone: number) {
  if (percentDone >= 100) {
    return { label: 'Complete', dotColor: '#16A34A', chipBg: '#dcfce7', chipColor: '#166534' };
  }
  if (percentDone > 0) {
    return { label: 'In Progress', dotColor: '#D97706', chipBg: '#fef3c7', chipColor: '#92400e' };
  }
  return { label: 'Not Started', dotColor: '#9ca3af', chipBg: '#f3f4f6', chipColor: '#4b5563' };
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(duration: number | null | undefined, unit: string): string {
  if (!duration) return '';
  const rounded = Math.round(duration);
  const u = unit === 'day' ? 'day' : unit;
  return `${rounded} ${u}${rounded !== 1 ? 's' : ''}`;
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [uploadFolder, setUploadFolder] = useState<{ id: string; name: string } | null>(null);
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
  const percentDone = taskDetail?.percentDone ?? 0;
  const statusInfo = getStatusInfo(percentDone);

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

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const handleUploadComplete = useCallback(() => {
    void utils.document.countByTask.invalidate({ organizationId, projectId, taskId: taskId! });
    void utils.document.listByTask.invalidate({ organizationId, projectId, taskId: taskId! });
    void utils.document.listByFolder.invalidate();
    setUploadFolder(null);
  }, [organizationId, projectId, taskId, utils]);

  const handleClose = () => {
    setExpandedFolders(new Set());
    onClose();
  };

  const badgeText = taskDetail?.group ?? taskName.split(' ')[0] ?? 'Task';
  const badgeColor = '#E67E22';

  const metaDateRange = [
    taskDetail?.startDate ? formatDate(taskDetail.startDate) : null,
    taskDetail?.endDate ? formatDate(taskDetail.endDate) : null,
  ]
    .filter(Boolean)
    .join(' — ');

  const durationLabel = formatDuration(
    taskDetail?.duration,
    taskDetail?.durationUnit ?? 'day'
  );

  return (
    <>
      <Popover
        open={open}
        anchorReference="anchorPosition"
        anchorPosition={popoverPlacement?.anchorPosition}
        onClose={handleClose}
        transformOrigin={
          popoverPlacement?.transformOrigin ?? { vertical: 'center', horizontal: 'left' }
        }
        slotProps={{
          paper: {
            sx: {
              m: popoverPlacement?.paperMargin ?? '0 0 0 8px',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow:
                '0 16px 48px -8px rgba(0,0,0,0.18), 0 4px 12px -4px rgba(0,0,0,0.05)',
              width: POPOVER_WIDTH,
            },
          },
        }}
      >
        <Box sx={{ width: POPOVER_WIDTH, bgcolor: 'background.paper' }}>

          {/* ── HEADER ── */}
          <Box sx={{ display: 'flex', minHeight: 160 }}>

            {/* Cover image column (160px) */}
            <Box
              sx={{
                width: 160,
                flexShrink: 0,
                position: 'relative',
                bgcolor: 'action.hover',
                overflow: 'hidden',
                '&:hover .cover-actions': { opacity: 1 },
              }}
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
                onChange={handleCoverUpload}
              />
              {coverImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImageUrl}
                    alt="Task cover"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      position: 'absolute',
                      inset: 0,
                    }}
                  />
                  <Box
                    className="cover-actions"
                    sx={{
                      position: 'absolute',
                      inset: 0,
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
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                    ) : (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => coverInputRef.current?.click()}
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.15)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                          }}
                          aria-label="Change cover image"
                        >
                          <ImagePlus size={14} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={handleCoverRemove}
                          sx={{
                            color: 'white',
                            bgcolor: 'rgba(255,255,255,0.15)',
                            '&:hover': { bgcolor: 'rgba(220,38,38,0.6)' },
                          }}
                          aria-label="Remove cover image"
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </>
              ) : (
                <Box
                  component="button"
                  onClick={() => coverInputRef.current?.click()}
                  sx={{
                    width: '100%',
                    height: '100%',
                    minHeight: 160,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.75,
                    border: 'none',
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    color: 'text.disabled',
                    '&:hover': { color: 'text.secondary', bgcolor: 'action.selected' },
                    transition: 'background-color 0.2s, color 0.2s',
                  }}
                >
                  {coverUploading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <>
                      <ImagePlus size={20} />
                      <Typography sx={{ fontSize: '0.7rem', color: 'inherit' }}>
                        Add cover
                      </Typography>
                    </>
                  )}
                </Box>
              )}
            </Box>

            {/* Right content column */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: '16px 20px 16px 16px',
                gap: 1.5,
                minWidth: 0,
              }}
            >
              {/* Top row: badge + close */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: badgeColor,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    noWrap
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: badgeColor,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {badgeText}
                  </Typography>
                </Box>
                <Box
                  component="button"
                  onClick={handleClose}
                  sx={{
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'transparent',
                    cursor: 'pointer',
                    color: 'text.secondary',
                    flexShrink: 0,
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background-color 0.15s',
                  }}
                  aria-label="Close"
                >
                  <X size={14} />
                </Box>
              </Box>

              {/* Title section */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    lineHeight: 1.3,
                    fontFamily: 'Inter, sans-serif',
                    color: 'text.primary',
                    wordBreak: 'break-word',
                  }}
                >
                  {taskName}
                </Typography>
                {(metaDateRange || durationLabel) && (
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}
                  >
                    {metaDateRange && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar
                          size={12}
                          style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }}
                        />
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'text.secondary',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {metaDateRange}
                        </Typography>
                      </Box>
                    )}
                    {durationLabel && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Timer
                          size={12}
                          style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }}
                        />
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'text.secondary',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {durationLabel}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {/* Status chip + progress */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Status chip */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 999,
                    bgcolor: statusInfo.chipBg,
                    width: 'fit-content',
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: statusInfo.dotColor,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: statusInfo.chipColor,
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1,
                    }}
                  >
                    {statusInfo.label}
                  </Typography>
                </Box>

                {/* Progress bar */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: 'text.secondary',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      Progress
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'text.primary',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {Math.round(percentDone)}%
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 5,
                      borderRadius: 999,
                      bgcolor: 'action.selected',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        borderRadius: 999,
                        bgcolor: percentDone >= 100 ? '#16A34A' : '#D97706',
                        width: `${Math.min(percentDone, 100)}%`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* ── DIVIDER ── */}
          <Box sx={{ height: 1, bgcolor: 'divider' }} />

          {/* ── DOCUMENTS SECTION ── */}
          <Box
            sx={{
              p: '16px 24px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
            }}
          >
            {/* Section header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderTree size={16} style={{ color: 'var(--mui-palette-text-secondary)' }} />
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'text.primary',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Files
                </Typography>
              </Box>
              <Box
                component="button"
                onClick={() => {
                  const first = folderData[0];
                  if (first) setUploadFolder({ id: first.id, name: first.name });
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  color: 'primary.main',
                  p: 0,
                  '&:hover': { opacity: 0.75 },
                  transition: 'opacity 0.15s',
                }}
              >
                <Upload size={12} />
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'inherit',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Upload
                </Typography>
              </Box>
            </Box>

            {/* Folder tree */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {folderData.map((folder) => {
                const count = counts?.[folder.id] ?? 0;
                const isOpen = expandedFolders.has(folder.id);
                const folderDocs = (allDocs ?? []).filter((d) => d.folderId === folder.id);

                return (
                  <Box key={folder.id}>
                    {/* Folder row */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1,
                        py: 1,
                        borderRadius: 2,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.15s',
                      }}
                      onClick={() => toggleFolder(folder.id)}
                    >
                      {isOpen ? (
                        <ChevronDown
                          size={14}
                          style={{ color: '#9ca3af', flexShrink: 0 }}
                        />
                      ) : (
                        <ChevronRight
                          size={14}
                          style={{ color: '#9ca3af', flexShrink: 0 }}
                        />
                      )}
                      <Folder
                        size={16}
                        style={{ color: folder.color, flexShrink: 0 }}
                      />
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: isOpen ? 600 : 500,
                          flex: 1,
                          color: 'text.primary',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {folder.name}
                      </Typography>
                      {count > 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 20,
                            height: 20,
                            borderRadius: 999,
                            bgcolor: 'action.selected',
                            px: 1,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'text.secondary',
                              fontFamily: 'Inter, sans-serif',
                              lineHeight: 1,
                            }}
                          >
                            {count}
                          </Typography>
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFolder({ id: folder.id, name: folder.name });
                        }}
                        sx={{
                          p: 0.5,
                          width: 24,
                          height: 24,
                          color: 'text.disabled',
                          '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
                        }}
                        aria-label={`Upload to ${folder.name}`}
                      >
                        <Plus size={13} />
                      </IconButton>
                    </Box>

                    {/* Expanded file rows */}
                    {isOpen && folderDocs.length > 0 && (
                      <Box
                        sx={{
                          pl: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.125,
                        }}
                      >
                        {folderDocs.map((doc) => (
                          <Box
                            key={doc.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              pt: '7px',
                              pb: '7px',
                              pr: 1,
                              pl: '18px',
                              borderRadius: 1.5,
                              '&:hover': { bgcolor: 'action.hover' },
                              cursor: 'default',
                            }}
                          >
                            <FileText
                              size={14}
                              style={{ color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }}
                            />
                            <Typography
                              sx={{
                                fontSize: 12,
                                flex: 1,
                                color: 'text.primary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontFamily: 'Inter, sans-serif',
                              }}
                            >
                              {doc.name}
                            </Typography>
                            {'createdAt' in doc && doc.createdAt && (
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  color: 'text.secondary',
                                  fontFamily: 'Inter, sans-serif',
                                  flexShrink: 0,
                                  opacity: 0.7,
                                }}
                              >
                                {new Date(doc.createdAt as string | Date).toLocaleDateString(
                                  'en-US',
                                  { month: 'short', day: 'numeric' }
                                )}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                    {isOpen && folderDocs.length === 0 && (
                      <Box sx={{ pl: '36px', py: 0.75 }}>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: 'text.disabled',
                            fontFamily: 'Inter, sans-serif',
                            fontStyle: 'italic',
                          }}
                        >
                          No files yet
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* ── DIVIDER ── */}
          <Box sx={{ height: 1, bgcolor: 'divider' }} />

          {/* ── FOOTER ── */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 3,
              py: 1.75,
            }}
          >
            {/* Left: Edit Task + More */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                component="button"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.75,
                  height: 34,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  color: 'text.primary',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12,
                  fontWeight: 500,
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background-color 0.15s',
                }}
              >
                <Pencil size={13} />
                Edit Task
              </Box>
              <Box
                component="button"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background-color 0.15s',
                }}
                aria-label="More options"
              >
                <MoreHorizontal size={14} />
              </Box>
            </Box>

            {/* Right: Open Details */}
            <Box
              component="button"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                px: 2.25,
                height: 34,
                borderRadius: 2,
                border: 'none',
                bgcolor: 'text.primary',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: 'background.paper',
                '&:hover': { opacity: 0.88 },
                transition: 'opacity 0.15s',
              }}
            >
              Open Details
              <ArrowRight size={13} />
            </Box>
          </Box>
        </Box>
      </Popover>

      {/* Upload dialog */}
      {uploadFolder && taskId && (
        <UploadDialog
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) setUploadFolder(null);
          }}
          projectId={projectId}
          taskId={taskId}
          folderId={uploadFolder.id}
          folderName={uploadFolder.name}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </>
  );
}
