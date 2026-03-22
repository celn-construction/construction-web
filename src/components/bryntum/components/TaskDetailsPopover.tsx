'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  X,
  FolderSimple,
  FolderOpen,
  Question,
  PaperPlaneTilt,
  PencilSimpleLine,
  Camera,
  ClipboardText,
  type Icon as PhosphorIcon,
  FileText,
  Plus,
  Image,
  Trash,
  CaretDown,
  CaretRight,


  CalendarBlank,
  Timer,
  Tag,
  SquaresFour,
  List,
  ImageSquare,
  DownloadSimple,
  ArrowsOut,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { Box, Popover, IconButton, Typography, CircularProgress, Divider, Menu, MenuItem, TextField, InputAdornment } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import UploadOverlay from '@/components/ui/UploadOverlay';

import { POPOVER_WIDTH, POPOVER_EXPANDED_WIDTH } from '../constants';
import { formatFileSize } from '@/lib/utils/formatting';
import type { PopoverPlacement } from '../types';
import { folderData } from '@/lib/folders';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import UploadDialog from '@/components/documents/UploadDialog';
import { api } from '@/trpc/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { formatCsiCode, CSI_DIVISIONS } from '@/lib/constants/csiCodes';

const folderIconMap: Record<string, PhosphorIcon> = {
  rfi: Question,
  submittals: PaperPlaneTilt,
  'change-orders': PencilSimpleLine,
  photos: Camera,
  inspections: ClipboardText,
};

function getStatusInfo(percentDone: number, palette: Theme['palette']) {
  if (percentDone >= 100) {
    return { label: 'Complete', dotColor: palette.status.active, chipBg: palette.status.activeBg, chipColor: palette.status.activeText };
  }
  if (percentDone > 0) {
    return { label: 'In Progress', dotColor: palette.status.inProgress, chipBg: palette.status.inProgressBg, chipColor: palette.status.inProgressText };
  }
  return { label: 'Not Started', dotColor: palette.text.disabled, chipBg: palette.action.hover, chipColor: palette.text.secondary };
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
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [uploadFolder, setUploadFolder] = useState<{ id: string; name: string } | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverDeleting, setCoverDeleting] = useState(false);
  const [coverImageLoaded, setCoverImageLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photosViewMode, setPhotosViewMode] = useState<'grid' | 'list'>('grid');
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    name: string;
    blobUrl: string;
    mimeType: string;
    size: number;
    createdAt: string | Date;
    uploadedBy: { name: string | null } | null;
  } | null>(null);

  const [csiAnchorEl, setCsiAnchorEl] = useState<HTMLElement | null>(null);
  const [csiSearch, setCsiSearch] = useState('');

  const utils = api.useUtils();

  const updateCsiCode = api.gantt.updateCsiCode.useMutation({
    onSuccess: () => {
      void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId: taskId! });
    },
    onError: (error) => {
      showSnackbar(error.message || 'Failed to update CSI code', 'error');
    },
  });

  const filteredCsiDivisions = CSI_DIVISIONS.filter((d) => {
    if (!csiSearch) return true;
    const q = csiSearch.toLowerCase();
    return d.code.includes(q) || d.name.toLowerCase().includes(q);
  });

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

  // Reset image loaded state when cover URL changes (different task opened)
  useEffect(() => {
    setCoverImageLoaded(false);
  }, [coverImageUrl]);
  const statusInfo = getStatusInfo(percentDone, theme.palette);

  const uploadCoverImage = useCallback(
    async (file: File) => {
      if (!taskId) return;
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setCoverUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('taskId', taskId);
        const res = await fetch('/api/gantt/cover-image', { method: 'POST', body: formData });
        if (res.ok) {
          void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
        } else {
          const body = await res.json().catch(() => ({ error: 'Upload failed' }));
          showSnackbar((body as { error?: string }).error ?? 'Upload failed', 'error');
        }
      } finally {
        setCoverUploading(false);
        URL.revokeObjectURL(preview);
        setPreviewUrl(null);
      }
    },
    [taskId, projectId, organizationId, utils, showSnackbar]
  );

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCoverRemove = useCallback(async () => {
    if (!taskId) return;
    setCoverUploading(true);
    setCoverDeleting(true);
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
      setCoverDeleting(false);
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
    setPreviewDoc(null);
    onClose();
  };

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop: (files) => {
      if (files[0]) void uploadCoverImage(files[0]);
    },
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      if (code === 'file-too-large') {
        showSnackbar('Image must be under 10MB', 'error');
      } else if (code === 'file-invalid-type') {
        showSnackbar('Only JPG, PNG, GIF, and WebP images are supported', 'error');
      } else {
        showSnackbar('File not accepted', 'error');
      }
    },
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    noClick: !!coverImageUrl,
    noKeyboard: !!coverImageUrl,
    disabled: coverUploading,
  });

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
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: (theme) =>
                theme.palette.mode === 'dark'
                  ? '0 24px 64px -12px rgba(0,0,0,0.55), 0 8px 20px -8px rgba(0,0,0,0.3)'
                  : '0 24px 64px -12px rgba(0,0,0,0.12), 0 8px 20px -8px rgba(0,0,0,0.04)',
              width: previewDoc ? POPOVER_EXPANDED_WIDTH : POPOVER_WIDTH,
              transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          },
        }}
      >
        <Box sx={{ display: 'flex' }}>
        {/* ── LEFT PANEL ── */}
        <Box sx={{ width: POPOVER_WIDTH, flexShrink: 0, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>

          {/* ── HEADER ── */}
          <Box sx={{ p: '12px 14px', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {/* Top row: thumbnail + title + close */}
            <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
              {/* Cover image thumbnail */}
              <Box
                {...getRootProps()}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  outline: 'none',
                  position: 'relative',
                  bgcolor: isDragActive ? 'action.selected' : 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'background-color 0.2s',
                  '&:hover .cover-actions': { opacity: 1 },
                  cursor: coverImageUrl ? 'default' : 'pointer',
                }}
              >
                <input {...getInputProps()} />

                {coverUploading ? (
                  <UploadOverlay
                    previewUrl={previewUrl}
                    variant={coverDeleting ? 'dark' : previewUrl ? 'dark' : 'light'}
                    text={coverDeleting ? 'Removing…' : 'Uploading…'}
                  />
                ) : coverImageUrl ? (
                  <>
                    {!coverImageLoaded && (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '@keyframes shimmer': {
                            '0%': { backgroundPosition: '-200% 0' },
                            '100%': { backgroundPosition: '200% 0' },
                          },
                          background: 'linear-gradient(90deg, var(--mui-palette-background-default) 25%, var(--mui-palette-divider) 50%, var(--mui-palette-background-default) 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 1.8s ease-in-out infinite',
                        }}
                      >
                        <ImageSquare size={18} color="var(--mui-palette-text-disabled)" />
                      </Box>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImageUrl}
                      alt="Task cover"
                      onLoad={() => setCoverImageLoaded(true)}
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
                        inset: 0,
                        bgcolor: 'rgba(0,0,0,0.45)',
                        backdropFilter: 'blur(2px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFilePicker();
                        }}
                        sx={{
                          color: 'white',
                          width: 24,
                          height: 24,
                          bgcolor: 'rgba(255,255,255,0.12)',
                          borderRadius: '6px',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                        }}
                        aria-label="Change cover image"
                      >
                        <Image size={12} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleCoverRemove();
                        }}
                        sx={{
                          color: 'white',
                          width: 24,
                          height: 24,
                          bgcolor: 'rgba(255,255,255,0.12)',
                          borderRadius: '6px',
                          '&:hover': { bgcolor: 'rgba(220,38,38,0.5)' },
                        }}
                        aria-label="Remove cover image"
                      >
                        <Trash size={12} />
                      </IconButton>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isDragActive ? 'text.secondary' : 'text.disabled',
                    }}
                  >
                    <Image size={18} />
                  </Box>
                )}
              </Box>

              {/* Title + metadata */}
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em',
                    color: 'text.primary',
                    wordBreak: 'break-word',
                  }}
                >
                  {taskName}
                </Typography>
                {(metaDateRange || durationLabel) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    {metaDateRange && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarBlank size={12} color="var(--mui-palette-text-secondary)" style={{ flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: 'text.secondary', lineHeight: 1 }}>
                          {metaDateRange}
                        </Typography>
                      </Box>
                    )}
                    {metaDateRange && durationLabel && (
                      <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled', flexShrink: 0 }} />
                    )}
                    {durationLabel && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Timer size={12} color="var(--mui-palette-text-secondary)" style={{ flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 500, color: 'text.secondary', lineHeight: 1 }}>
                          {durationLabel}
                        </Typography>
                      </Box>
                    )}
                    {(metaDateRange || durationLabel) && (
                      <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled', flexShrink: 0 }} />
                    )}
                    <Box
                      component="button"
                      onClick={(e) => {
                        setCsiAnchorEl(e.currentTarget as HTMLElement);
                        setCsiSearch('');
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: 'none',
                        bgcolor: 'transparent',
                        cursor: 'pointer',
                        p: 0,
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        px: 0.5,
                        mx: -0.5,
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <Tag size={12} color="var(--mui-palette-text-secondary)" style={{ flexShrink: 0 }} />
                      <Typography
                        sx={{
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          color: taskDetail?.csiCode ? 'text.secondary' : 'text.disabled',
                          lineHeight: 1,
                          ...(!taskDetail?.csiCode && {
                            textDecoration: 'underline dashed',
                            textDecorationColor: 'var(--mui-palette-text-disabled)',
                            textUnderlineOffset: '2px',
                          }),
                        }}
                      >
                        {taskDetail?.csiCode ? formatCsiCode(taskDetail.csiCode) : 'Add CSI Code'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Close button */}
              <Box
                component="button"
                onClick={handleClose}
                sx={{
                  width: 26,
                  height: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  border: 'none',
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  color: 'text.secondary',
                  flexShrink: 0,
                  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                  transition: 'background-color 0.15s, color 0.15s',
                }}
                aria-label="Close"
              >
                <X size={13} />
              </Box>
            </Box>

            {/* Progress bar */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography
                  sx={{
                    fontSize: '0.5625rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    lineHeight: 1,
                  }}
                >
                  Progress
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: 'text.primary',
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {Math.round(percentDone)}%
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 4,
                  borderRadius: 999,
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    borderRadius: 999,
                    bgcolor: statusInfo.dotColor,
                    width: `${Math.min(percentDone, 100)}%`,
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* ── DIVIDER ── */}
          <Divider sx={{ mx: 2 }} />

          {/* ── DOCUMENTS SECTION ── */}
          <Box
            sx={{
              p: '12px 16px 14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
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
              <Typography
                sx={{
                  fontSize: '0.5625rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  userSelect: 'none',
                  lineHeight: 1,
                }}
              >
                Files
              </Typography>
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
                        gap: 0.75,
                        px: 0.75,
                        py: 0.625,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          '& .folder-upload-btn': { opacity: 1 },
                        },
                        transition: 'background-color 0.15s',
                      }}
                      onClick={() => toggleFolder(folder.id)}
                    >
                      {isOpen ? (
                        <CaretDown
                          size={14}
                          color="var(--mui-palette-text-disabled)"
                          style={{ flexShrink: 0 }}
                        />
                      ) : (
                        <CaretRight
                          size={14}
                          color="var(--mui-palette-text-disabled)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                      {(() => {
                        const FolderIcon = folderIconMap[folder.id] ?? (isOpen ? FolderOpen : FolderSimple);
                        return <FolderIcon size={14} color={folder.color} style={{ flexShrink: 0 }} />;
                      })()}
                      <Typography
                        sx={{
                          fontSize: '0.8125rem',
                          fontWeight: isOpen ? 600 : 450,
                          flex: 1,
                          color: 'text.primary',
                          lineHeight: 1,
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
                            minWidth: 18,
                            height: 18,
                            borderRadius: 999,
                            bgcolor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(0,0,0,0.05)',
                            px: 0.75,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.625rem',
                              fontWeight: 600,
                              color: 'text.secondary',
                              lineHeight: 1,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {count}
                          </Typography>
                        </Box>
                      )}
                      <IconButton
                        className="folder-upload-btn"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadFolder({ id: folder.id, name: folder.name });
                        }}
                        sx={{
                          p: 0.5,
                          width: 22,
                          height: 22,
                          color: 'text.disabled',
                          opacity: 0,
                          '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
                          transition: 'opacity 0.15s, color 0.15s',
                        }}
                        aria-label={`Upload to ${folder.name}`}
                      >
                        <Plus size={13} />
                      </IconButton>
                    </Box>

                    {/* Expanded file rows — Photos folder gets grid/list; others get standard list */}
                    {isOpen && folderDocs.length > 0 && folder.id === 'photos' && (
                      <Box sx={{ pt: 1, pl: '20px' }}>
                        {/* Grid Toolbar */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            pb: 0.5,
                          }}
                        >
                          {/* View Toggle Pill */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              bgcolor: 'action.selected',
                              borderRadius: 1.5,
                              p: '2px',
                            }}
                          >
                            <Box
                              component="button"
                              onClick={() => setPhotosViewMode('grid')}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                border: 'none',
                                cursor: 'pointer',
                                bgcolor: photosViewMode === 'grid' ? 'background.paper' : 'transparent',
                                color: photosViewMode === 'grid' ? 'text.primary' : 'text.secondary',
                                transition: 'all 0.15s',
                                boxShadow: photosViewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                              }}
                              aria-label="Grid view"
                            >
                              <SquaresFour size={13} />
                            </Box>
                            <Box
                              component="button"
                              onClick={() => setPhotosViewMode('list')}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                border: 'none',
                                cursor: 'pointer',
                                bgcolor: photosViewMode === 'list' ? 'background.paper' : 'transparent',
                                color: photosViewMode === 'list' ? 'text.primary' : 'text.secondary',
                                transition: 'all 0.15s',
                                boxShadow: photosViewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                              }}
                              aria-label="List view"
                            >
                              <List size={13} />
                            </Box>
                          </Box>
                          {/* Date label */}
                          {folderDocs[0]?.createdAt && (
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 500,
                                color: 'text.secondary',
                                                              }}
                            >
                              {new Date(folderDocs[0].createdAt as string | Date).toLocaleDateString(
                                'en-US',
                                { month: 'short', year: 'numeric' }
                              )}
                            </Typography>
                          )}
                        </Box>

                        {/* Grid or List */}
                        {photosViewMode === 'grid' ? (
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '6px',
                              pt: 0.5,
                            }}
                          >
                            {folderDocs.map((doc) => (
                              <Box
                                key={doc.id}
                                onClick={() =>
                                  setPreviewDoc({
                                    id: doc.id,
                                    name: doc.name,
                                    blobUrl: doc.blobUrl,
                                    mimeType: doc.mimeType,
                                    size: doc.size,
                                    createdAt: doc.createdAt as string | Date,
                                    uploadedBy: doc.uploadedBy ?? null,
                                  })
                                }
                                sx={{
                                  height: 70,
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  bgcolor: 'action.hover',
                                  border: '2px solid',
                                  borderColor: previewDoc?.id === doc.id ? 'primary.main' : 'transparent',
                                  transition: 'border-color 0.15s, transform 0.15s',
                                  '&:hover': {
                                    transform: 'scale(1.02)',
                                    borderColor: previewDoc?.id === doc.id ? 'primary.main' : 'divider',
                                  },
                                }}
                              >
                                {doc.mimeType.startsWith('image/') ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={doc.blobUrl}
                                    alt={doc.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: '100%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <FileText size={20} color="var(--mui-palette-text-disabled)" />
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.125, pt: 0.5 }}>
                            {folderDocs.map((doc) => (
                              <Box
                                key={doc.id}
                                onClick={() =>
                                  setPreviewDoc({
                                    id: doc.id,
                                    name: doc.name,
                                    blobUrl: doc.blobUrl,
                                    mimeType: doc.mimeType,
                                    size: doc.size,
                                    createdAt: doc.createdAt as string | Date,
                                    uploadedBy: doc.uploadedBy ?? null,
                                  })
                                }
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  py: '5px',
                                  pr: 1,
                                  pl: '18px',
                                  borderRadius: 1.5,
                                  cursor: 'pointer',
                                  bgcolor: previewDoc?.id === doc.id ? 'action.selected' : 'transparent',
                                  '&:hover': { bgcolor: 'action.hover' },
                                }}
                              >
                                <FileText
                                  size={14}
                                  color="var(--mui-palette-text-secondary)"
                                  style={{ flexShrink: 0 }}
                                />
                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    flex: 1,
                                    color: 'text.primary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                                                      }}
                                >
                                  {doc.name}
                                </Typography>
                                {'createdAt' in doc && doc.createdAt && (
                                  <Typography
                                    sx={{
                                      fontSize: 11,
                                      color: 'text.secondary',
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
                      </Box>
                    )}
                    {isOpen && folderDocs.length > 0 && folder.id !== 'photos' && (
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
                            onClick={() =>
                              setPreviewDoc({
                                id: doc.id,
                                name: doc.name,
                                blobUrl: doc.blobUrl,
                                mimeType: doc.mimeType,
                                size: doc.size,
                                createdAt: doc.createdAt as string | Date,
                                uploadedBy: doc.uploadedBy ?? null,
                              })
                            }
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              pt: '5px',
                              pb: '5px',
                              pr: 1,
                              pl: '18px',
                              borderRadius: 1.5,
                              cursor: 'pointer',
                              bgcolor: previewDoc?.id === doc.id ? 'action.selected' : 'transparent',
                              '&:hover': { bgcolor: previewDoc?.id === doc.id ? 'action.selected' : 'action.hover' },
                            }}
                          >
                            <FileText
                              size={14}
                              color={previewDoc?.id === doc.id
                                ? 'var(--mui-palette-primary-main)'
                                : 'var(--mui-palette-text-secondary)'}
                              style={{ flexShrink: 0 }}
                            />
                            <Typography
                              sx={{
                                fontSize: 12,
                                fontWeight: previewDoc?.id === doc.id ? 500 : 400,
                                flex: 1,
                                color: 'text.primary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                                              }}
                            >
                              {doc.name}
                            </Typography>
                            {'createdAt' in doc && doc.createdAt && (
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  color: 'text.secondary',
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

        </Box>
        {/* ── END LEFT PANEL ── */}

        {/* ── RIGHT PREVIEW PANEL ── */}
        {previewDoc && (
          <>
            <Divider orientation="vertical" flexItem />
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                minWidth: 0,
                animation: 'slideInRight 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '@keyframes slideInRight': {
                  from: { opacity: 0, transform: 'translateX(12px)' },
                  to: { opacity: 1, transform: 'translateX(0)' },
                },
              }}
            >
              {/* Preview Header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: '20px',
                  py: '14px',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  {previewDoc.mimeType.startsWith('image/') ? (
                    <ImageSquare
                      size={16}
                      color="var(--mui-palette-text-secondary)"
                      style={{ flexShrink: 0 }}
                    />
                  ) : (
                    <FileText
                      size={16}
                      color="var(--mui-palette-text-secondary)"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                  <Typography
                    noWrap
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'text.primary',
                                          }}
                  >
                    {previewDoc.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                  <Box
                    component="button"
                    onClick={() => window.open(previewDoc.blobUrl, '_blank')}
                    sx={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      border: 'none',
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      color: 'text.disabled',
                      '&:hover': { bgcolor: 'action.hover', color: 'text.secondary' },
                      transition: 'background-color 0.15s, color 0.15s',
                    }}
                    aria-label="Download"
                  >
                    <DownloadSimple size={14} />
                  </Box>
                  <Box
                    component="button"
                    onClick={() => window.open(previewDoc.blobUrl, '_blank')}
                    sx={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      border: 'none',
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      color: 'text.disabled',
                      '&:hover': { bgcolor: 'action.hover', color: 'text.secondary' },
                      transition: 'background-color 0.15s, color 0.15s',
                    }}
                    aria-label="Expand"
                  >
                    <ArrowsOut size={14} />
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Image / File Preview Area */}
              <Box
                sx={{
                  flex: 1,
                  overflow: 'hidden',
                  bgcolor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {previewDoc.mimeType.startsWith('image/') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewDoc.blobUrl}
                    alt={previewDoc.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                ) : (
                  <FileText
                    size={48}
                    color="var(--mui-palette-text-disabled)"
                  />
                )}
              </Box>

              <Divider />

              {/* File Metadata */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                  px: '20px',
                  py: '12px',
                }}
              >
                {previewDoc.uploadedBy?.name && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '8px', borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
                      Uploaded by
                    </Typography>
                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
                      {previewDoc.uploadedBy.name}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '8px', borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                  <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
                    Date
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
                    {new Date(previewDoc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '8px', borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                  <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
                    Size
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
                    {formatFileSize(previewDoc.size)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: '8px' }}>
                  <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
                    Type
                  </Typography>
                  <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
                    {previewDoc.mimeType.split('/')[1]?.toUpperCase() ?? previewDoc.mimeType}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
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

      {/* CSI Code selector menu */}
      <Menu
        anchorEl={csiAnchorEl}
        open={Boolean(csiAnchorEl)}
        onClose={() => setCsiAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              maxHeight: 320,
              width: 340,
              borderRadius: 2,
              mt: 0.5,
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
          <TextField
            size="small"
            placeholder="Search divisions…"
            value={csiSearch}
            onChange={(e) => setCsiSearch(e.target.value)}
            autoFocus
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MagnifyingGlass size={14} />
                  </InputAdornment>
                ),
                sx: { fontSize: 13 },
              },
            }}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </Box>
        {taskDetail?.csiCode && (
          <MenuItem
            onClick={() => {
              updateCsiCode.mutate({
                organizationId,
                projectId,
                taskId: taskId!,
                csiCode: null,
              });
              setCsiAnchorEl(null);
            }}
            sx={{
              fontSize: 12,
                            color: 'error.main',
              fontStyle: 'italic',
            }}
          >
            Remove CSI Code
          </MenuItem>
        )}
        {filteredCsiDivisions.map((d) => (
          <MenuItem
            key={d.code}
            selected={taskDetail?.csiCode === d.code}
            onClick={() => {
              updateCsiCode.mutate({
                organizationId,
                projectId,
                taskId: taskId!,
                csiCode: d.code,
              });
              setCsiAnchorEl(null);
            }}
            sx={{
              fontSize: 12,
                            gap: 1,
            }}
          >
            <Typography
              component="span"
              sx={{
                fontSize: 12,
                fontWeight: 600,
                                color: 'text.secondary',
                minWidth: 24,
              }}
            >
              {d.code}
            </Typography>
            {d.name}
          </MenuItem>
        ))}
        {filteredCsiDivisions.length === 0 && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>
              No divisions match &ldquo;{csiSearch}&rdquo;
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
}
