"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { DragPill } from "@/components/gantt/tanstack/components/DragPill";
import type { ZoomLevel } from "@/components/gantt/tanstack/types";

const TanStackGanttChart = dynamic(
  () =>
    import("@/components/gantt/tanstack/TanStackGanttChart").then(
      (mod) => mod.TanStackGanttChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
        Loading chart…
      </div>
    ),
  },
);

const ZOOM_OPTIONS: { value: ZoomLevel; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

export default function TanStackGanttPage() {
  const [zoom, setZoom] = useState<ZoomLevel>("week");

  return (
    <LayoutWrapper>
      <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">Virtual Gantt</h1>
            <DragPill />
          </div>
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5">
            {ZOOM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setZoom(opt.value)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  zoom === opt.value
                    ? "bg-zinc-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0">
          <TanStackGanttChart zoom={zoom} />
        </div>
      </div>
    </LayoutWrapper>
  );
}
