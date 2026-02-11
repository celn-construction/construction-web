"use client";

import { Gantt } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/style.css";

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

export default function GanttPage() {
  return (
    <div className="h-full w-full">
      <Gantt tasks={tasks} scales={scales} columns={columns} />
    </div>
  );
}
