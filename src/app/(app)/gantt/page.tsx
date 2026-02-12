"use client";

import { Gantt, Willow, WillowDark } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useThemeStore } from "~/store/useThemeStore";
import { X } from "lucide-react";
import { Box, Card, Skeleton, Popover } from "@mui/material";

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

// Use default columns for tree functionality - SVAR handles expand/collapse automatically
// const columns = undefined; // Let SVAR use defaults

// Or keep custom columns but ensure tree works
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
      <Box sx={{ width: 320, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Header */}
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
        {/* Rows */}
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
        ))}
      </Box>

      {/* Timeline skeleton */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Header */}
        <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
        {/* Bars */}
        {[...Array(8)].map((_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1 }}>
            <Skeleton
              variant="rectangular"
              height={40}
              sx={{
                borderRadius: 1,
                width: `${Math.random() * 40 + 20}%`,
                marginLeft: `${Math.random() * 30}%`
              }}
            />
          </Box>
        ))}
      </Box>
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
      <div style={{ height: '100%', width: '100%', padding: '24px' }}>
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
                  />
                </ThemeWrapper>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      <Popover
        open={!!selectedTaskId}
        anchorEl={anchorRef.current}
        onClose={() => { setSelectedTaskId(null); setSelectedDoc(null); }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{ ml: 1 }}
      >
        <Box sx={{ width: 320, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
            <Box>
              <Box component="h3" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                {selectedTaskName}
              </Box>
            </Box>
            <Box
              component="button"
              onClick={() => setSelectedTaskId(null)}
              sx={{
                p: 0.5,
                borderRadius: 1,
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background-color 0.2s',
              }}
              aria-label="Close"
            >
              <X size={16} style={{ color: 'var(--text-secondary)' }} />
            </Box>
          </Box>
          <Box
            sx={{
              fontSize: '0.75rem',
              borderRadius: 1,
              p: 1.5,
              border: '1px dashed var(--border-color)',
              color: 'text.secondary',
            }}
          >
            Task details panel (folder tree removed during migration)
          </Box>
        </Box>
      </Popover>
    </>
  );
}
