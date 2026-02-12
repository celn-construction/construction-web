'use client';

import { Folder, FileText, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useFeature } from '@/store/hooks/useGanttFeatures';
import { useUpdateFeature } from '@/store/hooks/useFeatureActions';
import { useCurrentProjectId } from '@/store/hooks/useGanttFeatures';
import { ImageDropzone } from '@/components/ui/image-dropzone';
import { FileDropzone } from '@/components/documents/FileDropzone';
import { DocumentList } from '@/components/documents/DocumentList';
import { api } from '@/trpc/react';
import { Box, Typography, IconButton, LinearProgress, Paper } from '@mui/material';

export interface Selection {
  type: 'task' | 'folder';
  nodeId: string;
  taskId: string;
  folderName?: string;
  parentFolderName?: string;
  folderId?: string;
}

interface ProjectDetailPanelProps {
  selection: Selection | null;
  onBack?: () => void;
}

export function ProjectDetailPanel({ selection, onBack }: ProjectDetailPanelProps) {
  const updateFeature = useUpdateFeature();
  const task = useFeature(selection?.taskId || '');
  const currentProjectId = useCurrentProjectId();
  const utils = api.useUtils();

  // Get project to access organizationId
  const { data: projects = [] } = api.project.list.useQuery();
  const currentProject = projects.find((p) => p.id === currentProjectId);

  const handleUploadComplete = () => {
    if (currentProject?.organizationId && currentProjectId && selection?.taskId && selection?.folderId) {
      void utils.document.listByFolder.invalidate({
        organizationId: currentProject.organizationId,
        projectId: currentProjectId,
        taskId: selection.taskId,
        folderId: selection.folderId,
      });
    }
  };

  // Empty state - nothing selected
  if (!selection) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Box sx={{ textAlign: 'center' }}>
          <FileText size={48} style={{ color: 'var(--text-disabled)', margin: '0 auto 12px' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Select a task or folder to view details
          </Typography>
        </Box>
      </Box>
    );
  }

  // Task selected
  if (selection.type === 'task' && task) {
    return (
      <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
        {/* Mobile back button */}
        {onBack && (
          <IconButton
            onClick={onBack}
            sx={{
              display: { lg: 'none' },
              mb: 2,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <ArrowLeft size={16} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Back to tree
            </Typography>
          </IconButton>
        )}

        {/* Group label */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            color: 'text.disabled',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            mb: 1,
          }}
        >
          {task.group}
        </Typography>

        {/* Task name */}
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
          {task.name}
        </Typography>

        {/* Status badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: task.status.color,
            }}
          />
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, color: task.status.color }}
          >
            {task.status.name}
          </Typography>
        </Box>

        {/* Progress bar */}
        {task.progress !== undefined && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                Progress
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {task.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={task.progress}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  bgcolor: task.status.color,
                  borderRadius: 1,
                },
              }}
            />
          </Box>
        )}

        {/* Dates */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                color: 'text.disabled',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 0.5,
              }}
            >
              Start Date
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {task.startAt ? format(new Date(task.startAt), 'MMM d, yyyy') : 'Not set'}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                color: 'text.disabled',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 0.5,
              }}
            >
              End Date
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {task.endAt ? format(new Date(task.endAt), 'MMM d, yyyy') : 'Not set'}
            </Typography>
          </Box>
        </Box>

        {/* Cover photo */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: 'text.disabled',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              mb: 1,
            }}
          >
            Cover Photo
          </Typography>
          <ImageDropzone
            value={task.coverImage}
            onChange={(imageUrl) => {
              updateFeature(task.id, { coverImage: imageUrl });
            }}
          />
        </Box>
      </Box>
    );
  }

  // Folder selected
  if (selection.type === 'folder') {
    return (
      <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
        {/* Mobile back button */}
        {onBack && (
          <IconButton
            onClick={onBack}
            sx={{
              display: { lg: 'none' },
              mb: 2,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <ArrowLeft size={16} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Back to tree
            </Typography>
          </IconButton>
        )}

        {/* Folder icon and name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'rgb(245, 158, 11, 0.1)',
              border: '1px solid rgb(245, 158, 11, 0.3)',
            }}
          >
            <Folder size={24} style={{ color: 'rgb(245, 158, 11)' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {selection.folderName}
          </Typography>
        </Box>

        {/* Parent folder context */}
        {selection.parentFolderName && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                color: 'text.disabled',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 0.5,
              }}
            >
              Parent Folder
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {selection.parentFolderName}
            </Typography>
          </Box>
        )}

        {/* Parent task reference */}
        {task && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                color: 'text.disabled',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 0.5,
              }}
            >
              Task
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.primary' }}>
              {task.name}
            </Typography>
          </Box>
        )}

        {/* Document upload and list */}
        {currentProject?.organizationId && currentProjectId && selection.folderId && (
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: 'text.disabled',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  mb: 1,
                }}
              >
                Upload Documents
              </Typography>
              <FileDropzone
                projectId={currentProjectId}
                taskId={selection.taskId}
                folderId={selection.folderId}
                onUploadComplete={handleUploadComplete}
              />
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: 'text.disabled',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  mb: 1,
                }}
              >
                Documents
              </Typography>
              <DocumentList
                organizationId={currentProject.organizationId}
                projectId={currentProjectId}
                taskId={selection.taskId}
                folderId={selection.folderId}
              />
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  return null;
}
