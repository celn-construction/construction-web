'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface FileDropzoneProps {
  projectId: string;
  taskId: string;
  folderId: string;
  onUploadComplete: () => void;
  className?: string;
  disabled?: boolean;
}

export function FileDropzone({
  projectId,
  taskId,
  folderId,
  onUploadComplete,
  className,
  disabled = false,
}: FileDropzoneProps) {
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsLoading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('taskId', taskId);
        formData.append('folderId', folderId);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        toast.success('File uploaded successfully');
        onUploadComplete();
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to upload file');
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, taskId, folderId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/dxf': ['.dxf'],
      'application/dwg': ['.dwg'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: disabled || isLoading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
        'border-gray-200 dark:border-[var(--border-color)]',
        'hover:border-gray-300 dark:hover:border-gray-600',
        isDragActive && 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10',
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      {isLoading ? (
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      ) : (
        <FileUp className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      )}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-[var(--text-secondary)]">
          {isLoading
            ? 'Uploading...'
            : isDragActive
            ? 'Drop file here'
            : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          PDF, images, spreadsheets, Word docs, CAD files up to 50MB
        </p>
      </div>
    </div>
  );
}
