'use client';

import { Box, Typography, Divider } from '@mui/material';
import { ImageSquare, FileText, DownloadSimple, ArrowsOut } from '@phosphor-icons/react';
import { formatFileSize } from '@/lib/utils/formatting';
import { isApprovableFolder } from '@/lib/folders';
import type { PreviewDoc } from './types';
import ApprovalToggleSwitch from './ApprovalToggleSwitch';

interface FilePreviewPanelProps {
  previewDoc: PreviewDoc;
  organizationId?: string;
  memberRole?: string;
}

export default function FilePreviewPanel({
  previewDoc,
  organizationId,
  memberRole,
}: FilePreviewPanelProps) {
  const showApproval =
    isApprovableFolder(previewDoc.folderId) &&
    !!organizationId &&
    typeof memberRole === 'string';
  const approvedByName = previewDoc.approvedBy?.name ?? null;
  const approvedAtLabel = previewDoc.approvedAt
    ? new Date(previewDoc.approvedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;
  const approvedByDisplay =
    previewDoc.approvalStatus === 'approved' && (approvedByName || approvedAtLabel)
      ? [approvedByName, approvedAtLabel].filter(Boolean).join(' · ')
      : null;
  return (
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
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: '20px', py: '14px', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          {previewDoc.mimeType.startsWith('image/') ? (
            <ImageSquare size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          ) : (
            <FileText size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          )}
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
            {previewDoc.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
          {showApproval && (
            <ApprovalToggleSwitch
              documentId={previewDoc.id}
              documentName={previewDoc.name}
              approvalStatus={previewDoc.approvalStatus}
              approvedBy={previewDoc.approvedBy}
              organizationId={organizationId!}
              memberRole={memberRole!}
              size="md"
            />
          )}
          {[
            { icon: DownloadSimple, label: 'Download' },
            { icon: ArrowsOut, label: 'Expand' },
          ].map(({ icon: Icon, label }) => (
            <Box
              key={label}
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
              aria-label={label}
            >
              <Icon size={14} />
            </Box>
          ))}
        </Box>
      </Box>

      <Divider />

      {/* Preview area */}
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
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <FileText size={48} color="var(--text-secondary)" />
        )}
      </Box>

      <Divider />

      {/* Metadata */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, px: '20px', py: '12px' }}>
        {previewDoc.uploadedBy?.name && (
          <MetaRow label="Uploaded by" value={previewDoc.uploadedBy.name} hasBorder />
        )}
        {approvedByDisplay && (
          <MetaRow label="Approved by" value={approvedByDisplay} hasBorder />
        )}
        <MetaRow
          label="Date"
          value={new Date(previewDoc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          hasBorder
        />
        <MetaRow label="Size" value={formatFileSize(previewDoc.size)} hasBorder />
        <MetaRow
          label="Type"
          value={previewDoc.mimeType.split('/')[1]?.toUpperCase() ?? previewDoc.mimeType}
        />
      </Box>
    </Box>
  );
}

function MetaRow({ label, value, hasBorder }: { label: string; value: string; hasBorder?: boolean }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: '8px',
        ...(hasBorder && { borderBottom: '1px solid', borderBottomColor: 'divider' }),
      }}
    >
      <Typography sx={{ fontSize: '0.625rem', fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
        {value}
      </Typography>
    </Box>
  );
}
