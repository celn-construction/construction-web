"use client";

import { ROW_HEIGHT, LEFT_PANEL_WIDTH } from "../constants";

interface DropPreview {
  rowIndex: number;
  groupId: string;
  groupName: string;
  startDate: Date;
  endDate: Date;
  x: number;
}

interface DropPreviewOverlayProps {
  preview: DropPreview | null;
  dateToX: (date: Date) => number;
}

export function DropPreviewOverlay({
  preview,
  dateToX,
}: DropPreviewOverlayProps) {
  if (!preview) return null;

  const barX = dateToX(preview.startDate);
  const barWidth = dateToX(preview.endDate) - barX;
  const rowY = preview.rowIndex * ROW_HEIGHT;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Row highlight */}
      <div
        className="absolute bg-blue-500/10 border-y border-blue-500/30"
        style={{
          left: LEFT_PANEL_WIDTH,
          top: rowY,
          height: ROW_HEIGHT,
          right: 0,
        }}
      />

      {/* Ghost bar */}
      <div
        className="absolute bg-blue-500/20 border-2 border-dashed border-blue-400/50 rounded flex items-center justify-center"
        style={{
          left: LEFT_PANEL_WIDTH + barX,
          top: rowY + 8,
          width: Math.max(barWidth, 80),
          height: ROW_HEIGHT - 16,
        }}
      >
        <span className="text-xs font-medium text-blue-300">New Task</span>
      </div>
    </div>
  );
}
