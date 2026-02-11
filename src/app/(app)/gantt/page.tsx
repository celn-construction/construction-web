"use client";

import { Gantt, Willow, WillowDark } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { Card } from "~/components/ui/card";
import { useThemeStore } from "~/store/useThemeStore";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "~/components/ui/popover";
import { X } from "lucide-react";
import FeatureFolderTree from "~/components/dashboard/FeatureFolderTree";

const tasks = [
  {
    id: 1,
    open: true,
    start: new Date(2025, 3, 2),
    duration: 10,
    text: "Project Planning",
    progress: 80,
    type: "summary"
  },
  {
    id: 2,
    parent: 1,
    start: new Date(2025, 3, 2),
    duration: 4,
    text: "Research",
    progress: 100
  },
  {
    id: 3,
    parent: 1,
    start: new Date(2025, 3, 6),
    duration: 6,
    text: "Design",
    progress: 60
  },
  {
    id: 4,
    start: new Date(2025, 3, 12),
    duration: 8,
    text: "Development",
    progress: 30
  },
];

const scales = [
  { unit: "month" as const, step: 1, format: "MMMM yyyy" },
  { unit: "day" as const, step: 1, format: "d" },
];

const columns = [
  { id: "text", header: "Task name", flexgrow: 2 },
  { id: "start", header: "Start", flexgrow: 1, align: "center" as const },
  { id: "duration", header: "Duration", align: "center" as const, flexgrow: 1 },
];

function GanttLoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full w-full gap-4 p-4"
    >
      {/* Sidebar skeleton */}
      <div className="w-80 space-y-2">
        {/* Header */}
        <div className="h-12 bg-[var(--bg-hover)] rounded animate-pulse" />
        {/* Rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 bg-[var(--bg-hover)] rounded animate-pulse" />
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="h-12 bg-[var(--bg-hover)] rounded animate-pulse" />
        {/* Bars */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex gap-2">
            <div
              className="h-10 bg-[var(--bg-hover)] rounded animate-pulse"
              style={{
                width: `${Math.random() * 40 + 20}%`,
                marginLeft: `${Math.random() * 30}%`
              }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function GanttPage() {
  const { theme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState("");
  const anchorRef = useRef<HTMLElement | null>(null);
  const [coverImages, setCoverImages] = useState<Record<string, string | undefined>>({});
  const [selectedDoc, setSelectedDoc] = useState<{ id: string; name: string } | null>(null);
  const ThemeWrapper = theme === "dark" ? WillowDark : Willow;

  useEffect(() => {
    // Simulate initial load time for the Gantt chart
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleBarClick = useCallback((event: React.MouseEvent) => {
    const barEl = (event.target as HTMLElement).closest('.wx-bar') as HTMLElement;
    if (!barEl) return;
    const id = barEl.getAttribute('data-id');
    if (!id) return;

    if (selectedTaskId === id) {
      setSelectedTaskId(null);
      anchorRef.current = null;
    } else {
      const task = tasks.find(t => String(t.id) === id);
      setSelectedTaskId(id);
      setSelectedTaskName(task?.text ?? '');
      anchorRef.current = barEl;
    }
    setSelectedDoc(null);
  }, [selectedTaskId]);

  const handleCoverImageChange = (imageUrl: string | undefined) => {
    if (selectedTaskId) {
      setCoverImages(prev => ({ ...prev, [selectedTaskId]: imageUrl }));
    }
  };

  const handleDocumentSelect = (docId: string, docName: string) => {
    setSelectedDoc({ id: docId, name: docName });
  };

  return (
    <>
      <div className="h-full w-full p-6">
        <Card className="relative h-full w-full overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm flex flex-col">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <GanttLoadingSkeleton />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 min-h-0 flex flex-col"
                onClick={handleBarClick}
              >
                <ThemeWrapper fonts={false}>
                  <Gantt
                    tasks={tasks}
                    scales={scales}
                    columns={columns}
                  />
                </ThemeWrapper>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      <Popover open={!!selectedTaskId} onOpenChange={(open) => { if (!open) { setSelectedTaskId(null); setSelectedDoc(null); } }}>
        <PopoverAnchor virtualRef={anchorRef as React.RefObject<any>} />
        <PopoverContent
          side="right"
          align="start"
          sideOffset={8}
          className={`transition-all duration-300 ${selectedDoc ? 'w-[580px]' : 'w-80'}`}
        >
          <div className="flex gap-3">
            {/* Folder Tree - Fixed width */}
            <div className={`transition-all duration-300 ${selectedDoc ? 'w-[280px]' : 'w-full'}`}>
              <FeatureFolderTree
                featureName={selectedTaskName}
                featureId={selectedTaskId ?? ''}
                coverImage={selectedTaskId ? coverImages[selectedTaskId] : undefined}
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
                      {selectedTaskName}
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
    </>
  );
}
