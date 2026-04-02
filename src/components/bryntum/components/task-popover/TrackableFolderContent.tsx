'use client';

import { Box } from '@mui/material';
import BaseFolderContent from './BaseFolderContent';
import RequirementCounter from './RequirementCounter';
import type { FolderContentProps } from './types';

interface TrackableFolderContentProps extends FolderContentProps {
  required: number | null;
  current: number;
  canManage: boolean;
  onSave: (count: number | null) => void;
  isPending: boolean;
  folderColor: string;
}

export default function TrackableFolderContent({
  docs,
  onSelectDoc,
  selectedDocId,
  onUpload,
  folderName,
  required,
  current,
  canManage,
  onSave,
  isPending,
  folderColor,
}: TrackableFolderContentProps) {
  return (
    <Box>
      <RequirementCounter
        current={current}
        required={required}
        canManage={canManage}
        onSave={onSave}
        isPending={isPending}
        folderColor={folderColor}
      />
      <BaseFolderContent
        docs={docs}
        onSelectDoc={onSelectDoc}
        selectedDocId={selectedDocId}
        onUpload={onUpload}
        folderName={folderName}
      />
    </Box>
  );
}
