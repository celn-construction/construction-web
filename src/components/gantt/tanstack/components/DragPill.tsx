"use client";

import { useState, type DragEvent } from "react";

export function DragPill() {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/gantt-new-task", "");
    e.dataTransfer.effectAllowed = "copy";
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5
        bg-zinc-800 hover:bg-zinc-700
        border border-zinc-600
        rounded-full
        text-xs font-medium text-zinc-300
        cursor-grab active:cursor-grabbing
        transition-all
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <span className="text-sm">+</span>
      <span>New Task</span>
    </div>
  );
}
