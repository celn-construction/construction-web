'use client';

import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import {
  FolderSimple,
  FolderOpen,
  Question,
  PaperPlaneTilt,
  PencilSimpleLine,
  Camera,
  ClipboardText,
  CaretDown,
  CaretRight,
  Plus,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import type { Folder } from '@/lib/folders';
import type { DocumentItem, PreviewDoc, FolderContentProps } from './types';
import BaseFolderContent from './BaseFolderContent';
import PhotosFolderContent from './PhotosFolderContent';
import TrackableFolderContent from './TrackableFolderContent';
import RequirementCounter from './RequirementCounter';

const folderIconMap: Record<string, PhosphorIcon> = {
  rfi: Question,
  submittals: PaperPlaneTilt,
  'change-orders': PencilSimpleLine,
  photos: Camera,
  inspections: ClipboardText,
};

const FOLDER_CONTENT_MAP: Record<string, React.ComponentType<FolderContentProps>> = {
  photos: PhotosFolderContent,
};

interface FolderRowProps {
  folder: Folder;
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
  docs: DocumentItem[];
  onUpload: (folder: { id: string; name: string }) => void;
  onSelectDoc: (doc: PreviewDoc) => void;
  selectedDocId: string | null;
  // Tracking props (only used for trackable folders)
  required?: number | null;
  current?: number;
  canManage?: boolean;
  onSaveRequirement?: (count: number | null) => void;
  isRequirementPending?: boolean;
}

function FolderRowInner({
  folder,
  isExpanded,
  onToggle,
  count,
  docs,
  onUpload,
  onSelectDoc,
  selectedDocId,
  required,
  current,
  canManage,
  onSaveRequirement,
  isRequirementPending,
}: FolderRowProps) {
  const FolderIcon = folderIconMap[folder.id] ?? (isExpanded ? FolderOpen : FolderSimple);
  const isTrackable = folder.trackable && !!onSaveRequirement;

  const contentProps: FolderContentProps = {
    docs,
    onSelectDoc,
    selectedDocId,
    onUpload: () => onUpload({ id: folder.id, name: folder.name }),
    folderName: folder.name,
  };

  const renderContent = () => {
    if (!isExpanded) return null;

    // Trackable folders (submittals, inspections) get numbered slot dropzones
    if (isTrackable) {
      return (
        <TrackableFolderContent
          {...contentProps}
          required={required ?? null}
          folderColor={folder.color}
        />
      );
    }

    const SpecificContent = FOLDER_CONTENT_MAP[folder.id];
    if (SpecificContent) {
      return <SpecificContent {...contentProps} />;
    }

    return <BaseFolderContent {...contentProps} />;
  };

  return (
    <Box>
      {/* Folder header row */}
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
          '&:hover': { bgcolor: 'action.hover' },
          transition: 'background-color 0.15s',
        }}
        onClick={onToggle}
      >
        {isExpanded ? (
          <CaretDown size={14} color="var(--mui-palette-text-secondary)" style={{ flexShrink: 0 }} />
        ) : (
          <CaretRight size={14} color="var(--mui-palette-text-secondary)" style={{ flexShrink: 0 }} />
        )}
        <FolderIcon size={14} color={folder.color} style={{ flexShrink: 0 }} />
        <Typography
          sx={{
            fontSize: '0.8125rem',
            fontWeight: isExpanded ? 600 : 450,
            color: 'text.primary',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {folder.name}
        </Typography>

        {/* Tracking indicator — inline in the header row */}
        {isTrackable ? (
          <RequirementCounter
            current={current ?? 0}
            required={required ?? null}
            canManage={canManage ?? false}
            onSave={onSaveRequirement}
            isPending={isRequirementPending}
            folderColor={folder.color}
          />
        ) : (
          <>
            {/* Standard count badge for non-trackable folders */}
            {count > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 18,
                  height: 18,
                  borderRadius: '999px',
                  bgcolor: 'rgba(0,0,0,0.05)',
                  px: 0.75,
                  ml: 'auto',
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
          </>
        )}

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onUpload({ id: folder.id, name: folder.name });
          }}
          sx={{
            p: 0.5,
            width: 22,
            height: 22,
            color: 'text.disabled',
            flexShrink: 0,
            ...(!isTrackable && { ml: count > 0 ? 0 : 'auto' }),
            '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
            transition: 'color 0.15s',
          }}
          aria-label={`Upload to ${folder.name}`}
        >
          <Plus size={13} />
        </IconButton>
      </Box>

      {/* Content area */}
      {renderContent()}
    </Box>
  );
}

const FolderRow = React.memo(FolderRowInner);
export default FolderRow;
