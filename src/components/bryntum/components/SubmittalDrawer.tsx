'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  X,
  Minus,
  Plus,
  PaperPlaneTilt,
  ClipboardText,
  CheckCircle,
  CloudArrowUp,
  WarningCircle,
  Tray,
} from '@phosphor-icons/react';
import { format, isBefore, startOfDay } from 'date-fns';

import { api } from '@/trpc/react';
import type { SlotKind } from '@/lib/validations/gantt';
import { nextSuggestedSlotName } from '@/lib/constants/slotNameLibrary';
import UserAvatar from '@/components/ui/UserAvatar';
import ApprovalToggleSwitch from './task-popover/ApprovalToggleSwitch';
import type { DocumentItem } from './task-popover/types';

const SUBMITTAL_COLOR = '#2563EB';
// Indigo signals "received, awaiting approval" — matches the "in review"
// pill convention used by FolderRow in the task popover, and intentionally
// differs from the solid green used for "approved".
const RECEIVED_COLOR = '#4f46e5';

// Optimistic slot IDs are tagged with this prefix so any code path that would
// otherwise send the placeholder ID to the server (uploads, slot updates) can
// short-circuit until the real row arrives.
const OPTIMISTIC_SLOT_ID_PREFIX = 'optimistic-';
const isOptimisticSlotId = (id: string): boolean => id.startsWith(OPTIMISTIC_SLOT_ID_PREFIX);
const INSPECTION_COLOR = '#8E44AD';

const KIND_META: Record<SlotKind, {
  label: string;
  pluralLabel: string;
  color: string;
  icon: typeof PaperPlaneTilt;
  folderId: 'submittals' | 'inspections';
  uploadCta: string;
}> = {
  submittal: {
    label: 'submittal',
    pluralLabel: 'submittals',
    color: SUBMITTAL_COLOR,
    icon: PaperPlaneTilt,
    folderId: 'submittals',
    uploadCta: 'Upload submittal',
  },
  inspection: {
    label: 'inspection',
    pluralLabel: 'inspections',
    color: INSPECTION_COLOR,
    icon: ClipboardText,
    folderId: 'inspections',
    uploadCta: 'Upload report',
  },
};

interface SubmittalDrawerProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  projectId: string;
  taskId: string;
  taskName: string;
  /** Current user's org-membership role — gates the inline approval toggle. */
  memberRole: string;
  initialKind?: SlotKind;
  /** Documents already uploaded under this task — used for the tab badge counts. */
  docsByKind: Record<SlotKind, DocumentItem[]>;
  /**
   * Open the upload dialog for a given folder. Pass a `slotId` to bind the
   * upload to a specific slot; omit it to let the server auto-link to the
   * first empty slot.
   */
  onUploadToFolder: (folderId: 'submittals' | 'inspections', slotId?: string) => void;
}

export default function SubmittalDrawer({
  open,
  onClose,
  organizationId,
  projectId,
  taskId,
  taskName,
  memberRole,
  initialKind = 'submittal',
  docsByKind,
  onUploadToFolder,
}: SubmittalDrawerProps) {
  const [activeKind, setActiveKind] = useState<SlotKind>(initialKind);

  // Reset to the requested kind whenever the drawer (re)opens.
  useEffect(() => {
    if (open) setActiveKind(initialKind);
  }, [open, initialKind]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      // Sit above the task popover (MUI Popover default is 1300).
      sx={{ zIndex: 1500 }}
      PaperProps={{
        sx: {
          width: 480,
          maxWidth: '100vw',
          bgcolor: 'background.paper',
        },
      }}
    >
      <DrawerHeader
        kind={activeKind}
        taskName={taskName}
        onClose={onClose}
      />

      <KindTabs
        activeKind={activeKind}
        onChange={setActiveKind}
        countSubmittal={docsByKind.submittal.length}
        countInspection={docsByKind.inspection.length}
      />

      <DrawerContent
        organizationId={organizationId}
        projectId={projectId}
        taskId={taskId}
        memberRole={memberRole}
        kind={activeKind}
        onUploadToFolder={(slotId) => onUploadToFolder(KIND_META[activeKind].folderId, slotId)}
      />
    </Drawer>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Header
// ────────────────────────────────────────────────────────────────────────────
function DrawerHeader({
  kind,
  taskName,
  onClose,
}: {
  kind: SlotKind;
  taskName: string;
  onClose: () => void;
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 2.5,
        py: 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '8px',
          bgcolor: `${meta.color}1F`,
          color: meta.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 0.2s, color 0.2s',
        }}
      >
        <Icon size={14} weight="regular" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.005em' }}>
          Manage {meta.pluralLabel}
        </Typography>
        <Typography
          sx={{
            fontSize: 11,
            color: 'text.secondary',
            mt: 0.25,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {taskName}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }} aria-label="Close drawer">
        <X size={16} />
      </IconButton>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tab toggle
// ────────────────────────────────────────────────────────────────────────────
function KindTabs({
  activeKind,
  onChange,
  countSubmittal,
  countInspection,
}: {
  activeKind: SlotKind;
  onChange: (k: SlotKind) => void;
  countSubmittal: number;
  countInspection: number;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.25,
        px: 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <KindTab kind="submittal" active={activeKind === 'submittal'} onClick={() => onChange('submittal')} count={countSubmittal} />
      <KindTab kind="inspection" active={activeKind === 'inspection'} onClick={() => onChange('inspection')} count={countInspection} />
    </Box>
  );
}

function KindTab({
  kind,
  active,
  onClick,
  count,
}: {
  kind: SlotKind;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.875,
        px: 1.5,
        py: 1.25,
        background: 'transparent',
        border: 'none',
        borderBottom: '2px solid',
        borderColor: active ? meta.color : 'transparent',
        marginBottom: '-1px',
        cursor: 'pointer',
        color: active ? meta.color : 'text.secondary',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 500,
        transition: 'color 0.15s, border-color 0.15s',
        '&:hover': { color: active ? meta.color : 'text.primary' },
      }}
    >
      <Icon size={13} weight={active ? 'fill' : 'regular'} />
      {meta.pluralLabel.charAt(0).toUpperCase() + meta.pluralLabel.slice(1)}
      <Box
        sx={{
          fontSize: 10,
          fontWeight: 600,
          px: 0.875,
          py: '1px',
          borderRadius: '999px',
          bgcolor: active ? `${meta.color}1F` : 'action.selected',
          color: active ? meta.color : 'text.secondary',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </Box>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Body — required count stepper + slot list
// ────────────────────────────────────────────────────────────────────────────
function DrawerContent({
  organizationId,
  projectId,
  taskId,
  memberRole,
  kind,
  onUploadToFolder,
}: {
  organizationId: string;
  projectId: string;
  taskId: string;
  memberRole: string;
  kind: SlotKind;
  onUploadToFolder: (slotId?: string) => void;
}) {
  const meta = KIND_META[kind];
  const utils = api.useUtils();

  const slotsQuery = api.gantt.listSlots.useQuery(
    { organizationId, projectId, taskId, kind },
    { enabled: !!organizationId && !!projectId && !!taskId },
  );
  const slots = slotsQuery.data ?? [];

  const setCountMutation = api.gantt.setSlotCount.useMutation({
    // Optimistically reshape the slot list so the UI updates instantly instead
    // of waiting for the server round trip + three query invalidations.
    onMutate: async ({ count }) => {
      const queryKey = { organizationId, projectId, taskId, kind };
      await utils.gantt.listSlots.cancel(queryKey);
      const previous = utils.gantt.listSlots.getData(queryKey);

      utils.gantt.listSlots.setData(queryKey, (current) => {
        const prev = current ?? [];
        if (count === prev.length) return prev;
        if (count < prev.length) return prev.slice(0, count);
        // Mirror the server's name-picking so the placeholder matches the
        // value that will arrive on reconcile (no visible name flip).
        const existingNames: (string | null)[] = prev.map((s) => s.name);
        const now = new Date();
        const baseId = `${OPTIMISTIC_SLOT_ID_PREFIX}${now.getTime()}`;
        const additions = Array.from({ length: count - prev.length }, (_, i) => {
          const name = nextSuggestedSlotName(kind, existingNames);
          existingNames.push(name);
          return {
            id: `${baseId}-${i}`,
            taskId,
            kind,
            index: prev.length + i,
            name,
            dueDate: null,
            createdAt: now,
            updatedAt: now,
            document: null,
          };
        });
        return [...prev, ...additions];
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        utils.gantt.listSlots.setData(
          { organizationId, projectId, taskId, kind },
          ctx.previous,
        );
      }
    },
    onSettled: () => {
      void utils.gantt.listSlots.invalidate({ organizationId, projectId, taskId, kind });
      void utils.gantt.taskDetail.invalidate({ organizationId, projectId, taskId });
      void utils.gantt.requirementStats.invalidate({ projectId });
    },
  });

  const updateSlotMutation = api.gantt.updateSlot.useMutation({
    onSuccess: () => {
      void utils.gantt.listSlots.invalidate({ organizationId, projectId, taskId, kind });
    },
  });

  // Decrement-with-data confirm state.
  const [confirmRemove, setConfirmRemove] = useState<null | { trailingFilled: number; nextCount: number }>(null);

  // "Filled" now means a slot has a bound document via Document.slotId — no
  // more docs[i]↔slot[i] positional pairing.
  const filledCount = slots.reduce((n, s) => n + (s.document ? 1 : 0), 0);

  const handleStepCount = (next: number) => {
    if (next < 0 || next > 50) return;
    if (next < slots.length) {
      // Removing trailing slots — warn if any are bound. The FK is ON DELETE
      // SET NULL, so the documents survive (just become unbound); the warning
      // is about the user's intent, not data loss.
      const trailingFilled = slots
        .slice(next)
        .reduce((n, s) => n + (s.document ? 1 : 0), 0);
      if (trailingFilled > 0) {
        setConfirmRemove({ trailingFilled, nextCount: next });
        return;
      }
    }
    setCountMutation.mutate({ organizationId, projectId, taskId, kind, count: next });
  };

  const confirmAndShrink = () => {
    if (!confirmRemove) return;
    setCountMutation.mutate({
      organizationId,
      projectId,
      taskId,
      kind,
      count: confirmRemove.nextCount,
    });
    setConfirmRemove(null);
  };

  const isLoading = slotsQuery.isLoading;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>

        {/* Required count card */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            px: 1.75,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.75,
            bgcolor: 'background.default',
            mb: 2.25,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>
              Required {meta.pluralLabel}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25, lineHeight: 1.3 }}>
              How many must be received for this task
            </Typography>
          </Box>
          <Stepper
            value={slots.length}
            onChange={handleStepCount}
            disabled={isLoading}
          />
        </Box>

        {/* Section label */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.25 }}>
          <Typography
            sx={{
              fontSize: '0.5625rem',
              fontWeight: 600,
              color: 'text.secondary',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Slots
          </Typography>
          <Typography sx={{ ml: 'auto', fontSize: 11, color: 'text.secondary' }}>
            <SlotSummary slots={slots} filledCount={filledCount} />
          </Typography>
        </Box>

        {/* Slot list / empty state */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={16} />
          </Box>
        ) : slots.length === 0 ? (
          <EmptyState kind={kind} onSeed={(count) => setCountMutation.mutate({ organizationId, projectId, taskId, kind, count })} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {slots.map((slot) => {
              const isPending = isOptimisticSlotId(slot.id);
              return (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  kind={kind}
                  doc={slot.document}
                  organizationId={organizationId}
                  memberRole={memberRole}
                  // Optimistic rows hold placeholder IDs that don't exist on
                  // the server yet — block any action that would send the ID.
                  isPending={isPending}
                  onRename={(name) => {
                    if (isPending) return;
                    updateSlotMutation.mutate({ organizationId, projectId, slotId: slot.id, name });
                  }}
                  onSetDueDate={(dueDate) => {
                    if (isPending) return;
                    updateSlotMutation.mutate({ organizationId, projectId, slotId: slot.id, dueDate });
                  }}
                  onUpload={() => {
                    if (isPending) return;
                    onUploadToFolder(slot.id);
                  }}
                />
              );
            })}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 2.5,
          py: 1.25,
          bgcolor: 'background.default',
        }}
      >
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Changes save automatically · close to return to the task
        </Typography>
      </Box>

      {/* Decrement confirm */}
      {confirmRemove && (
        <ConfirmRemoveDialog
          trailingFilled={confirmRemove.trailingFilled}
          kind={kind}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={confirmAndShrink}
        />
      )}
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stepper
// ────────────────────────────────────────────────────────────────────────────
function Stepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <IconButton
        size="small"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 0}
        sx={{ width: 30, height: 32, borderRadius: 0, color: 'text.secondary' }}
        aria-label="Decrease required count"
      >
        <Minus size={11} weight="bold" />
      </IconButton>
      <Box
        sx={{
          width: 38,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          borderLeft: '1px solid',
          borderRight: '1px solid',
          borderColor: 'divider',
          lineHeight: '32px',
        }}
      >
        {value}
      </Box>
      <IconButton
        size="small"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= 50}
        sx={{ width: 30, height: 32, borderRadius: 0, color: 'text.secondary' }}
        aria-label="Increase required count"
      >
        <Plus size={11} weight="bold" />
      </IconButton>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Slot summary text
// ────────────────────────────────────────────────────────────────────────────
function SlotSummary({
  slots,
  filledCount,
}: {
  slots: { dueDate: Date | null; document: { id: string } | null }[];
  filledCount: number;
}) {
  const today = startOfDay(new Date());
  // FK semantics: a slot is overdue when its dueDate has passed and it has
  // no bound document. Position no longer determines filled-ness.
  const overdue = slots.filter(
    (s) => !s.document && s.dueDate && isBefore(new Date(s.dueDate), today),
  ).length;
  const pending = slots.length - filledCount;
  const parts: React.ReactNode[] = [];
  if (filledCount > 0) {
    parts.push(
      <Box key="r" component="span" sx={{ color: RECEIVED_COLOR, fontWeight: 600 }}>
        {filledCount} received
      </Box>,
    );
  }
  if (overdue > 0) {
    parts.push(
      <Box key="o" component="span" sx={{ color: 'warning.main', fontWeight: 600 }}>
        {overdue} overdue
      </Box>,
    );
  }
  if (pending - overdue > 0) {
    parts.push(
      <span key="p">{pending - overdue} pending</span>,
    );
  }
  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 ? ' · ' : null}
          {part}
        </React.Fragment>
      ))}
      {parts.length === 0 ? '—' : null}
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Slot card
// ────────────────────────────────────────────────────────────────────────────
type SlotData = {
  id: string;
  index: number;
  name: string | null;
  dueDate: Date | null;
};

// SlotCard only renders the bound document's name + upload date in the
// footer, so we type doc minimally to accept whatever listSlots returns.
type SlotBoundDoc = {
  id: string;
  name: string;
  createdAt: Date | string | null;
  approvalStatus: string;
  approvedAt: Date | string | null;
  approvedBy: { id: string; name: string | null; email: string } | null;
};

function SlotCard({
  slot,
  kind,
  doc,
  organizationId,
  memberRole,
  isPending = false,
  onRename,
  onSetDueDate,
  onUpload,
}: {
  slot: SlotData;
  kind: SlotKind;
  doc: SlotBoundDoc | null;
  organizationId: string;
  memberRole: string;
  /** True while the slot row is an optimistic placeholder (server hasn't returned the real id yet). */
  isPending?: boolean;
  onRename: (name: string | null) => void;
  onSetDueDate: (dueDate: string | null) => void;
  onUpload: () => void;
}) {
  const meta = KIND_META[kind];
  const isReceived = !!doc;
  const isApproved = isReceived && doc.approvalStatus === 'approved';
  const isOverdue = !isReceived && slot.dueDate && isBefore(new Date(slot.dueDate), startOfDay(new Date()));

  // Local input state so typing doesn't fire a mutation per keystroke.
  const [draftName, setDraftName] = useState(slot.name ?? '');
  useEffect(() => setDraftName(slot.name ?? ''), [slot.name]);

  const commitName = () => {
    const trimmed = draftName.trim();
    const next = trimmed.length === 0 ? null : trimmed;
    if (next === slot.name) return;
    onRename(next);
  };

  // Native date input — local state so calendar picker doesn't fire mid-edit.
  const [draftDue, setDraftDue] = useState(slot.dueDate ? toInputDate(slot.dueDate) : '');
  useEffect(() => setDraftDue(slot.dueDate ? toInputDate(slot.dueDate) : ''), [slot.dueDate]);
  const commitDue = () => {
    const next = draftDue || null;
    const current = slot.dueDate ? toInputDate(slot.dueDate) : null;
    if (next === current) return;
    onSetDueDate(next);
  };

  // Due date is optional — collapsed to a "+ Add due date" button until the
  // user opts in or a value already exists on the slot.
  const [dueDateExpanded, setDueDateExpanded] = useState(false);
  const dueDateInputRef = useRef<HTMLInputElement | null>(null);
  const showDueDateField = !!slot.dueDate || dueDateExpanded;

  // Tint hierarchy: approved (green) > received (indigo) > overdue (amber).
  // Received-but-not-approved is intentionally distinct from approved so the
  // reviewer can tell at a glance which slots still need their decision.
  const cardTintColor = isApproved
    ? 'var(--mui-palette-success-main, #16a34a)'
    : isReceived
      ? RECEIVED_COLOR
      : isOverdue
        ? 'var(--mui-palette-warning-main, #d97706)'
        : null;
  // Only overdue gets a colored border — received/approved rely on tint + pill
  // for their visual signal so the cards don't shout for attention.
  const cardBorderColor = isOverdue ? 'warning.main' : 'divider';

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: cardBorderColor,
        borderRadius: '10px',
        px: 1.75,
        py: 1.5,
        bgcolor: 'background.paper',
        position: 'relative',
        // Subtle tint conveys state without losing the white surface.
        backgroundImage: cardTintColor
          ? `linear-gradient(0deg, var(--mui-palette-background-paper, #fff), var(--mui-palette-background-paper, #fff))`
          : 'none',
        '&::before': cardTintColor ? {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: '10px',
          bgcolor: cardTintColor,
          opacity: isReceived && !isApproved ? 0.04 : 0.05,
          pointerEvents: 'none',
        } : undefined,
        transition: 'border-color 0.15s',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25, position: 'relative' }}>
        <SlotNumberBadge index={slot.index} kind={kind} isReceived={isReceived} isApproved={isApproved} />
        <SlotNameInput
          value={draftName}
          onChange={setDraftName}
          onCommit={commitName}
          placeholder={`Name this ${meta.label}…`}
          color={meta.color}
        />
        <SlotStatusPill received={isReceived} overdue={!!isOverdue} approved={isApproved} />
      </Box>

      <Box sx={{ position: 'relative' }}>
        {showDueDateField ? (
          <FieldSlot label="Due date">
            <Box
              ref={dueDateInputRef}
              component="input"
              type="date"
              value={draftDue}
              onChange={(e) => setDraftDue(e.target.value)}
              onBlur={commitDue}
              sx={{
                fontFamily: 'inherit',
                fontSize: 12,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '6px',
                bgcolor: 'background.default',
                color: isOverdue ? 'warning.main' : 'text.primary',
                px: 1,
                py: 0.75,
                outline: 'none',
                width: '100%',
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: 'text.disabled' },
                '&:focus': { borderColor: meta.color },
              }}
            />
          </FieldSlot>
        ) : (
          <Box
            component="button"
            type="button"
            onClick={() => {
              setDueDateExpanded(true);
              // Defer focus until after the input mounts.
              requestAnimationFrame(() => dueDateInputRef.current?.focus());
            }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.5,
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 500,
              color: 'text.secondary',
              bgcolor: 'transparent',
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s, background-color 0.15s',
              '&:hover': {
                color: meta.color,
                borderColor: meta.color,
                bgcolor: `${meta.color}0F`,
              },
            }}
          >
            <Plus size={11} weight="bold" />
            Add due date
          </Box>
        )}
      </Box>

      {/* Footer: file info or upload CTA */}
      <Box
        sx={{
          mt: 1.25,
          pt: 1.25,
          borderTop: '1px dashed',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: 11,
          position: 'relative',
        }}
      >
        {isReceived ? (
          <>
            {isApproved ? (
              <CheckCircle size={13} weight="fill" color="var(--mui-palette-success-main, #16a34a)" />
            ) : (
              <Tray size={13} weight="fill" color={RECEIVED_COLOR} />
            )}
            <Box sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 500,
            }}>
              {doc.name}
            </Box>
            <ApprovalToggleSwitch
              documentId={doc.id}
              documentName={doc.name}
              approvalStatus={doc.approvalStatus}
              approvedBy={doc.approvedBy}
              organizationId={organizationId}
              memberRole={memberRole}
              size="sm"
            />
            <Box sx={{ color: 'text.secondary', flexShrink: 0 }}>
              {doc.createdAt ? format(new Date(doc.createdAt), 'MMM d') : ''}
            </Box>
          </>
        ) : (
          <Box
            component="button"
            type="button"
            onClick={onUpload}
            disabled={isPending}
            aria-label={isPending ? 'Saving slot…' : meta.uploadCta}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              border: 'none',
              background: 'transparent',
              cursor: isPending ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 500,
              color: meta.color,
              opacity: isPending ? 0.5 : 1,
              p: 0,
              '&:hover': { textDecoration: isPending ? 'none' : 'underline' },
            }}
          >
            <CloudArrowUp size={13} />
            {isPending ? 'Saving…' : meta.uploadCta}
          </Box>
        )}
      </Box>

      {isApproved && doc && <ApprovedByLine doc={doc} />}

    </Box>
  );
}

function ApprovedByLine({ doc }: { doc: SlotBoundDoc }) {
  const approver = doc.approvedBy;
  const approverLabel = approver?.name ?? approver?.email ?? 'a reviewer';
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        mt: 1,
        pt: 1,
        borderTop: '1px solid',
        borderColor: 'rgba(22,163,74,0.18)',
        fontSize: 10.5,
        color: 'success.main',
        fontWeight: 500,
      }}
    >
      {approver ? (
        <UserAvatar user={approver} size={16} sx={{ fontSize: 9 }} />
      ) : (
        <CheckCircle size={14} weight="fill" />
      )}
      <Box component="span">Approved by {approverLabel}</Box>
      {doc.approvedAt && (
        <>
          <Box component="span" sx={{ color: 'text.disabled' }}>·</Box>
          <Box component="span" sx={{ color: 'text.secondary' }}>
            {format(new Date(doc.approvedAt), 'MMM d')}
          </Box>
        </>
      )}
    </Box>
  );
}

function SlotNumberBadge({
  index,
  kind,
  isReceived,
  isApproved,
}: {
  index: number;
  kind: SlotKind;
  isReceived: boolean;
  isApproved: boolean;
}) {
  const meta = KIND_META[kind];
  // Approved → solid green ✓. Received (not approved) → solid indigo inbox.
  // Empty slot → soft folder-tinted disc with the slot number.
  const bg = isApproved
    ? 'var(--mui-palette-success-main, #16a34a)'
    : isReceived
      ? RECEIVED_COLOR
      : `${meta.color}1F`;
  const color = isReceived ? '#fff' : meta.color;
  return (
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        bgcolor: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        flexShrink: 0,
        boxShadow: isApproved
          ? '0 0 0 3px rgba(22,163,74,0.20)'
          : isReceived
            ? '0 0 0 3px rgba(79,70,229,0.18)'
            : 'none',
        transition: 'box-shadow 0.15s, background-color 0.2s',
      }}
    >
      {isApproved ? (
        <CheckCircle size={12} weight="fill" />
      ) : isReceived ? (
        <Tray size={12} weight="fill" />
      ) : (
        index + 1
      )}
    </Box>
  );
}

function SlotNameInput({
  value,
  onChange,
  onCommit,
  placeholder,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
  placeholder: string;
  color: string;
}) {
  return (
    <Box
      component="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      placeholder={placeholder}
      sx={{
        flex: 1,
        minWidth: 0,
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 500,
        background: 'transparent',
        border: 'none',
        borderBottom: '1px dashed transparent',
        outline: 'none',
        color: 'text.primary',
        py: 0.5,
        '&::placeholder': { color: 'text.disabled', fontStyle: 'italic' },
        '&:hover': { borderBottomColor: 'divider' },
        '&:focus': { borderBottomColor: color },
      }}
    />
  );
}

function FieldSlot({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 9,
          fontWeight: 600,
          color: 'text.disabled',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function SlotStatusPill({
  received,
  overdue,
  approved,
}: {
  received: boolean;
  overdue: boolean;
  approved: boolean;
}) {
  // Approved → solid green pill with ✓ (the "done" signal).
  // Received → indigo pill with a soft tint + indigo border + inbox icon (the
  //   "awaiting your decision" signal — visually distinct from approved).
  // Overdue → amber tint, no icon.
  // Pending → neutral gray, no icon.
  const config = approved
    ? {
        label: 'Approved',
        bg: 'success.main',
        color: 'success.contrastText',
        borderColor: 'transparent',
        icon: <CheckCircle size={11} weight="fill" />,
      }
    : received
      ? {
          label: 'Received',
          bg: 'rgba(79,70,229,0.10)',
          color: RECEIVED_COLOR,
          borderColor: 'rgba(79,70,229,0.30)',
          icon: <Tray size={11} weight="bold" />,
        }
      : overdue
        ? {
            label: 'Overdue',
            bg: 'rgba(217,119,6,0.14)',
            color: 'warning.main',
            borderColor: 'transparent',
            icon: null,
          }
        : {
            label: 'Pending',
            bg: 'action.selected',
            color: 'text.secondary',
            borderColor: 'transparent',
            icon: null,
          };
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: 10,
        fontWeight: 600,
        px: 0.875,
        py: '2px',
        borderRadius: '999px',
        bgcolor: config.bg,
        color: config.color,
        border: '1px solid',
        borderColor: config.borderColor,
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {config.icon}
      {config.label}
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Empty state with quick-seed buttons
// ────────────────────────────────────────────────────────────────────────────
function EmptyState({
  kind,
  onSeed,
}: {
  kind: SlotKind;
  onSeed: (count: number) => void;
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const presets = [1, 3, 5];
  return (
    <Box
      sx={{
        border: '1.5px dashed',
        borderColor: 'divider',
        borderRadius: '12px',
        px: 2.5,
        py: 4,
        textAlign: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.25,
          color: 'text.disabled',
        }}
      >
        <Icon size={20} />
      </Box>
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
        No {meta.pluralLabel} required
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1.5, lineHeight: 1.5 }}>
        Use the stepper above, or pick a starting count below.
      </Typography>
      <Box sx={{ display: 'inline-flex', gap: 0.75 }}>
        {presets.map((n) => (
          <Box
            key={n}
            component="button"
            onClick={() => onSeed(n)}
            sx={{
              px: 1.25,
              py: 0.625,
              borderRadius: '7px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              color: 'text.primary',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              '&:hover': { borderColor: meta.color, color: meta.color },
            }}
          >
            {n} {n === 1 ? meta.label : meta.pluralLabel}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Confirm dialog for destructive shrink
// ────────────────────────────────────────────────────────────────────────────
function ConfirmRemoveDialog({
  trailingFilled,
  kind,
  onCancel,
  onConfirm,
}: {
  trailingFilled: number;
  kind: SlotKind;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const meta = KIND_META[kind];
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: 'rgba(0,0,0,0.32)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
      }}
      onClick={onCancel}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: 360,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '12px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          p: 2.25,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.5 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '10px',
              bgcolor: 'rgba(217,119,6,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <WarningCircle size={18} color="var(--mui-palette-warning-main, #d97706)" weight="fill" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>Remove filled slot?</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
              {trailingFilled === 1 ? '1 slot has' : `${trailingFilled} slots have`} an uploaded {meta.label}.
              Removing will detach the file{trailingFilled === 1 ? '' : 's'} from the slot but keep
              {trailingFilled === 1 ? ' it' : ' them'} in the project's library.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Box
            component="button"
            onClick={onCancel}
            sx={{
              px: 1.5, py: 0.875,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              fontFamily: 'inherit',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </Box>
          <Box
            component="button"
            onClick={onConfirm}
            sx={{
              px: 1.5, py: 0.875,
              borderRadius: '8px',
              border: '1px solid',
              borderColor: 'warning.main',
              bgcolor: 'warning.main',
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              '&:hover': { filter: 'brightness(0.95)' },
            }}
          >
            Remove
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function toInputDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return format(date, 'yyyy-MM-dd');
}
