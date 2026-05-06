'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Tabs, Tab, ToggleButton, ToggleButtonGroup, Alert } from '@mui/material';
import { SealCheck, Clock } from '@phosphor-icons/react';
import { api } from '@/trpc/react';
import { useProjectContext } from '@/components/providers/ProjectProvider';
import { useOrgContext } from '@/components/providers/OrgProvider';
import { canApproveDocuments } from '@/lib/permissions';
import ReviewCard, { type ReviewDocument } from './ReviewCard';

type StatusTab = 'unapproved' | 'approved';
type CategoryFilter = 'all' | 'submittals' | 'inspections';

export default function ReviewQueueContent() {
  const { projectId, projectName, organizationId } = useProjectContext();
  const { memberRole } = useOrgContext();
  const canApprove = canApproveDocuments(memberRole);

  const [status, setStatus] = useState<StatusTab>('unapproved');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const { data: summary } = api.approval.summary.useQuery(
    { organizationId, projectId },
    { enabled: !!organizationId && !!projectId },
  );

  const { data, isLoading } = api.approval.listAll.useQuery(
    { organizationId, projectId, status, category },
    { enabled: !!organizationId && !!projectId },
  );

  const documents = (data?.documents ?? []) as ReviewDocument[];
  const pendingCount = summary?.pending ?? 0;
  const approvedCount = summary?.approved ?? 0;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      sx={{ p: 3 }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Review Queue
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {projectName}
        </Typography>
      </Box>

      {!canApprove && (
        <Alert severity="info" sx={{ mb: 3, fontSize: 13 }}>
          You can view items here, but only owners, admins, and project managers can approve them.
        </Alert>
      )}

      {/* Status Tabs */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={status}
          onChange={(_, v: StatusTab) => setStatus(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '0.875rem', minHeight: 40 },
          }}
        >
          <Tab
            value="unapproved"
            iconPosition="start"
            icon={<Clock size={14} />}
            label={`Pending (${pendingCount})`}
          />
          <Tab
            value="approved"
            iconPosition="start"
            icon={<SealCheck size={14} />}
            label={`Approved (${approvedCount})`}
          />
        </Tabs>
      </Box>

      {/* Category filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <ToggleButtonGroup
          value={category}
          exclusive
          onChange={(_, v: CategoryFilter | null) => v && setCategory(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              fontSize: 12,
              px: 1.5,
              py: 0.5,
              border: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="submittals">Submittals</ToggleButton>
          <ToggleButton value="inspections">Inspections</ToggleButton>
        </ToggleButtonGroup>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {documents.length} item{documents.length === 1 ? '' : 's'}
        </Typography>
      </Box>

      {/* Body */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                height: 72,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'action.hover',
                opacity: 0.5,
              }}
            />
          ))}
        </Box>
      ) : documents.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            textAlign: 'center',
            gap: 1,
          }}
        >
          <SealCheck size={40} weight="duotone" />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            {status === 'unapproved' ? 'Nothing waiting on you' : 'No approved items yet'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {status === 'unapproved'
              ? 'New submittals and inspections will appear here.'
              : 'Once items are approved they will show up here.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {documents.map((doc) => (
            <ReviewCard
              key={doc.id}
              doc={doc}
              organizationId={organizationId}
              projectId={projectId}
              memberRole={memberRole}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
