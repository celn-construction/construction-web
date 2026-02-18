"use client";

import dynamic from "next/dynamic";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useProjectContext } from "@/components/providers/ProjectProvider";

const BryntumGanttWrapper = dynamic(
  () => import("@/components/bryntum/BryntumGanttWrapper"),
  {
    ssr: false,
    loading: () => (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 2 }}>
        <CircularProgress size={24} />
      </Box>
    ),
  }
);

export default function GanttPage() {
  const { projectId, projectName } = useProjectContext();

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
        width: "100%",
        p: 3,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>
          {projectName} - Gantt Chart
        </Typography>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", height: "100%" }}>
        <BryntumGanttWrapper projectId={projectId} />
      </Box>
    </Box>
  );
}
