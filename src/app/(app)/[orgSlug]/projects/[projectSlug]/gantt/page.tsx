"use client";

import { Suspense } from "react";
import BryntumGanttWrapper from "@/components/bryntum/BryntumGanttWrapper";
import { useProjectContext } from "@/components/providers/ProjectProvider";

export default function GanttPage() {
  const { projectId, projectName } = useProjectContext();

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{projectName} - Gantt Chart</h1>
      </div>

      <div className="flex-1 min-h-0">
        <Suspense fallback={<div>Loading Gantt chart...</div>}>
          <BryntumGanttWrapper projectId={projectId} />
        </Suspense>
      </div>
    </div>
  );
}
