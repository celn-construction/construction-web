/**
 * Grid background component for Gantt chart timeline
 * Renders vertical column lines once behind all timeline bars
 */

interface GanttGridBackgroundProps {
  columns: Date[];
  dateToX: (date: Date) => number;
  columnWidth: number;
  height: number;
}

export function GanttGridBackground({ columns, dateToX, columnWidth, height }: GanttGridBackgroundProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {columns.map((col, i) => {
        const x = dateToX(col);
        return (
          <div
            key={i}
            className="absolute border-r border-gray-200"
            style={{
              left: x,
              width: columnWidth,
              height,
            }}
          />
        );
      })}
    </div>
  );
}
