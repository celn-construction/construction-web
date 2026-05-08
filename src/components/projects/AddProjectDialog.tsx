'use client';

import { useState, useEffect } from 'react';
import { Dialog, alpha, Box, Typography } from '@mui/material';
import { Check } from '@phosphor-icons/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useOrgFromUrl } from '@/hooks/useOrgFromUrl';
import { useSession } from '@/lib/auth-client';
import { api } from '@/trpc/react';
import ProjectFormBody from '@/components/projects/ProjectFormBody';
import AddProjectMembersStep from '@/components/projects/AddProjectMembersStep';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'create' | 'members';

interface CreatedProject {
  id: string;
  slug: string;
  name: string;
}

export default function AddProjectDialog({
  open,
  onOpenChange,
}: AddProjectDialogProps) {
  const { orgSlug, activeOrganizationId } = useOrgFromUrl();
  const { data: session } = useSession();
  const { showSnackbar } = useSnackbar();
  const currentUserId = session?.user?.id;

  const [step, setStep] = useState<Step>('create');
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(
    null
  );

  // Reset step state whenever dialog re-opens
  useEffect(() => {
    if (open) {
      setStep('create');
      setCreatedProject(null);
    }
  }, [open]);

  // Pre-fetch org members so we can decide whether to skip step 2
  const { data: orgMembers, isSuccess: orgMembersLoaded } =
    api.member.list.useQuery(
      { organizationId: activeOrganizationId },
      { enabled: open && !!activeOrganizationId }
    );

  // Only treat the org as confirmed-empty after a successful query resolves.
  // While the query is in-flight we err toward showing step 2 (which has its
  // own empty state) so the members step is never silently skipped.
  const confirmedNoOtherMembers =
    orgMembersLoaded &&
    !!currentUserId &&
    orgMembers.filter((m) => m.user.id !== currentUserId).length === 0;

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleProjectCreated = (project: CreatedProject) => {
    setCreatedProject(project);
    if (currentUserId && !confirmedNoOtherMembers) {
      setStep('members');
    } else {
      showSnackbar(
        `"${project.name}" created — switch to it in the project dropdown`,
        'success'
      );
      handleClose();
    }
  };

  const handleMembersComplete = () => {
    if (createdProject) {
      showSnackbar(
        `"${createdProject.name}" is ready`,
        'success'
      );
    }
    handleClose();
  };

  const handleMembersSkip = () => {
    if (createdProject) {
      showSnackbar(
        `"${createdProject.name}" created — switch to it in the project dropdown`,
        'success'
      );
    }
    handleClose();
  };

  const showStepper = !!currentUserId && !confirmedNoOtherMembers;

  return (
    <Dialog
      open={open}
      onClose={step === 'members' ? undefined : handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 460,
          borderRadius: '16px',
          overflow: 'hidden',
          p: 3,
          boxShadow: `0 24px 64px -16px ${alpha('#000', 0.2)}, 0 8px 20px -8px ${alpha('#000', 0.08)}`,
        },
      }}
    >
      {showStepper && (
        <Stepper currentStep={step} />
      )}

      {step === 'create' && (
        <ProjectFormBody
          orgSlug={orgSlug}
          organizationId={activeOrganizationId}
          title="New project"
          subtitle="Track schedule, documents and team in one place."
          onCancel={handleClose}
          onSuccess={handleProjectCreated}
        />
      )}

      {step === 'members' && createdProject && currentUserId && (
        <AddProjectMembersStep
          projectId={createdProject.id}
          projectName={createdProject.name}
          organizationId={activeOrganizationId}
          currentUserId={currentUserId}
          onComplete={handleMembersComplete}
          onSkip={handleMembersSkip}
        />
      )}
    </Dialog>
  );
}

function Stepper({ currentStep }: { currentStep: Step }) {
  const step1Done = currentStep === 'members';
  const step2Active = currentStep === 'members';
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 0.75,
        mb: 1.5,
      }}
      aria-label={`Step ${step2Active ? 2 : 1} of 2`}
    >
      <StepDot state={step1Done ? 'done' : 'active'}>
        {step1Done ? <Check size={11} weight="bold" /> : '1'}
      </StepDot>
      <Box
        sx={{
          width: 14,
          height: 2,
          borderRadius: '1px',
          bgcolor: step1Done ? 'primary.main' : 'divider',
        }}
      />
      <StepDot state={step2Active ? 'active' : 'pending'}>2</StepDot>
    </Box>
  );
}

function StepDot({
  state,
  children,
}: {
  state: 'done' | 'active' | 'pending';
  children: React.ReactNode;
}) {
  const isFilled = state === 'done' || state === 'active';
  return (
    <Box
      sx={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        bgcolor: isFilled ? 'primary.main' : 'action.disabledBackground',
        color: isFilled ? 'primary.contrastText' : 'text.secondary',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        boxShadow: state === 'active'
          ? `0 0 0 3px ${alpha('#2B2D42', 0.08)}`
          : 'none',
      }}
    >
      {typeof children === 'string' ? (
        <Typography
          sx={{
            fontSize: '0.625rem',
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {children}
        </Typography>
      ) : (
        children
      )}
    </Box>
  );
}
