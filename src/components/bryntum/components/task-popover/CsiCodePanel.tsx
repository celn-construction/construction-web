'use client';

import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import {
  Tag,
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  Check,
  X,
  Prohibit,
} from '@phosphor-icons/react';
import { Box, Typography, IconButton, InputBase, Divider } from '@mui/material';
import { useSnackbar } from '@/hooks/useSnackbar';
import {
  CSI_TREE,
  CSI_SUBDIVISION_MAP,
  type CsiSection,
} from '@/lib/constants/csiCodes';
import type { BryntumGanttInstance } from '../../types';

// Caps applied only while searching (the tree is force-expanded then, so an
// unbounded query like a single letter would otherwise render thousands of rows).
const MAX_GROUPS_PER_DIV = 25;
const MAX_SECTIONS_PER_GROUP = 12;

// ─── Level-3 section row ────────────────────────────────────────────────
interface SectionItemProps {
  section: CsiSection;
  isSelected: boolean;
  onSelect: (code: string) => void;
}

const SectionItem = memo(function SectionItem({
  section,
  isSelected,
  onSelect,
}: SectionItemProps) {
  return (
    <Box
      component="div"
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      onClick={() => onSelect(section.code)}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(section.code);
        }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        pl: 6,
        pr: 2,
        py: '5px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background-color 0.1s',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: isSelected ? 'action.selected' : 'action.hover',
        },
        '&::before': isSelected
          ? {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '2.5px',
              height: 16,
              borderRadius: '0 2px 2px 0',
              bgcolor: 'sidebar.indicator',
            }
          : undefined,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 500,
          color: isSelected ? 'text.primary' : 'text.secondary',
          minWidth: 52,
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.02em',
        }}
      >
        {section.code}
      </Typography>
      <Typography
        component="span"
        sx={{
          fontSize: '0.75rem',
          fontWeight: isSelected ? 550 : 400,
          color: isSelected ? 'text.primary' : 'text.secondary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }}
      >
        {section.name}
      </Typography>
      {isSelected && (
        <Check
          size={12}
          weight="bold"
          color="var(--sidebar-indicator)"
          style={{ flexShrink: 0 }}
        />
      )}
    </Box>
  );
});

// ─── Filtering helpers ──────────────────────────────────────────────────
interface GroupView {
  code: string;
  name: string;
  sections: CsiSection[]; // sections to render for the current view
  hasChildren: boolean; // group has any Level-3 children at all (controls caret)
}

interface DivisionView {
  code: string;
  name: string;
  groups: GroupView[];
  leafCount: number; // selectable codes shown (groups + sections)
}

// ─── Main panel ─────────────────────────────────────────────────────────
interface CsiCodePanelProps {
  csiCode: string | null | undefined;
  taskId: string;
  ganttInstance: BryntumGanttInstance | null;
  /**
   * Called with the newly-written code the moment it's set on the Bryntum
   * record, so the parent can show an optimistic + saving state on the chip
   * while autoSync persists it. `null` signals a removal.
   */
  onCodeChange?: (code: string | null) => void;
  onClose: () => void;
}

export default function CsiCodePanel({
  csiCode,
  taskId,
  ganttInstance,
  onCodeChange,
  onClose,
}: CsiCodePanelProps) {
  const { showSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [expandedDivision, setExpandedDivision] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [optimisticCode, setOptimisticCode] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (optimisticCode !== undefined && csiCode === optimisticCode) {
      setOptimisticCode(undefined);
    }
  }, [csiCode, optimisticCode]);

  const displayCode = optimisticCode !== undefined ? optimisticCode : csiCode;

  // Auto-expand the division — and the Level-2 group — containing the current
  // code so the selected row is visible when the panel opens.
  useEffect(() => {
    if (!displayCode) return;
    const subEntry = CSI_SUBDIVISION_MAP.get(displayCode);
    if (!subEntry) return;
    setExpandedDivision(subEntry.division.code);
    const yy = displayCode.split(' ')[1] ?? '00';
    const isGroupPair = yy === '00' || yy[0] === '0' || yy[1] === '0';
    if (!isGroupPair) {
      // Level-3 code — expand its parent Level-2 heading.
      const parentCode = `${subEntry.division.code} ${yy[0]}0 00`;
      setExpandedGroups((prev) => {
        if (prev.has(parentCode)) return prev;
        const next = new Set(prev);
        next.add(parentCode);
        return next;
      });
    }
  }, [displayCode]);

  const query = search.toLowerCase();
  const isSearching = query.length > 0;

  const displayDivisions = useMemo<DivisionView[]>(() => {
    const result: DivisionView[] = [];

    for (const div of CSI_TREE) {
      const divMatches =
        !query || div.code.includes(query) || div.nameLower.includes(query);

      const groupViews: GroupView[] = [];
      let leafCount = 0;

      for (const group of div.groups) {
        const hasChildren = group.sections.length > 0;

        if (!query || divMatches) {
          // Show the whole group (heading + all its sections).
          const sections = isSearching
            ? group.sections.slice(0, MAX_SECTIONS_PER_GROUP)
            : group.sections;
          groupViews.push({
            code: group.code,
            name: group.name,
            sections,
            hasChildren,
          });
          leafCount += 1 + sections.length;
          continue;
        }

        const groupSelfMatch =
          group.code.includes(query) || group.nameLower.includes(query);
        const matchingSections = group.sections.filter(
          (s) => s.code.includes(query) || s.nameLower.includes(query),
        );

        if (groupSelfMatch) {
          const sections = group.sections.slice(0, MAX_SECTIONS_PER_GROUP);
          groupViews.push({
            code: group.code,
            name: group.name,
            sections,
            hasChildren,
          });
          leafCount += 1 + sections.length;
        } else if (matchingSections.length > 0) {
          const sections = matchingSections.slice(0, MAX_SECTIONS_PER_GROUP);
          groupViews.push({
            code: group.code,
            name: group.name,
            sections,
            hasChildren,
          });
          leafCount += sections.length;
        }
      }

      const show = !query || divMatches || groupViews.length > 0;
      if (!show) continue;

      result.push({
        code: div.code,
        name: div.name,
        groups: isSearching ? groupViews.slice(0, MAX_GROUPS_PER_DIV) : groupViews,
        leafCount,
      });
    }

    return result;
  }, [query, isSearching]);

  // Mutate the Bryntum task record directly. autoSync flushes the change to
  // `gantt.sync` on its next tick (last-write-wins, no version check).
  const writeCsiCode = useCallback(
    (next: string | null) => {
      const taskStore = ganttInstance?.project?.taskStore as
        | { getById?: (id: string) => { csiCode?: string | null } | null | undefined }
        | undefined;
      const record = taskStore?.getById?.(taskId);
      if (!record) {
        showSnackbar('Could not find task in chart — try reloading', 'error');
        setOptimisticCode(undefined);
        return false;
      }
      record.csiCode = next;
      return true;
    },
    [ganttInstance, taskId, showSnackbar],
  );

  // Selecting any code (Level-2 heading or Level-3 detail) saves and closes.
  const handleSelect = useCallback(
    (code: string) => {
      setOptimisticCode(code);
      const ok = writeCsiCode(code);
      // Notify the parent so the chip shows the new code with a saving spinner,
      // then slide the panel away — no manual close needed.
      if (ok) {
        onCodeChange?.(code);
        onClose();
      }
    },
    [writeCsiCode, onCodeChange, onClose],
  );

  const toggleGroup = useCallback((code: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  // Removal keeps the panel open so the user can pick a replacement; the chip
  // still reflects the cleared state via onCodeChange.
  const handleRemoveCode = useCallback(() => {
    setOptimisticCode(null);
    const ok = writeCsiCode(null);
    if (ok) onCodeChange?.(null);
  }, [writeCsiCode, onCodeChange]);

  const hasCode = !!displayCode;
  const subEntry = hasCode ? CSI_SUBDIVISION_MAP.get(displayCode!) : null;

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        minWidth: 0,
        maxHeight: '85vh',
        animation: 'slideInRight 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '@keyframes slideInRight': {
          from: { opacity: 0, transform: 'translateX(12px)' },
          to: { opacity: 1, transform: 'translateX(0)' },
        },
      }}
    >
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: '16px', py: '12px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Tag size={14} weight="bold" color="var(--text-secondary)" style={{ flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.primary', lineHeight: 1 }}>
            CSI Classification
          </Typography>
        </Box>
        <Box
          component="button"
          onClick={onClose}
          sx={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            color: 'text.secondary',
            flexShrink: 0,
            '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
            transition: 'background-color 0.15s, color 0.15s',
          }}
          aria-label="Close CSI panel"
        >
          <X size={13} />
        </Box>
      </Box>

      {/* ── Current selection ── */}
      {hasCode && subEntry && (
        <Box
          sx={{
            mx: '16px',
            mb: 1.5,
            px: 1.5,
            py: 1.25,
            borderRadius: '8px',
            bgcolor: 'action.selected',
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <Check size={13} weight="bold" color="var(--sidebar-indicator)" style={{ flexShrink: 0, marginTop: 1 }} />
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <Typography
              sx={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
              }}
            >
              {displayCode}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'text.secondary',
                lineHeight: 1.3,
              }}
            >
              {subEntry.subdivision.name}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.5625rem',
                fontWeight: 500,
                color: 'text.secondary',
                lineHeight: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                mt: '1px',
              }}
            >
              {subEntry.division.name}
            </Typography>
          </Box>
          <Box
            component="button"
            onClick={handleRemoveCode}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: '5px',
              border: 'none',
              bgcolor: 'transparent',
              cursor: 'pointer',
              color: 'text.secondary',
              flexShrink: 0,
              '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
              transition: 'background-color 0.15s, color 0.15s',
            }}
            aria-label="Remove classification"
          >
            <Prohibit size={12} weight="bold" />
          </Box>
        </Box>
      )}

      <Divider />

      {/* ── Search bar ── */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
        }}
      >
        <MagnifyingGlass
          size={14}
          color="var(--text-secondary)"
          style={{ flexShrink: 0 }}
        />
        <InputBase
          placeholder="Search divisions or codes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          fullWidth
          sx={{
            fontSize: '0.8125rem',
            '& .MuiInputBase-input': {
              p: 0,
              '&::placeholder': {
                color: 'text.disabled',
                opacity: 1,
              },
            },
          }}
        />
        {isSearching && (
          <IconButton
            size="small"
            onClick={() => setSearch('')}
            sx={{ p: 0.25, flexShrink: 0 }}
            aria-label="Clear search"
          >
            <X size={12} weight="bold" />
          </IconButton>
        )}
      </Box>

      {/* ── Division list ── */}
      <Box
        component="ul"
        role="listbox"
        sx={{ listStyle: 'none', m: 0, p: 0, overflowY: 'auto', flex: 1 }}
      >
        {displayDivisions.map((div, idx) => {
          const isDivExpanded = isSearching || expandedDivision === div.code;

          return (
            <Box component="li" key={div.code} sx={{ listStyle: 'none' }}>
              {/* Division header (expand-only) */}
              <Box
                role="button"
                tabIndex={isSearching ? -1 : 0}
                onClick={() => {
                  if (isSearching) return;
                  setExpandedDivision(expandedDivision === div.code ? null : div.code);
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (isSearching) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedDivision(expandedDivision === div.code ? null : div.code);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: '8px',
                  cursor: isSearching ? 'default' : 'pointer',
                  borderTop: idx > 0 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  transition: 'background-color 0.1s',
                  userSelect: 'none',
                  '&:hover': {
                    bgcolor: isSearching ? 'transparent' : 'action.hover',
                  },
                }}
              >
                {isDivExpanded ? (
                  <CaretDown size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                ) : (
                  <CaretRight size={11} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                )}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.selected',
                    borderRadius: '4px',
                    px: 0.625,
                    py: '1px',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      color: 'text.secondary',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.4,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {div.code}
                  </Typography>
                </Box>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  {div.name}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.5625rem',
                    fontWeight: 500,
                    color: 'text.secondary',
                    ml: 'auto',
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {div.leafCount}
                </Typography>
              </Box>

              {/* Level-2 groups + Level-3 sections */}
              {isDivExpanded &&
                div.groups.map((group) => {
                  const isGroupSelected = displayCode === group.code;
                  const isGroupExpanded = isSearching || expandedGroups.has(group.code);

                  return (
                    <Box key={group.code}>
                      {/* Level-2 heading row — selectable, with optional caret */}
                      <Box
                        role="option"
                        aria-selected={isGroupSelected}
                        tabIndex={0}
                        onClick={() => handleSelect(group.code)}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelect(group.code);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          pl: 2.5,
                          pr: 2,
                          py: '6px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background-color 0.1s',
                          bgcolor: isGroupSelected ? 'action.selected' : 'transparent',
                          '&:hover': {
                            bgcolor: isGroupSelected ? 'action.selected' : 'action.hover',
                          },
                          '&::before': isGroupSelected
                            ? {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '2.5px',
                                height: 16,
                                borderRadius: '0 2px 2px 0',
                                bgcolor: 'sidebar.indicator',
                              }
                            : undefined,
                        }}
                      >
                        {group.hasChildren ? (
                          <Box
                            component="button"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (isSearching) return;
                              toggleGroup(group.code);
                            }}
                            aria-label={isGroupExpanded ? 'Collapse section' : 'Expand section'}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 18,
                              height: 18,
                              p: 0,
                              border: 'none',
                              borderRadius: '4px',
                              bgcolor: 'transparent',
                              cursor: isSearching ? 'default' : 'pointer',
                              color: 'text.secondary',
                              flexShrink: 0,
                              '&:hover': {
                                bgcolor: isSearching ? 'transparent' : 'action.hover',
                              },
                            }}
                          >
                            {isGroupExpanded ? (
                              <CaretDown size={10} />
                            ) : (
                              <CaretRight size={10} />
                            )}
                          </Box>
                        ) : (
                          <Box sx={{ width: 18, flexShrink: 0 }} />
                        )}
                        <Typography
                          component="span"
                          sx={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            color: isGroupSelected ? 'text.primary' : 'text.secondary',
                            minWidth: 52,
                            flexShrink: 0,
                            fontVariantNumeric: 'tabular-nums',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {group.code}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: isGroupSelected ? 600 : 550,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {group.name}
                        </Typography>
                        {isGroupSelected && (
                          <Check
                            size={12}
                            weight="bold"
                            color="var(--sidebar-indicator)"
                            style={{ flexShrink: 0 }}
                          />
                        )}
                      </Box>

                      {/* Level-3 sections */}
                      {isGroupExpanded &&
                        group.sections.map((section) => (
                          <SectionItem
                            key={section.code}
                            section={section}
                            isSelected={displayCode === section.code}
                            onSelect={handleSelect}
                          />
                        ))}
                    </Box>
                  );
                })}
            </Box>
          );
        })}
      </Box>

      {/* ── Empty state ── */}
      {displayDivisions.length === 0 && (
        <Box
          sx={{
            px: 3,
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <MagnifyingGlass
            size={20}
            color="var(--text-secondary)"
          />
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'text.secondary',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            No codes match &ldquo;{search}&rdquo;
          </Typography>
        </Box>
      )}
    </Box>
  );
}
