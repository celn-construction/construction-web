'use client';

import { FileText, FileSpreadsheet, FileImage, Download } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '@/trpc/react';

interface DocumentListProps {
  organizationId: string;
  projectId: string;
  taskId: string;
  folderId: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <FileImage className="w-5 h-5 text-blue-500" />;
  }
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv'
  ) {
    return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  }
  return <FileText className="w-5 h-5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({
  organizationId,
  projectId,
  taskId,
  folderId,
}: DocumentListProps) {
  const { data: documents, isLoading } = api.document.listByFolder.useQuery({
    organizationId,
    projectId,
    taskId,
    folderId,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
        No documents uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <a
          key={doc.id}
          href={doc.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
        >
          <div className="flex-shrink-0">{getFileIcon(doc.mimeType)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {doc.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatFileSize(doc.size)}</span>
              <span>•</span>
              <span>{format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
              {doc.uploadedBy.name && (
                <>
                  <span>•</span>
                  <span>{doc.uploadedBy.name}</span>
                </>
              )}
            </div>
          </div>
          <Download className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}
