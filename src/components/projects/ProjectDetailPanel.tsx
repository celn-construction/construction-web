'use client';

import { Folder, FileText, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useFeature } from '@/store/hooks/useGanttFeatures';
import { useUpdateFeature } from '@/store/hooks/useFeatureActions';
import { ImageDropzone } from '@/components/ui/image-dropzone';

export interface Selection {
  type: 'task' | 'folder';
  nodeId: string;
  taskId: string;
  folderName?: string;
  parentFolderName?: string;
}

interface ProjectDetailPanelProps {
  selection: Selection | null;
  onBack?: () => void;
}

export function ProjectDetailPanel({ selection, onBack }: ProjectDetailPanelProps) {
  const updateFeature = useUpdateFeature();
  const task = useFeature(selection?.taskId || '');

  // Empty state - nothing selected
  if (!selection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a task or folder to view details
          </p>
        </div>
      </div>
    );
  }

  // Task selected
  if (selection.type === 'task' && task) {
    return (
      <div className="h-full overflow-auto p-6">
        {/* Mobile back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tree
          </button>
        )}

        {/* Group label */}
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          {task.group}
        </div>

        {/* Task name */}
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          {task.name}
        </h2>

        {/* Status badge */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: task.status.color }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: task.status.color }}
          >
            {task.status.name}
          </span>
        </div>

        {/* Progress bar */}
        {task.progress !== undefined && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {task.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${task.progress}%`,
                  backgroundColor: task.status.color,
                }}
              />
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Start Date
            </div>
            <div className="text-sm text-gray-900 dark:text-white">
              {task.startAt ? format(new Date(task.startAt), 'MMM d, yyyy') : 'Not set'}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              End Date
            </div>
            <div className="text-sm text-gray-900 dark:text-white">
              {task.endAt ? format(new Date(task.endAt), 'MMM d, yyyy') : 'Not set'}
            </div>
          </div>
        </div>

        {/* Cover photo */}
        <div>
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Cover Photo
          </div>
          <ImageDropzone
            value={task.coverImage}
            onChange={(imageUrl) => {
              updateFeature(task.id, { coverImage: imageUrl });
            }}
          />
        </div>
      </div>
    );
  }

  // Folder selected
  if (selection.type === 'folder') {
    return (
      <div className="h-full overflow-auto p-6">
        {/* Mobile back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tree
          </button>
        )}

        {/* Folder icon and name */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Folder className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {selection.folderName}
          </h2>
        </div>

        {/* Parent folder context */}
        {selection.parentFolderName && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Parent Folder
            </div>
            <div className="text-sm text-gray-900 dark:text-white">
              {selection.parentFolderName}
            </div>
          </div>
        )}

        {/* Parent task reference */}
        {task && (
          <div className="mb-6">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Task
            </div>
            <div className="text-sm text-gray-900 dark:text-white">
              {task.name}
            </div>
          </div>
        )}

        {/* Empty state for documents */}
        <div className="mt-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
          <div className="text-center">
            <FileText className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No documents yet
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
