'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GanttChart } from 'lucide-react';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import FeatureFolderTree from './FeatureFolderTree';
import { X } from 'lucide-react';

// Import Kibo UI Gantt components
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureRow,
  GanttToday,
  computeSubRows,
  type GanttFeature as KiboFeature,
} from '@/components/kibo-ui/gantt';

// Zustand store imports
import {
  useGroupedFeaturesWithRows,
  useFeatureActions,
  useGroups,
  useUpdateFeature,
  useCollapsedFeatureIds,
  useToggleFeatureCollapse,
  useAddSubtask,
} from '@/store/hooks';

export default function DashboardGantt() {
  const { grouped, flatList: allFeatures, subtasksByParent } = useGroupedFeaturesWithRows();
  const { move: moveFeature } = useFeatureActions();
  const updateFeature = useUpdateFeature();
  const groups = useGroups();
  const collapsedIds = useCollapsedFeatureIds();
  const toggleCollapse = useToggleFeatureCollapse();
  const addSubtask = useAddSubtask();
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{ id: string; name: string } | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const ganttContentRef = useRef<HTMLDivElement>(null);
  const selectedFeatureIdRef = useRef<string | null>(null);

  // Group features by group in a single pass (optimized O(n) instead of O(n²))
  const kiboGrouped = useMemo(() => {
    const result: Record<string, KiboFeature[]> = {};

    // Initialize empty arrays for all groups
    for (const groupName of groups) {
      result[groupName] = [];
    }

    // Single pass: filter features with dates and group them
    for (const item of allFeatures) {
      if (item.feature.startAt && item.feature.endAt && item.feature.group) {
        const groupName = item.feature.group;
        if (result[groupName]) {
          result[groupName].push({
            id: item.feature.id,
            name: item.feature.name,
            startAt: item.feature.startAt,
            endAt: item.feature.endAt,
            status: item.feature.status,
          });
        }
      }
    }

    return result;
  }, [groups, allFeatures]);

  // Compute row counts for each group (parent + visible subtasks)
  const subRowCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const groupName of groups) {
      const parents = grouped[groupName] || [];
      let count = parents.length; // Start with parent count

      // Add visible subtasks
      for (const parent of parents) {
        if (!collapsedIds.has(parent.id)) {
          const subtasks = subtasksByParent.get(parent.id) || [];
          count += subtasks.length;
        }
      }

      counts[groupName] = count;
    }
    return counts;
  }, [groups, grouped, collapsedIds, subtasksByParent]);

  // Sync ref with state
  selectedFeatureIdRef.current = selectedFeatureId;

  // Close popover when anchor scrolls off-screen
  useEffect(() => {
    if (!selectedFeatureId) return;

    const scrollContainer = ganttContentRef.current?.querySelector('.gantt');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();

      // Visible timeline starts after the 300px sticky sidebar
      const visibleLeft = containerRect.left + 300;
      const visibleRight = containerRect.right;

      // Close if anchor fully scrolled behind sidebar or past right edge
      if (anchorRect.right < visibleLeft || anchorRect.left > visibleRight) {
        setSelectedFeatureId(null);
        setSelectedDoc(null);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [selectedFeatureId]);

  // Move handler - memoized with stable dependency
  const handleMove = useCallback((id: string, startDate: Date, endDate: Date | null) => {
    moveFeature(id, startDate, endDate ?? startDate);
  }, [moveFeature]);

  // Select handler - stable callback using ref
  const handleSelectItem = useCallback((id: string, anchorEl: HTMLElement) => {
    // Toggle: if clicking the same bar, close the popover
    if (selectedFeatureIdRef.current === id) {
      setSelectedFeatureId(null);
      anchorRef.current = null;
    } else {
      setSelectedFeatureId(id);
      anchorRef.current = anchorEl;
    }
  }, []);

  // Cover image change handler
  const handleCoverImageChange = useCallback((imageUrl: string | undefined) => {
    if (selectedFeatureId) {
      updateFeature(selectedFeatureId, { coverImage: imageUrl });
    }
  }, [selectedFeatureId, updateFeature]);

  // Document selection handler
  const handleDocumentSelect = useCallback((docId: string, docName: string) => {
    setSelectedDoc({ id: docId, name: docName });
  }, []);

  // Add subtask handler
  const handleAddSubtask = useCallback((parentId: string) => {
    const parent = allFeatures.find((item) => item.feature.id === parentId)?.feature;
    if (!parent) return;

    addSubtask(parentId, {
      id: `${parentId}-sub-${Date.now()}`,
      name: 'New Subtask',
      status: parent.status,
      group: parent.group,
      startAt: parent.startAt,
      endAt: parent.endAt,
      parentId,
    });
  }, [allFeatures, addSubtask]);

  // Rename handler
  const handleRename = useCallback((id: string, newName: string) => {
    if (newName.trim()) {
      updateFeature(id, { name: newName.trim() });
    }
  }, [updateFeature]);

  // Get selected feature (from full feature list to access coverImage)
  const selectedFeature = allFeatures.find((item) => item.feature.id === selectedFeatureId)?.feature;

  return (
    <motion.div
      className="flex flex-col h-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-color)]">
        <GanttChart className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        <h2 className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-secondary)' }}>
          Project Schedule
        </h2>
      </div>

      {/* Gantt content */}
      <div ref={ganttContentRef} className="flex-1 overflow-hidden">
        <GanttProvider range="daily" zoom={100}>
          <GanttSidebar>
            {groups.map((groupName) => (
              <div key={groupName}>
                <GanttSidebarGroup name={groupName} subRowCount={subRowCounts[groupName]}>
                  {grouped[groupName]?.map((parent) => {
                    const subtasks = subtasksByParent.get(parent.id) || [];
                    const isExpanded = !collapsedIds.has(parent.id);
                    const hasChildren = subtasks.length > 0;

                    return (
                      <div key={parent.id}>
                        {/* Parent item */}
                        <GanttSidebarItem
                          feature={parent}
                          hasChildren={hasChildren}
                          isExpanded={isExpanded}
                          onToggleExpand={() => toggleCollapse(parent.id)}
                          onAddSubtask={() => handleAddSubtask(parent.id)}
                          onRename={handleRename}
                        />
                        {/* Subtask items (only when expanded) */}
                        {isExpanded && subtasks.map((subtask) => (
                          <GanttSidebarItem
                            key={subtask.id}
                            feature={subtask}
                            isSubtask={true}
                            onRename={handleRename}
                          />
                        ))}
                      </div>
                    );
                  })}
                </GanttSidebarGroup>
              </div>
            ))}
          </GanttSidebar>

          <GanttTimeline>
            <GanttHeader />
            <GanttFeatureList>
              {groups.map((groupName) => (
                <GanttFeatureListGroup key={groupName}>
                  {grouped[groupName]?.map((parent) => {
                    const subtasks = subtasksByParent.get(parent.id) || [];
                    const isExpanded = !collapsedIds.has(parent.id);
                    const visibleSubtasks = isExpanded ? subtasks : [];

                    return (
                      <div key={parent.id}>
                        {/* Parent row */}
                        <GanttFeatureRow
                          features={[parent]}
                          onMove={handleMove}
                          onSelectItem={handleSelectItem}
                          subRowCount={1}
                        />
                        {/* Subtask rows */}
                        {visibleSubtasks.map((subtask) => (
                          <GanttFeatureRow
                            key={subtask.id}
                            features={[subtask]}
                            onMove={handleMove}
                            onSelectItem={handleSelectItem}
                            subRowCount={1}
                            className="bg-secondary/20"
                          />
                        ))}
                      </div>
                    );
                  })}
                </GanttFeatureListGroup>
              ))}
            </GanttFeatureList>
            <GanttToday />
          </GanttTimeline>
        </GanttProvider>
      </div>

      <Popover open={!!selectedFeatureId} onOpenChange={(open) => { if (!open) { setSelectedFeatureId(null); setSelectedDoc(null); } }}>
        <PopoverAnchor virtualRef={anchorRef as React.RefObject<any>} />
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          collisionBoundary={ganttContentRef.current}
          collisionPadding={{ left: 300 }}
          className={`transition-all duration-300 ${selectedDoc ? 'w-[580px]' : 'w-80'}`}
        >
          <div className="flex gap-3">
            {/* Folder Tree - Fixed width */}
            <div className={`transition-all duration-300 ${selectedDoc ? 'w-[280px]' : 'w-full'}`}>
              <FeatureFolderTree
                featureName={selectedFeature?.name ?? ''}
                featureId={selectedFeatureId ?? ''}
                coverImage={selectedFeature?.coverImage}
                onCoverImageChange={handleCoverImageChange}
                onDocumentSelect={handleDocumentSelect}
              />
            </div>

            {/* Detail Panel - Appears when doc is selected */}
            {selectedDoc && (
              <div className="flex-1 border-l border-[var(--border-color)] pl-3 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {selectedDoc.name}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {selectedFeature?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
                    aria-label="Close detail panel"
                  >
                    <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                </div>
                <div
                  className="text-xs rounded-md p-3 border border-dashed border-[var(--border-color)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  No documents yet
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </motion.div>
  );
}
