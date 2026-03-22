'use client';

import { skipToken } from '@tanstack/react-query';
import { Folder, FileText, Download, Calendar, BarChart2, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { FileDropzone } from '@/components/documents/FileDropzone';
import { DocumentList } from '@/components/documents/DocumentList';
import { api } from '@/trpc/react';
import { Box, Typography, IconButton, LinearProgress, Paper, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { type Selection, deriveStatus } from '@/lib/utils/gantt';

export type { Selection };

interface ProjectDetailPanelProps {
  selection: Selection | null;
  projectId?: string;
  organizationId?: string;
}

// Blueprint dot-grid SVG background
function DotGridBackground() {
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <pattern id="dotgrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--accent-primary)" opacity="0.08" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>
  );
}

// Gantt-chart SVG illustration for empty state
function GanttIllustration() {
  return (
    <svg width="180" height="96" viewBox="0 0 180 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Row lines */}
      <line x1="0" y1="24" x2="180" y2="24" stroke="var(--accent-primary)" strokeOpacity="0.08" strokeWidth="1" />
      <line x1="0" y1="48" x2="180" y2="48" stroke="var(--accent-primary)" strokeOpacity="0.08" strokeWidth="1" />
      <line x1="0" y1="72" x2="180" y2="72" stroke="var(--accent-primary)" strokeOpacity="0.08" strokeWidth="1" />

      {/* Column lines */}
      <line x1="45" y1="0" x2="45" y2="96" stroke="var(--accent-primary)" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="2 3" />
      <line x1="90" y1="0" x2="90" y2="96" stroke="var(--accent-primary)" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="2 3" />
      <line x1="135" y1="0" x2="135" y2="96" stroke="var(--accent-primary)" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="2 3" />

      {/* Task label area */}
      <rect x="0" y="0" width="44" height="96" fill="var(--accent-primary)" fillOpacity="0.03" />

      {/* Task label lines */}
      <rect x="4" y="10" width="28" height="5" rx="2.5" fill="var(--accent-primary)" fillOpacity="0.18" />
      <rect x="4" y="34" width="22" height="5" rx="2.5" fill="var(--accent-primary)" fillOpacity="0.13" />
      <rect x="4" y="58" width="32" height="5" rx="2.5" fill="var(--accent-primary)" fillOpacity="0.13" />
      <rect x="4" y="82" width="18" height="5" rx="2.5" fill="var(--accent-primary)" fillOpacity="0.10" />

      {/* Gantt bars — row 1 (wide, primary) */}
      <rect x="48" y="8" width="84" height="12" rx="4" fill="var(--accent-primary)" fillOpacity="0.22" />
      <rect x="48" y="8" width="52" height="12" rx="4" fill="var(--accent-primary)" fillOpacity="0.45" />

      {/* Gantt bars — row 2 */}
      <rect x="68" y="32" width="60" height="12" rx="4" fill="var(--accent-primary)" fillOpacity="0.22" />
      <rect x="68" y="32" width="36" height="12" rx="4" fill="var(--accent-primary)" fillOpacity="0.45" />

      {/* Gantt bars — row 3 (amber) */}
      <rect x="96" y="56" width="72" height="12" rx="4" fill="var(--accent-warm)" fillOpacity="0.22" />
      <rect x="96" y="56" width="40" height="12" rx="4" fill="var(--accent-warm)" fillOpacity="0.45" />

      {/* Milestone diamond — row 4 */}
      <rect
        x="150"
        y="79"
        width="10"
        height="10"
        rx="1"
        fill="var(--accent-warm)"
        fillOpacity="0.75"
        style={{ transform: 'rotate(45deg)', transformOrigin: '155px 84px' }}
      />
    </svg>
  );
}

export function ProjectDetailPanel({ selection, projectId, organizationId }: ProjectDetailPanelProps) {
  const theme = useTheme();
  const utils = api.useUtils();

  const { data: taskData } = api.gantt.taskDetail.useQuery(
    projectId && organizationId && selection?.taskId && selection?.type !== 'document'
      ? { organizationId, projectId, taskId: selection.taskId }
      : skipToken
  );

  const { data: documentData } = api.document.listByTask.useQuery(
    {
      organizationId: organizationId!,
      projectId: projectId!,
      taskId: selection?.taskId || '',
    },
    {
      enabled: !!projectId && !!organizationId && !!selection?.taskId && selection?.type === 'document',
    }
  );

  const selectedDocument = selection?.type === 'document' && selection.documentId
    ? documentData?.find((d) => d.id === selection.documentId)
    : null;

  const task = taskData
    ? {
        id: taskData.id,
        name: taskData.name,
        group: taskData.group,
        status: deriveStatus(taskData.percentDone),
        progress: Math.round(taskData.percentDone),
        startAt: taskData.startDate,
        endAt: taskData.endDate,
      }
    : null;

  const handleUploadComplete = () => {
    if (organizationId && projectId && selection?.taskId && selection?.folderId) {
      void utils.document.listByFolder.invalidate({
        organizationId,
        projectId,
        taskId: selection.taskId,
        folderId: selection.folderId,
      });
    }
  };

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (!selection) {
    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <DotGridBackground />

        {/* Central content */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', px: 4, maxWidth: 320, textAlign: 'center' }}>
          {/* Illustration card */}
          <Box
            sx={{
              mb: 3,
              p: 3,
              borderRadius: '12px',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
              display: 'inline-flex',
            }}
          >
            <GanttIllustration />
          </Box>

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.75,
              letterSpacing: '-0.01em',
            }}
          >
            Nothing selected yet
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}
          >
            Click a task or folder in the project tree to view details, track progress, and manage documents.
          </Typography>

          {/* Hint chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {[
              { icon: <BarChart2 size={12} />, label: 'Track progress' },
              { icon: <FolderOpen size={12} />, label: 'Browse documents' },
              { icon: <FileText size={12} />, label: 'Preview files' },
            ].map(({ icon, label }) => (
              <Chip
                key={label}
                icon={icon}
                label={label}
                size="small"
                variant="outlined"
                sx={{
                  height: 26,
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'text.secondary',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  '& .MuiChip-icon': {
                    color: 'text.disabled',
                    ml: '8px',
                  },
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // ─── Task selected ────────────────────────────────────────────────────────
  if (selection.type === 'task' && task) {
    return (
      <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Colored accent header strip */}
        <Box
          sx={{
            flexShrink: 0,
            borderLeft: `3px solid ${task.status.color}`,
            px: 3,
            pt: 3,
            pb: 2.5,
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
          }}
        >
          {/* Group badge */}
          <Box sx={{ mb: 1 }}>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.25,
                py: 0.25,
                borderRadius: '6px',
                bgcolor: 'action.hover',
                fontSize: '10px',
                fontWeight: 600,
                color: 'text.disabled',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              {task.group}
            </Box>
          </Box>

          {/* Task name */}
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            {task.name}
          </Typography>

          {/* Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.25 }}>
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: task.status.color, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: task.status.color, letterSpacing: '0.02em' }}>
              {task.status.name}
            </Typography>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Progress card */}
          {task.progress !== undefined && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '12px',
                bgcolor: 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Progress
                </Typography>
                <Typography
                  sx={{
                    fontSize: '26px',
                    fontWeight: 700,
                    color: task.status.color,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {task.progress}
                  <Typography component="span" variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', ml: 0.25 }}>
                    %
                  </Typography>
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={task.progress}
                sx={{
                  height: 6,
                  borderRadius: '6px',
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: task.status.color,
                    borderRadius: '6px',
                  },
                }}
              />
            </Paper>
          )}

          {/* Date cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {[
              { label: 'Start Date', value: task.startAt },
              { label: 'End Date', value: task.endAt },
            ].map(({ label, value }) => (
              <Paper
                key={label}
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                  <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '10px' }}>
                    {label}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: value ? 'text.primary' : 'text.disabled', fontSize: '13px' }}>
                  {value ? format(new Date(value), 'MMM d, yyyy') : '—'}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  // ─── Folder selected ──────────────────────────────────────────────────────
  if (selection.type === 'folder') {
    return (
      <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Folder header */}
        <Box
          sx={{
            flexShrink: 0,
            px: 3,
            pt: 3,
            pb: 2.5,
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, transparent 70%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.08) 100%)',
                border: '1px solid rgba(245,158,11,0.25)',
                flexShrink: 0,
              }}
            >
              <Folder size={22} style={{ color: 'rgb(245, 158, 11)' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selection.folderName}
              </Typography>
              {selection.parentFolderName && (
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '11px' }}>
                  in {selection.parentFolderName}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Task reference */}
          {task && (
            <Box
              sx={{
                mt: 1.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.25,
                py: 0.4,
                borderRadius: '6px',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '11px' }}>
                {task.name}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Document section */}
        {organizationId && projectId && selection.folderId && (
          <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1.25 }}>
                Upload Documents
              </Typography>
              <FileDropzone
                projectId={projectId}
                taskId={selection.taskId}
                folderId={selection.folderId}
                onUploadComplete={handleUploadComplete}
              />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1.25 }}>
                Documents
              </Typography>
              <DocumentList
                organizationId={organizationId}
                projectId={projectId}
                taskId={selection.taskId}
                folderId={selection.folderId}
              />
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  // ─── Document selected ────────────────────────────────────────────────────
  if (selection.type === 'document' && selectedDocument) {
    const isPdf = selectedDocument.mimeType === 'application/pdf';
    const isImage = selectedDocument.mimeType.startsWith('image/');
    const iconColor = isPdf ? theme.palette.error.main : isImage ? theme.palette.status.completed : theme.palette.primary.main;

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: '12px',
                bgcolor: `${iconColor}18`,
                border: `1px solid ${iconColor}30`,
                flexShrink: 0,
              }}
            >
              <FileText size={18} style={{ color: iconColor }} />
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                }}
              >
                {selectedDocument.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '11px' }}>
                  {(selectedDocument.size / 1024).toFixed(1)} KB
                </Typography>
                {selectedDocument.uploadedBy?.name && (
                  <>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '11px' }}>·</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '11px' }}>
                      {selectedDocument.uploadedBy.name}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            <IconButton
              component="a"
              href={selectedDocument.blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={selectedDocument.name}
              size="small"
              sx={{
                color: 'text.disabled',
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                flexShrink: 0,
              }}
            >
              <Download size={16} />
            </IconButton>
          </Box>
        </Box>

        {/* Preview area */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {isPdf && (
            <iframe
              src={selectedDocument.blobUrl}
              title={selectedDocument.name}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}
          {isImage && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, overflow: 'auto', bgcolor: 'action.hover' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedDocument.blobUrl}
                alt={selectedDocument.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
              />
            </Box>
          )}
          {!isPdf && !isImage && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  maxWidth: 300,
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    bgcolor: `${iconColor}12`,
                    border: `1px solid ${iconColor}25`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <FileText size={28} style={{ color: iconColor }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {selectedDocument.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 2 }}>
                  {selectedDocument.mimeType} · {(selectedDocument.size / 1024).toFixed(1)} KB
                </Typography>
                <Typography
                  component="a"
                  href={selectedDocument.blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={selectedDocument.name}
                  variant="body2"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Download File
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return null;
}
