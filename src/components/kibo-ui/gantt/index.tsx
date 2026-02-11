"use client";

import {
  DndContext,
  MouseSensor,
  useDraggable,
  useSensor,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  addDays,
  addMonths,
  differenceInDays,
  differenceInHours,
  differenceInMonths,
  endOfDay,
  endOfMonth,
  format,
  formatDate,
  formatDistance,
  getDate,
  getDaysInMonth,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { atom, useAtom, useSetAtom, useAtomValue } from "jotai";
import throttle from "lodash.throttle";
import { PencilIcon, PlusIcon, TrashIcon, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type {
  CSSProperties,
  FC,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
  RefObject,
} from "react";
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card } from "src/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "src/components/ui/context-menu";
import { cn } from "src/lib/utils";

const draggingAtom = atom(false);
const scrollXAtom = atom(0);
const draggingFeatureIdAtom = atom<string | null>(null);

export const useGanttDragging = () => useAtom(draggingAtom);
export const useGanttScrollX = () => useAtom(scrollXAtom);
const useSetGanttDragging = () => useSetAtom(draggingAtom);

export type GanttStatus = {
  id: string;
  name: string;
  color: string;
};

export type GanttFeature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: GanttStatus;
  lane?: string; // Optional: features with the same lane will share a row
};

export type GanttMarkerProps = {
  id: string;
  date: Date;
  label: string;
};

export type Range = "daily" | "monthly" | "quarterly";

export type TimelineData = {
  year: number;
  quarters: {
    months: {
      days: number;
    }[];
  }[];
}[];

export type GanttContextProps = {
  zoom: number;
  range: Range;
  columnWidth: number;
  sidebarWidth: number;
  headerHeight: number;
  rowHeight: number;
  onAddItem: ((date: Date) => void) | undefined;
  placeholderLength: number;
  timelineData: TimelineData;
  ref: RefObject<HTMLDivElement | null> | null;
  scrollToFeature?: (feature: GanttFeature) => void;
};

const getsDaysIn = (range: Range) => {
  // For when range is daily
  let fn = (_date: Date) => 1;

  if (range === "monthly" || range === "quarterly") {
    fn = getDaysInMonth;
  }

  return fn;
};

const getDifferenceIn = (range: Range) => {
  let fn = differenceInDays;

  if (range === "monthly" || range === "quarterly") {
    fn = differenceInMonths;
  }

  return fn;
};

// Utility: Calculate number of visual sub-rows needed for a set of features
export function computeSubRows(features: { startAt: Date; endAt: Date }[]): number {
  if (!features || features.length === 0) return 1;

  // Filter out any features without valid dates
  const validFeatures = features.filter(f => f.startAt && f.endAt);
  if (validFeatures.length === 0) return 1;

  const sorted = [...validFeatures].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const endTimes: Date[] = [];
  for (const f of sorted) {
    let row = 0;
    while (row < endTimes.length && endTimes[row]! > f.startAt) row++;
    if (row === endTimes.length) endTimes.push(f.endAt);
    else endTimes[row] = f.endAt;
  }
  return Math.max(1, endTimes.length);
}


const getInnerDifferenceIn = (range: Range) => {
  let fn = differenceInHours;

  if (range === "monthly" || range === "quarterly") {
    fn = differenceInDays;
  }

  return fn;
};

const getStartOf = (range: Range) => {
  let fn = startOfDay;

  if (range === "monthly" || range === "quarterly") {
    fn = startOfMonth;
  }

  return fn;
};

const getEndOf = (range: Range) => {
  let fn = endOfDay;

  if (range === "monthly" || range === "quarterly") {
    fn = endOfMonth;
  }

  return fn;
};

const getAddRange = (range: Range) => {
  let fn = addDays;

  if (range === "monthly" || range === "quarterly") {
    fn = addMonths;
  }

  return fn;
};

const getDateByMousePosition = (context: GanttContextProps, mouseX: number) => {
  const timelineStartDate = new Date(context.timelineData[0]?.year ?? new Date().getFullYear(), 0, 1);
  const columnWidth = (context.columnWidth * context.zoom) / 100;
  const offset = Math.floor(mouseX / columnWidth);
  const daysIn = getsDaysIn(context.range);
  const addRange = getAddRange(context.range);
  const month = addRange(timelineStartDate, offset);
  const daysInMonth = daysIn(month);
  const pixelsPerDay = Math.round(columnWidth / daysInMonth);
  const dayOffset = Math.floor((mouseX % columnWidth) / pixelsPerDay);
  const actualDate = addDays(month, dayOffset);

  return actualDate;
};

const createInitialTimelineData = (today: Date) => {
  const data: TimelineData = [];

  data.push(
    { year: today.getFullYear() - 1, quarters: new Array(4).fill(null) },
    { year: today.getFullYear(), quarters: new Array(4).fill(null) },
    { year: today.getFullYear() + 1, quarters: new Array(4).fill(null) }
  );

  for (const yearObj of data) {
    yearObj.quarters = new Array(4).fill(null).map((_, quarterIndex) => ({
      months: new Array(3).fill(null).map((_, monthIndex) => {
        const month = quarterIndex * 3 + monthIndex;
        return {
          days: getDaysInMonth(new Date(yearObj.year, month, 1)),
        };
      }),
    }));
  }

  return data;
};

const getOffset = (
  date: Date,
  timelineStartDate: Date,
  context: GanttContextProps
) => {
  const parsedColumnWidth = (context.columnWidth * context.zoom) / 100;
  const differenceIn = getDifferenceIn(context.range);
  const startOf = getStartOf(context.range);
  const fullColumns = differenceIn(startOf(date), timelineStartDate);

  if (context.range === "daily") {
    return parsedColumnWidth * fullColumns;
  }

  const partialColumns = date.getDate();
  const daysInMonth = getDaysInMonth(date);
  const pixelsPerDay = parsedColumnWidth / daysInMonth;

  return fullColumns * parsedColumnWidth + partialColumns * pixelsPerDay;
};

const getWidth = (
  startAt: Date,
  endAt: Date | null,
  context: GanttContextProps
) => {
  const parsedColumnWidth = (context.columnWidth * context.zoom) / 100;

  if (!endAt) {
    return parsedColumnWidth * 2;
  }

  const differenceIn = getDifferenceIn(context.range);

  if (context.range === "daily") {
    const delta = differenceIn(endAt, startAt);

    return parsedColumnWidth * (delta ? delta : 1);
  }

  const daysInStartMonth = getDaysInMonth(startAt);
  const pixelsPerDayInStartMonth = parsedColumnWidth / daysInStartMonth;

  if (isSameDay(startAt, endAt)) {
    return pixelsPerDayInStartMonth;
  }

  const innerDifferenceIn = getInnerDifferenceIn(context.range);
  const startOf = getStartOf(context.range);

  if (isSameDay(startOf(startAt), startOf(endAt))) {
    return innerDifferenceIn(endAt, startAt) * pixelsPerDayInStartMonth;
  }

  const startRangeOffset = daysInStartMonth - getDate(startAt);
  const endRangeOffset = getDate(endAt);
  const fullRangeOffset = differenceIn(startOf(endAt), startOf(startAt));
  const daysInEndMonth = getDaysInMonth(endAt);
  const pixelsPerDayInEndMonth = parsedColumnWidth / daysInEndMonth;

  return (
    (fullRangeOffset - 1) * parsedColumnWidth +
    startRangeOffset * pixelsPerDayInStartMonth +
    endRangeOffset * pixelsPerDayInEndMonth
  );
};

const calculateInnerOffset = (
  date: Date,
  range: Range,
  columnWidth: number
) => {
  const startOf = getStartOf(range);
  const endOf = getEndOf(range);
  const differenceIn = getInnerDifferenceIn(range);
  const startOfRange = startOf(date);
  const endOfRange = endOf(date);
  const totalRangeDays = differenceIn(endOfRange, startOfRange);
  const dayOfMonth = date.getDate();

  return (dayOfMonth / totalRangeDays) * columnWidth;
};

const GanttContext = createContext<GanttContextProps>({
  zoom: 100,
  range: "monthly",
  columnWidth: 50,
  headerHeight: 60,
  sidebarWidth: 300,
  rowHeight: 36,
  onAddItem: undefined,
  placeholderLength: 2,
  timelineData: [],
  ref: null,
  scrollToFeature: undefined,
});

export type GanttContentHeaderProps = {
  renderHeaderItem: (index: number) => ReactNode;
  title: string;
  columns: number;
};

export const GanttContentHeader: FC<GanttContentHeaderProps> = ({
  title,
  columns,
  renderHeaderItem,
}) => {
  const id = useId();

  return (
    <div
      className="sticky top-0 z-20 grid w-full shrink-0 bg-[var(--bg-card)]"
      style={{ height: "var(--gantt-header-height)" }}
    >
      <div>
        <div
          className="sticky inline-flex whitespace-nowrap px-3 py-2 text-[10px] text-[var(--text-secondary)]"
          style={{
            left: "var(--gantt-sidebar-width)",
          }}
        >
          <p>{title}</p>
        </div>
      </div>
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div
            className="shrink-0 border-[var(--grid-line)] border-b py-1 text-center text-[10px] text-[var(--text-secondary)]"
            key={`${id}-${index}`}
          >
            {renderHeaderItem(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

const DailyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) =>
    year.quarters
      .flatMap((quarter) => quarter.months)
      .map((month, index) => (
        <div className="relative flex flex-col" key={`${year.year}-${index}`}>
          <GanttContentHeader
            columns={month.days}
            renderHeaderItem={(item: number) => (
              <div className="flex items-center justify-center gap-1">
                <p>
                  {format(addDays(new Date(year.year, index, 1), item), "d")}
                </p>
                <p className="text-muted-foreground">
                  {format(
                    addDays(new Date(year.year, index, 1), item),
                    "EEEEE"
                  )}
                </p>
              </div>
            )}
            title={format(new Date(year.year, index, 1), "MMMM yyyy")}
          />
          <GanttColumns
            columns={month.days}
            isColumnSecondary={(item: number) =>
              [0, 6].includes(
                addDays(new Date(year.year, index, 1), item).getDay()
              )
            }
          />
        </div>
      ))
  );
};

const MonthlyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) => (
    <div className="relative flex flex-col" key={year.year}>
      <GanttContentHeader
        columns={year.quarters.flatMap((quarter) => quarter.months).length}
        renderHeaderItem={(item: number) => (
          <p>{format(new Date(year.year, item, 1), "MMM")}</p>
        )}
        title={`${year.year}`}
      />
      <GanttColumns
        columns={year.quarters.flatMap((quarter) => quarter.months).length}
      />
    </div>
  ));
};

const QuarterlyHeader: FC = () => {
  const gantt = useContext(GanttContext);

  return gantt.timelineData.map((year) =>
    year.quarters.map((quarter, quarterIndex) => (
      <div
        className="relative flex flex-col"
        key={`${year.year}-${quarterIndex}`}
      >
        <GanttContentHeader
          columns={quarter.months.length}
          renderHeaderItem={(item: number) => (
            <p>
              {format(new Date(year.year, quarterIndex * 3 + item, 1), "MMM")}
            </p>
          )}
          title={`Q${quarterIndex + 1} ${year.year}`}
        />
        <GanttColumns columns={quarter.months.length} />
      </div>
    ))
  );
};

const headers: Record<Range, FC> = {
  daily: DailyHeader,
  monthly: MonthlyHeader,
  quarterly: QuarterlyHeader,
};

export type GanttHeaderProps = {
  className?: string;
};

export const GanttHeader: FC<GanttHeaderProps> = ({ className }) => {
  const gantt = useContext(GanttContext);
  const Header = headers[gantt.range];

  return (
    <div
      className={cn(
        "-space-x-px flex h-full w-max divide-x divide-[var(--grid-line)]",
        className
      )}
    >
      <Header />
    </div>
  );
};

export type GanttSidebarItemProps = {
  feature: GanttFeature;
  onSelectItem?: (id: string) => void;
  className?: string;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isSubtask?: boolean;
  onAddSubtask?: () => void;
  onRename?: (id: string, newName: string) => void;
};

export const GanttSidebarItem: FC<GanttSidebarItemProps> = memo(({
  feature,
  onSelectItem,
  className,
  hasChildren = false,
  isExpanded = false,
  onToggleExpand,
  isSubtask = false,
  onAddSubtask,
  onRename,
}) => {
  const gantt = useContext(GanttContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(feature.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const tempEndAt =
    feature.endAt && isSameDay(feature.startAt, feature.endAt)
      ? addDays(feature.endAt, 1)
      : feature.endAt;
  const duration = tempEndAt
    ? formatDistance(feature.startAt, tempEndAt)
    : `${formatDistance(feature.startAt, new Date())} so far`;

  const handleClick: MouseEventHandler<HTMLDivElement> = () => {
    // Scroll to the feature in the timeline
    gantt.scrollToFeature?.(feature);
    // Call the original onSelectItem callback
    onSelectItem?.(feature.id);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter") {
      // Scroll to the feature in the timeline
      gantt.scrollToFeature?.(feature);
      // Call the original onSelectItem callback
      onSelectItem?.(feature.id);
    }
  };

  const handleChevronClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onToggleExpand?.();
  };

  const handleAddSubtaskClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    onAddSubtask?.();
  };

  const handleEditClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    setIsEditing(true);
    setEditValue(feature.name);
  };

  const commitEdit = useCallback(() => {
    if (editValue.trim() && editValue.trim() !== feature.name) {
      onRename?.(feature.id, editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, feature.id, feature.name, onRename]);

  const cancelEdit = useCallback(() => {
    setEditValue(feature.name);
    setIsEditing(false);
  }, [feature.name]);

  const handleInputKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === "Enter") {
      commitEdit();
    } else if (event.key === "Escape") {
      cancelEdit();
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2.5 p-2.5 text-xs transition-all duration-150 ease-in-out cursor-pointer hover:bg-secondary/80 hover:pl-3.5 hover:shadow-[inset_2px_0_0_var(--timeline-accent)]",
        isSubtask && "pl-8",
        className
      )}
      key={feature.id}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      // biome-ignore lint/a11y/useSemanticElements: "This is a clickable item"
      role="button"
      style={{
        height: "var(--gantt-row-height)",
      }}
      tabIndex={0}
    >
      {/* Chevron for parent features with children */}
      {hasChildren && (
        <motion.button
          className="pointer-events-auto shrink-0 p-0.5 rounded cursor-pointer hover:bg-[var(--timeline-accent)]/15"
          onClick={handleChevronClick}
          type="button"
          title={isExpanded ? "Collapse" : "Expand"}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.div>
        </motion.button>
      )}

      {/* Status dot */}
      <div
        className="pointer-events-none h-2 w-2 shrink-0 rounded-full ring-1 ring-offset-1 group-hover:scale-125 transition-transform"
        style={{
          backgroundColor: feature.status.color,
        }}
      />

      {/* Feature name */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={commitEdit}
          className="flex-1 px-1 py-0.5 text-xs font-medium bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-[var(--timeline-accent)]"
        />
      ) : (
        <p
          className="flex-1 truncate text-left font-medium group-hover:text-[var(--text-primary)] transition-colors"
        >
          {feature.name}
        </p>
      )}

      {/* Right section: duration + actions — fixed layout so columns align */}
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <p className="pointer-events-none text-muted-foreground font-mono text-right min-w-[4rem] group-hover:text-[var(--text-primary)] transition-colors">
          {duration}
        </p>

        {/* Action buttons — fixed-width slot so duration stays aligned */}
        <div className="flex items-center w-[3.25rem]">
          {/* Rename button */}
          {onRename && !isEditing && (
            <motion.button
              className="pointer-events-auto shrink-0 p-1 rounded-md cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-[var(--timeline-accent)]/15 transition-opacity duration-150"
              onClick={handleEditClick}
              type="button"
              title="Rename"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </motion.button>
          )}

          {/* Add subtask button (only for parent features) */}
          {onAddSubtask && (
            <motion.button
              className="pointer-events-auto shrink-0 p-1 rounded-md cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-[var(--timeline-accent)]/15 transition-opacity duration-150"
              onClick={handleAddSubtaskClick}
              type="button"
              title="Add subtask"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
});

GanttSidebarItem.displayName = "GanttSidebarItem";

export const GanttSidebarHeader: FC = () => (
  <div
    className="sticky top-0 z-10 flex shrink-0 items-end justify-between gap-2.5 border-[var(--grid-line)] border-b bg-[var(--bg-card)] p-2.5 font-medium text-[10px] text-[var(--text-secondary)]"
    style={{ height: "var(--gantt-header-height)" }}
  >
    {/* <Checkbox className="shrink-0" /> */}
    <p className="flex-1 truncate text-left">Scope</p>
    <div className="flex items-center gap-1 shrink-0">
      <p className="text-right min-w-[4rem]">Duration</p>
      <div className="flex items-center w-[3.25rem]">
        <PencilIcon className="w-3.5 h-3.5 opacity-0" />
        <PlusIcon className="w-3.5 h-3.5 opacity-0" />
      </div>
    </div>
  </div>
);

export type GanttSidebarGroupProps = {
  children: ReactNode;
  name: string;
  className?: string;
  subRowCount?: number; // Optional: Match timeline row count for height sync
};

export const GanttSidebarGroup: FC<GanttSidebarGroupProps> = ({
  children,
  name,
  className,
  subRowCount,
}) => {
  return (
    <div className={className}>
      <div
        className="w-full flex items-center gap-2 p-2.5 text-left font-medium text-[10px] text-[var(--text-primary)] border-l border-[var(--border-color)]"
        style={{ height: "var(--gantt-row-height)" }}
      >
        <p className="truncate">{name}</p>
      </div>
      <div
        className="divide-y divide-[var(--grid-line)] overflow-hidden"
        style={subRowCount ? { height: `${subRowCount * 36}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
};

export type GanttSidebarProps = {
  children: ReactNode;
  className?: string;
};

export const GanttSidebar: FC<GanttSidebarProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "sticky left-0 z-30 h-max min-h-full overflow-clip border-[var(--grid-line)] border-r bg-[var(--bg-card)]",
      className
    )}
    data-roadmap-ui="gantt-sidebar"
  >
    <GanttSidebarHeader />
    <div className="space-y-4">{children}</div>
  </div>
);

export type GanttAddFeatureHelperProps = {
  top: number;
  className?: string;
};

export const GanttAddFeatureHelper: FC<GanttAddFeatureHelperProps> = ({
  top,
  className,
}) => {
  const [scrollX] = useGanttScrollX();
  const gantt = useContext(GanttContext);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const ganttRect = gantt.ref?.current?.getBoundingClientRect();
    const x =
      e.clientX - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
    const currentDate = getDateByMousePosition(gantt, x);

    gantt.onAddItem?.(currentDate);
  }, [gantt, scrollX]);

  return (
    <div
      className={cn("absolute top-0 w-full px-0.5", className)}
      style={{
        marginTop: -gantt.rowHeight / 2,
        transform: `translateY(${top}px)`,
      }}
    >
      <button
        className="flex h-full w-full items-center justify-center rounded-md border border-dashed p-2"
        onClick={handleClick}
        type="button"
      >
        <PlusIcon
          className="pointer-events-none select-none text-muted-foreground"
          size={16}
        />
      </button>
    </div>
  );
};

export type GanttColumnsProps = {
  columns: number;
  isColumnSecondary?: (item: number) => boolean;
};

export const GanttColumns: FC<GanttColumnsProps> = ({
  columns,
  isColumnSecondary,
}) => {
  const id = useId();
  const gantt = useContext(GanttContext);
  const [dragging] = useGanttDragging();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{ mouseY: number } | null>(null);

  const showHelper = !dragging && gantt.onAddItem;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setHoverInfo({ mouseY: e.clientY - rect.top });
    },
    []
  );

  const handleMouseLeave = useCallback(() => setHoverInfo(null), []);

  return (
    <div
      className="divide grid h-full w-full divide-x divide-[var(--grid-line)] relative"
      style={{
        gridTemplateColumns: `repeat(${columns}, var(--gantt-column-width))`,
      }}
      ref={containerRef}
      onMouseMove={showHelper ? handleMouseMove : undefined}
      onMouseLeave={showHelper ? handleMouseLeave : undefined}
    >
      {/* Plain divs — no component, no hooks, no state */}
      {Array.from({ length: columns }).map((_, index) => (
        <div
          className={cn(
            "group relative h-full overflow-hidden",
            isColumnSecondary?.(index) ? "bg-transparent" : ""
          )}
          key={`${id}-${index}`}
        />
      ))}

      {/* Single helper instance for the entire container */}
      {showHelper && hoverInfo ? (
        <GanttAddFeatureHelper top={hoverInfo.mouseY} />
      ) : null}
    </div>
  );
};

export type GanttCreateMarkerTriggerProps = {
  onCreateMarker: (date: Date) => void;
  className?: string;
};

export const GanttCreateMarkerTrigger: FC<GanttCreateMarkerTriggerProps> = ({
  onCreateMarker,
  className,
}) => {
  const gantt = useContext(GanttContext);
  const [mouseX, setMouseX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMouseX(e.clientX - rect.left);
    }
  }, []);

  const date = useMemo(() => getDateByMousePosition(gantt, mouseX), [gantt, mouseX]);

  const handleClick = useCallback(() => onCreateMarker(date), [onCreateMarker, date]);

  return (
    <div
      className={cn(
        "group pointer-events-none absolute top-0 left-0 h-full w-full select-none overflow-visible",
        className
      )}
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      <div
        className="-ml-2 pointer-events-auto sticky top-6 z-20 flex w-4 flex-col items-center justify-center gap-1 overflow-visible opacity-0 group-hover:opacity-100"
        style={{ transform: `translateX(${mouseX}px)` }}
      >
        <button
          className="z-50 inline-flex h-4 w-4 items-center justify-center rounded-full bg-card"
          onClick={handleClick}
          type="button"
        >
          <PlusIcon className="text-muted-foreground" size={12} />
        </button>
        <div className="whitespace-nowrap rounded-full border border-border/50 bg-background/90 px-2 py-1 text-foreground text-xs ">
          {formatDate(date, "MMM dd, yyyy")}
        </div>
      </div>
    </div>
  );
};

export type GanttFeatureDragHelperProps = {
  featureId: GanttFeature["id"];
  direction: "left" | "right";
  date: Date | null;
};

export const GanttFeatureDragHelper: FC<GanttFeatureDragHelperProps> = ({
  direction,
  featureId,
  date,
}) => {
  const setDragging = useSetGanttDragging();
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `feature-drag-helper-${featureId}`,
  });

  const isPressed = Boolean(attributes["aria-pressed"]);

  useEffect(() => setDragging(isPressed), [isPressed, setDragging]);

  return (
    <div
      className={cn(
        "group -translate-y-1/2 !cursor-col-resize absolute top-1/2 z-[3] h-full w-6 rounded-md outline-none",
        direction === "left" ? "-left-2.5" : "-right-2.5"
      )}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <div
        className={cn(
          "-translate-y-1/2 absolute top-1/2 h-[80%] w-1 rounded-sm bg-[var(--timeline-accent)] opacity-0 transition-all",
          direction === "left" ? "left-2.5" : "right-2.5",
          direction === "left" ? "group-hover:left-0" : "group-hover:right-0",
          isPressed && (direction === "left" ? "left-0" : "right-0"),
          "group-hover:opacity-100",
          isPressed && "opacity-100"
        )}
      />
      {date && (
        <div
          className={cn(
            "-translate-x-1/2 absolute top-10 hidden whitespace-nowrap rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-1 text-[var(--text-primary)] text-xs group-hover:block",
            isPressed && "block"
          )}
        >
          {format(date, "MMM dd, yyyy")}
        </div>
      )}
    </div>
  );
};

export type GanttFeatureItemCardProps = Pick<GanttFeature, "id"> & {
  children?: ReactNode;
  statusColor?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
};

export const GanttFeatureItemCard: FC<GanttFeatureItemCardProps> = ({
  id,
  children,
  statusColor,
  onClick,
}) => {
  const setDragging = useSetGanttDragging();
  const setDraggingFeatureId = useSetAtom(draggingFeatureIdAtom);
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  const isPressed = Boolean(attributes["aria-pressed"]);

  useEffect(() => {
    setDragging(isPressed);
    setDraggingFeatureId(isPressed ? id : null);
  }, [isPressed, setDragging, setDraggingFeatureId, id]);

  return (
    <Card
      className="h-full w-full rounded-md bg-[var(--bg-card)] border border-[var(--grid-line)] p-2 text-xs shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:border-[var(--timeline-accent)] hover:brightness-[1.08] hover:ring-1 hover:ring-[var(--timeline-accent)] transition-all duration-150"
      onClick={onClick}
    >
      {/* Left accent bar */}
      {statusColor && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: statusColor }}
        />
      )}
      {/* Improvement #4: Motion wrapper for drag elevation */}
      <motion.div
        className={cn(
          "flex h-full w-full items-center justify-between gap-2 text-left font-mono",
          isPressed && "cursor-grabbing"
        )}
        animate={{
          scale: isPressed ? 1.02 : 1,
          boxShadow: isPressed
            ? "0 10px 15px -3px rgb(0 0 0 / 0.15), 0 4px 6px -4px rgb(0 0 0 / 0.15)"
            : "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        {...attributes}
        {...listeners}
        ref={setNodeRef}
      >
        {children}
      </motion.div>
    </Card>
  );
};

export type GanttFeatureItemProps = GanttFeature & {
  onMove?: (id: string, startDate: Date, endDate: Date | null) => void;
  onSelectItem?: (id: string, anchorEl: HTMLElement) => void;
  children?: ReactNode;
  className?: string;
};

// Fix 1: rAF-throttle hook for drag handlers
function useRafCallback<T extends (...args: any[]) => void>(callback: T): T {
  const rafRef = useRef<number | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const rafCallback = useCallback((...args: any[]) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      callbackRef.current(...args);
    });
  }, []) as T;
  useEffect(() => () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); }, []);
  return rafCallback;
}


// Drag layer component - only mounted on hover
type GanttFeatureItemDragLayerProps = {
  feature: GanttFeature;
  startAt: Date;
  endAt: Date | null;
  setStartAt: (date: Date) => void;
  setEndAt: (date: Date | null) => void;
  onMove?: (id: string, startDate: Date, endDate: Date | null) => void;
  cardRef: RefObject<HTMLDivElement | null>;
  handleCardClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  children?: ReactNode;
  width: number;
  offset: number;
  addRange: (date: Date, amount: number) => Date;
  scrollX: number;
  gantt: GanttContextProps;
};

const GanttFeatureItemDragLayer: FC<GanttFeatureItemDragLayerProps> = ({
  feature,
  startAt,
  endAt,
  setStartAt,
  setEndAt,
  onMove,
  cardRef,
  handleCardClick,
  children,
  width,
  offset,
  addRange,
  scrollX,
  gantt,
}) => {
  const [previousMouseX, setPreviousMouseX] = useState(0);
  const [previousStartAt, setPreviousStartAt] = useState(startAt);
  const [previousEndAt, setPreviousEndAt] = useState(endAt);
  // Improvement #2: Drag active state
  const [isDragActive, setIsDragActive] = useState(false);
  // Improvement #3: Ghost position state
  const [originalOffset, setOriginalOffset] = useState(offset);
  const [originalWidth, setOriginalWidth] = useState(width);
  // Fix 6: Cache original date computation
  const originalDateRef = useRef<Date | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });

  const handleItemDragStart = useCallback((event: any) => {
    if (event.activatorEvent) {
      const ganttRect = gantt.ref?.current?.getBoundingClientRect();
      const mouseX = event.activatorEvent.clientX - (ganttRect?.left ?? 0) + scrollX - gantt.sidebarWidth;
      setPreviousMouseX(mouseX);
      setPreviousStartAt(startAt);
      setPreviousEndAt(endAt);
      // Improvement #2: Set drag active
      setIsDragActive(true);
      // Improvement #3: Capture original position
      setOriginalOffset(offset);
      setOriginalWidth(width);
      // Fix 6: Cache original date
      originalDateRef.current = getDateByMousePosition(gantt, mouseX);
    }
  }, [gantt, scrollX, startAt, endAt, offset, width]);

  const handleItemDragMoveRaw = useCallback((event: any) => {
    if (event.activatorEvent && event.delta) {
      const ganttRect = gantt.ref?.current?.getBoundingClientRect();
      const currentMouseX = event.activatorEvent.clientX - (ganttRect?.left ?? 0) + event.delta.x + scrollX - gantt.sidebarWidth;
      const currentDate = getDateByMousePosition(gantt, currentMouseX);
      const originalDate = originalDateRef.current!;
      const delta =
        gantt.range === "daily"
          ? getDifferenceIn(gantt.range)(currentDate, originalDate)
          : getInnerDifferenceIn(gantt.range)(currentDate, originalDate);
      const newStartDate = addDays(previousStartAt, delta);
      const newEndDate = previousEndAt ? addDays(previousEndAt, delta) : null;

      // Improvement #1: Snap to day
      const snappedStart = startOfDay(newStartDate);
      const snappedEnd = newEndDate ? startOfDay(newEndDate) : null;
      setStartAt(snappedStart);
      setEndAt(snappedEnd);
    }
  }, [gantt, scrollX, previousStartAt, previousEndAt, setStartAt, setEndAt]);

  // Fix 1: Wrap with rAF throttle
  const handleItemDragMove = useRafCallback(handleItemDragMoveRaw);

  const onDragEnd = useCallback(
    () => {
      onMove?.(feature.id, startAt, endAt);
      // Improvement #2: Clear drag active
      setIsDragActive(false);
      // Fix 6: Clear cached date
      originalDateRef.current = null;
    },
    [onMove, feature.id, startAt, endAt]
  );

  // Improvement #2: Drag cancel handler
  const onDragCancel = useCallback(() => {
    setStartAt(previousStartAt);
    setEndAt(previousEndAt);
    setIsDragActive(false);
    originalDateRef.current = null;
  }, [previousStartAt, previousEndAt, setStartAt, setEndAt]);

  const handleLeftDragMoveRaw = useCallback((event: any) => {
    if (event.activatorEvent && event.delta) {
      const ganttRect = gantt.ref?.current?.getBoundingClientRect();
      const x =
        event.activatorEvent.clientX - (ganttRect?.left ?? 0) + event.delta.x + scrollX - gantt.sidebarWidth;
      const newStartAt = getDateByMousePosition(gantt, x);

      // Improvement #1: Snap to day
      const snappedStart = startOfDay(newStartAt);
      setStartAt(snappedStart);
    }
  }, [gantt, scrollX, setStartAt, endAt]);

  // Fix 1: Wrap with rAF throttle
  const handleLeftDragMove = useRafCallback(handleLeftDragMoveRaw);

  const handleRightDragMoveRaw = useCallback((event: any) => {
    if (event.activatorEvent && event.delta) {
      const ganttRect = gantt.ref?.current?.getBoundingClientRect();
      const x =
        event.activatorEvent.clientX - (ganttRect?.left ?? 0) + event.delta.x + scrollX - gantt.sidebarWidth;
      const newEndAt = getDateByMousePosition(gantt, x);

      // Improvement #1: Snap to day
      const snappedEnd = startOfDay(newEndAt);
      setEndAt(snappedEnd);
    }
  }, [gantt, scrollX, setEndAt, startAt]);

  // Fix 1: Wrap with rAF throttle
  const handleRightDragMove = useRafCallback(handleRightDragMoveRaw);

  // Improvement #2: Escape key handler
  useEffect(() => {
    if (!isDragActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDragCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDragActive, onDragCancel]);

  // Improvement #6: Calculate day delta for indicator
  const dayDelta = useMemo(() => {
    if (!isDragActive) return 0;
    return differenceInDays(startAt, previousStartAt);
  }, [isDragActive, startAt, previousStartAt]);

  const deltaText = useMemo(() => {
    if (dayDelta === 0) return null;
    const absDelta = Math.abs(dayDelta);
    const sign = dayDelta > 0 ? "+" : "-";
    if (absDelta >= 7) {
      const weeks = Math.round(absDelta / 7);
      return `${sign}${weeks} week${weeks !== 1 ? "s" : ""}`;
    }
    return `${sign}${absDelta} day${absDelta !== 1 ? "s" : ""}`;
  }, [dayDelta]);

  return (
    <>
      {/* Improvement #3: Ghost outline at original position */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 rounded-md border-2 border-dashed border-[var(--timeline-accent)]"
            style={{
              transform: `translateX(${Math.round(originalOffset)}px)`,
              width: Math.round(originalWidth),
              height: "calc(var(--gantt-row-height) - 4px)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Improvement #6: Date delta indicator */}
      <AnimatePresence>
        {isDragActive && deltaText && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: -8 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium shadow-md z-50"
            style={{
              backgroundColor: dayDelta > 0 ? "rgb(59, 130, 246)" : "rgb(239, 68, 68)",
              color: "white",
            }}
          >
            {deltaText}
          </motion.div>
        )}
      </AnimatePresence>

      {onMove && (
        <DndContext
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
          onDragMove={handleLeftDragMove}
          sensors={[mouseSensor]}
        >
          <GanttFeatureDragHelper
            date={startAt}
            direction="left"
            featureId={feature.id}
          />
        </DndContext>
      )}
      <DndContext
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        onDragMove={handleItemDragMove}
        onDragStart={handleItemDragStart}
        sensors={[mouseSensor]}
      >
        <GanttFeatureItemCard
          id={feature.id}
          statusColor={feature.status.color}
          onClick={handleCardClick}
        >
          {children ?? (
            <p className="flex-1 truncate text-xs">{feature.name}</p>
          )}
        </GanttFeatureItemCard>
      </DndContext>
      {onMove && (
        <DndContext
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
          onDragMove={handleRightDragMove}
          sensors={[mouseSensor]}
        >
          <GanttFeatureDragHelper
            date={endAt ?? addRange(startAt, 2)}
            direction="right"
            featureId={feature.id}
          />
        </DndContext>
      )}
    </>
  );
};

export const GanttFeatureItem: FC<GanttFeatureItemProps> = memo(({
  onMove,
  onSelectItem,
  children,
  className,
  ...feature
}) => {
  const [scrollX] = useGanttScrollX();
  const gantt = useContext(GanttContext);
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1),
    [gantt.timelineData]
  );
  const [startAt, setStartAt] = useState<Date>(feature.startAt);
  const [endAt, setEndAt] = useState<Date | null>(feature.endAt);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  // Fix 5: Derived atom for dragging state
  const isDraggingThisAtom = useMemo(
    () => atom((get) => get(draggingFeatureIdAtom) === feature.id),
    [feature.id]
  );
  const isDraggingThis = useAtomValue(isDraggingThisAtom);

  // Memoize expensive calculations
  const width = useMemo(
    () => getWidth(startAt, endAt, gantt),
    [startAt, endAt, gantt]
  );
  const offset = useMemo(
    () => getOffset(startAt, timelineStartDate, gantt),
    [startAt, timelineStartDate, gantt]
  );

  const addRange = useMemo(() => getAddRange(gantt.range), [gantt.range]);

  const handleCardClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      onSelectItem?.(feature.id, cardRef.current);
    }
  }, [onSelectItem, feature.id]);

  return (
    <div
      className={cn("relative flex w-max min-w-full py-0.5", className)}
      style={{ height: "var(--gantt-row-height)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Fix 3: Use transform instead of left for GPU compositing */}
      <motion.div
        ref={cardRef}
        className="pointer-events-auto absolute top-0.5"
        style={{
          height: "calc(var(--gantt-row-height) - 4px)",
          left: 0,
          // Improvement #4: Increase z-index when dragging
          zIndex: isDraggingThis ? 50 : 1,
          willChange: isDraggingThis ? 'transform, width' : 'auto',
        }}
        animate={{
          x: Math.round(offset),
          width: Math.round(width),
        }}
        transition={
          isDraggingThis
            ? { duration: 0 }
            : { type: "spring", stiffness: 400, damping: 25 }
        }
      >
        {isHovered ? (
          <GanttFeatureItemDragLayer
            feature={feature}
            startAt={startAt}
            endAt={endAt}
            setStartAt={setStartAt}
            setEndAt={setEndAt}
            onMove={onMove}
            cardRef={cardRef}
            handleCardClick={handleCardClick}
            width={width}
            offset={offset}
            addRange={addRange}
            scrollX={scrollX}
            gantt={gantt}
          >
            {children}
          </GanttFeatureItemDragLayer>
        ) : (
          <Card
            className="h-full w-full rounded-md bg-[var(--bg-card)] border border-[var(--grid-line)] p-2 text-xs shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:border-[var(--timeline-accent)] hover:brightness-[1.08] hover:ring-1 hover:ring-[var(--timeline-accent)] transition-all duration-150"
            onClick={handleCardClick}
          >
            {/* Left accent bar */}
            {feature.status.color && (
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: feature.status.color }}
              />
            )}
            <div className="flex h-full w-full items-center justify-between gap-2 text-left font-mono">
              {children ?? (
                <p className="flex-1 truncate text-xs">{feature.name}</p>
              )}
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
});

GanttFeatureItem.displayName = "GanttFeatureItem";

export type GanttFeatureListGroupProps = {
  children: ReactNode;
  className?: string;
};

export const GanttFeatureListGroup: FC<GanttFeatureListGroupProps> = ({
  children,
  className,
}) => (
  <div className={className} style={{ paddingTop: "var(--gantt-row-height)" }}>
    {children}
  </div>
);

export type GanttFeatureRowProps = {
  features: GanttFeature[];
  onMove?: (id: string, startAt: Date, endAt: Date | null) => void;
  onSelectItem?: (id: string, anchorEl: HTMLElement) => void;
  children?: (feature: GanttFeature) => ReactNode;
  className?: string;
  subRowCount?: number; // Optional: pre-computed sub-row count for performance
};

export const GanttFeatureRow: FC<GanttFeatureRowProps> = memo(({
  features,
  onMove,
  onSelectItem,
  children,
  className,
  subRowCount,
}) => {
  // Use pre-computed sub-row count if available, otherwise calculate
  const maxSubRows = subRowCount ?? computeSubRows(features);

  // Sort features by start date to handle potential overlaps
  const sortedFeatures = [...features].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime()
  );

  // Calculate sub-row positions for overlapping features using a proper algorithm
  const featureWithPositions = [];
  const subRowEndTimes: Date[] = []; // Track when each sub-row becomes free

  for (const feature of sortedFeatures) {
    let subRow = 0;

    // Find the first sub-row that's free (doesn't overlap)
    while (
      subRow < subRowEndTimes.length &&
      subRowEndTimes[subRow]! > feature.startAt
    ) {
      subRow++;
    }

    // Update the end time for this sub-row
    if (subRow === subRowEndTimes.length) {
      subRowEndTimes.push(feature.endAt);
    } else {
      subRowEndTimes[subRow] = feature.endAt;
    }

    featureWithPositions.push({ ...feature, subRow });
  }

  const subRowHeight = 36; // Base row height

  return (
    <div
      className={cn("relative", className)}
      style={{
        height: `${maxSubRows * subRowHeight}px`,
        minHeight: "var(--gantt-row-height)",
      }}
    >
      {featureWithPositions.map((feature) => (
        <div
          className="absolute w-full"
          key={feature.id}
          style={{
            top: `${feature.subRow * subRowHeight}px`,
            height: `${subRowHeight}px`,
          }}
        >
          <GanttFeatureItem {...feature} onMove={onMove} onSelectItem={onSelectItem}>
            {children ? (
              children(feature)
            ) : (
              <p className="flex-1 truncate text-xs">{feature.name}</p>
            )}
          </GanttFeatureItem>
        </div>
      ))}
    </div>
  );
});

GanttFeatureRow.displayName = "GanttFeatureRow";

export type GanttFeatureListProps = {
  className?: string;
  children: ReactNode;
};

export const GanttFeatureList: FC<GanttFeatureListProps> = ({
  className,
  children,
}) => (
  <div
    className={cn("absolute top-0 left-0 h-full w-max space-y-4", className)}
    style={{ marginTop: "var(--gantt-header-height)" }}
  >
    {children}
  </div>
);

export const GanttMarker: FC<
  GanttMarkerProps & {
    onRemove?: (id: string) => void;
    className?: string;
  }
> = memo(({ label, date, id, onRemove, className }) => {
  const gantt = useContext(GanttContext);
  const differenceIn = useMemo(
    () => getDifferenceIn(gantt.range),
    [gantt.range]
  );
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1),
    [gantt.timelineData]
  );

  // Memoize expensive calculations
  const offset = useMemo(
    () => differenceIn(date, timelineStartDate),
    [differenceIn, date, timelineStartDate]
  );
  const innerOffset = useMemo(
    () =>
      calculateInnerOffset(
        date,
        gantt.range,
        (gantt.columnWidth * gantt.zoom) / 100
      ),
    [date, gantt.range, gantt.columnWidth, gantt.zoom]
  );

  const handleRemove = useCallback(() => onRemove?.(id), [onRemove, id]);

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 flex h-full select-none flex-col items-center justify-center overflow-visible"
      style={{
        width: 0,
        transform: `translateX(calc(var(--gantt-column-width) * ${offset} + ${innerOffset}px))`,
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group pointer-events-auto sticky top-0 flex select-auto flex-col flex-nowrap items-center justify-center whitespace-nowrap rounded-b-md bg-[var(--bg-card)] px-2 py-1 text-[var(--text-primary)] text-xs border border-[var(--border-color)]",
              className
            )}
          >
            {label}
            <span className="max-h-[0] overflow-hidden opacity-80 transition-all group-hover:max-h-[2rem]">
              {formatDate(date, "MMM dd, yyyy")}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {onRemove ? (
            <ContextMenuItem
              className="flex items-center gap-2 text-destructive"
              onClick={handleRemove}
            >
              <TrashIcon size={16} />
              Remove marker
            </ContextMenuItem>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
      <div className={cn("h-full w-px bg-[var(--text-secondary)]", className)} />
    </div>
  );
});

GanttMarker.displayName = "GanttMarker";

export type GanttProviderProps = {
  range?: Range;
  zoom?: number;
  onAddItem?: (date: Date) => void;
  children: ReactNode;
  className?: string;
};

export const GanttProvider: FC<GanttProviderProps> = ({
  zoom = 100,
  range = "monthly",
  onAddItem,
  children,
  className,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [timelineData, setTimelineData] = useState<TimelineData>(
    createInitialTimelineData(new Date())
  );
  const timelineDataRef = useRef<TimelineData>(timelineData);
  const [, setScrollX] = useGanttScrollX();
  const [sidebarWidth, setSidebarWidth] = useState(0);

  // Keep ref in sync with state
  timelineDataRef.current = timelineData;

  const headerHeight = 60;
  const rowHeight = 36;
  let columnWidth = 50;

  if (range === "monthly") {
    columnWidth = 150;
  } else if (range === "quarterly") {
    columnWidth = 100;
  }

  // Memoize CSS variables to prevent unnecessary re-renders
  const cssVariables = useMemo(
    () =>
      ({
        "--gantt-zoom": `${zoom}`,
        "--gantt-column-width": `${(zoom / 100) * columnWidth}px`,
        "--gantt-header-height": `${headerHeight}px`,
        "--gantt-row-height": `${rowHeight}px`,
        "--gantt-sidebar-width": `${sidebarWidth}px`,
      }) as CSSProperties,
    [zoom, columnWidth, sidebarWidth]
  );

  useEffect(() => {
    if (scrollRef.current) {
      const today = new Date();
      const timelineStartDate = new Date(timelineData[0]?.year ?? today.getFullYear(), 0, 1);
      const todayOffset = getOffset(today, timelineStartDate, {
        zoom,
        range,
        columnWidth,
        sidebarWidth,
        headerHeight,
        rowHeight,
        onAddItem,
        placeholderLength: 2,
        timelineData,
        ref: scrollRef,
      });
      // Center today in the visible area
      scrollRef.current.scrollLeft = Math.max(0, todayOffset - scrollRef.current.clientWidth / 2);
      setScrollX(scrollRef.current.scrollLeft);
    }
  }, [setScrollX, timelineData, zoom, range, columnWidth, sidebarWidth, headerHeight, rowHeight, onAddItem]);

  // Update sidebar width when DOM is ready
  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebarElement = scrollRef.current?.querySelector(
        '[data-roadmap-ui="gantt-sidebar"]'
      );
      const newWidth = sidebarElement ? 300 : 0;
      setSidebarWidth(newWidth);
    };

    // Update immediately
    updateSidebarWidth();

    // Also update on resize or when children change
    const observer = new MutationObserver(updateSidebarWidth);
    if (scrollRef.current) {
      observer.observe(scrollRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Fix stale closure by using ref and functional updater
  const handleScroll = useCallback(
    throttle(() => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) {
        return;
      }

      const { scrollLeft, scrollWidth, clientWidth } = scrollElement;
      setScrollX(scrollLeft);

      if (scrollLeft === 0) {
        // Extend timelineData to the past
        const currentTimelineData = timelineDataRef.current;
        const firstYear = currentTimelineData[0]?.year;

        if (!firstYear) {
          return;
        }

        setTimelineData((prev) => {
          const newTimelineData: TimelineData = [...prev];
          newTimelineData.unshift({
            year: firstYear - 1,
            quarters: new Array(4).fill(null).map((_, quarterIndex) => ({
              months: new Array(3).fill(null).map((_, monthIndex) => {
                const month = quarterIndex * 3 + monthIndex;
                return {
                  days: getDaysInMonth(new Date(firstYear, month, 1)),
                };
              }),
            })),
          });
          return newTimelineData;
        });

        // Scroll a bit forward so it's not at the very start
        scrollElement.scrollLeft = scrollElement.clientWidth;
        setScrollX(scrollElement.scrollLeft);
      } else if (scrollLeft + clientWidth >= scrollWidth) {
        // Extend timelineData to the future
        const currentTimelineData = timelineDataRef.current;
        const lastYear = currentTimelineData.at(-1)?.year;

        if (!lastYear) {
          return;
        }

        setTimelineData((prev) => {
          const newTimelineData: TimelineData = [...prev];
          newTimelineData.push({
            year: lastYear + 1,
            quarters: new Array(4).fill(null).map((_, quarterIndex) => ({
              months: new Array(3).fill(null).map((_, monthIndex) => {
                const month = quarterIndex * 3 + monthIndex;
                return {
                  days: getDaysInMonth(new Date(lastYear, month, 1)),
                };
              }),
            })),
          });
          return newTimelineData;
        });

        // Scroll a bit back so it's not at the very end
        scrollElement.scrollLeft =
          scrollElement.scrollWidth - scrollElement.clientWidth;
        setScrollX(scrollElement.scrollLeft);
      }
    }, 100),
    [setScrollX]
  );

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      // Fix memory leak by properly referencing the scroll element
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  const scrollToFeature = useCallback(
    (feature: GanttFeature) => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) {
        return;
      }

      // Calculate timeline start date from timelineData
      const timelineStartDate = new Date(timelineData[0]?.year ?? new Date().getFullYear(), 0, 1);

      // Calculate the horizontal offset for the feature's start date
      const offset = getOffset(feature.startAt, timelineStartDate, {
        zoom,
        range,
        columnWidth,
        sidebarWidth,
        headerHeight,
        rowHeight,
        onAddItem,
        placeholderLength: 2,
        timelineData,
        ref: scrollRef,
      });

      // Scroll to align the feature's start with the right side of the sidebar
      const targetScrollLeft = Math.max(0, offset);

      scrollElement.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });
    },
    [timelineData, zoom, range, columnWidth, sidebarWidth, onAddItem]
  );

  return (
    <GanttContext.Provider
      value={{
        zoom,
        range,
        headerHeight,
        columnWidth,
        sidebarWidth,
        rowHeight,
        onAddItem,
        timelineData,
        placeholderLength: 2,
        ref: scrollRef,
        scrollToFeature,
      }}
    >
      <div
        className={cn(
          "gantt relative isolate grid h-full w-full flex-none select-none overflow-auto rounded-sm bg-[var(--bg-primary)]",
          range,
          className
        )}
        ref={scrollRef}
        style={{
          ...cssVariables,
          gridTemplateColumns: "var(--gantt-sidebar-width) 1fr",
        }}
      >
        {children}
      </div>
    </GanttContext.Provider>
  );
};

export type GanttTimelineProps = {
  children: ReactNode;
  className?: string;
};

export const GanttTimeline: FC<GanttTimelineProps> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "relative flex h-full w-max flex-none overflow-clip",
      className
    )}
  >
    {children}
  </div>
);

export type GanttTodayProps = {
  className?: string;
};

export const GanttToday: FC<GanttTodayProps> = ({ className }) => {
  const label = "Today";
  const date = useMemo(() => new Date(), []);
  const gantt = useContext(GanttContext);
  const differenceIn = useMemo(
    () => getDifferenceIn(gantt.range),
    [gantt.range]
  );
  const timelineStartDate = useMemo(
    () => new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1),
    [gantt.timelineData]
  );

  // Memoize expensive calculations
  const offset = useMemo(
    () => differenceIn(date, timelineStartDate),
    [differenceIn, date, timelineStartDate]
  );
  const innerOffset = useMemo(
    () =>
      calculateInnerOffset(
        date,
        gantt.range,
        (gantt.columnWidth * gantt.zoom) / 100
      ),
    [date, gantt.range, gantt.columnWidth, gantt.zoom]
  );

  return (
    <div
      className="pointer-events-none absolute top-0 left-0 z-20 flex h-full select-none flex-col items-center justify-center overflow-visible"
      style={{
        width: 0,
        transform: `translateX(calc(var(--gantt-column-width) * ${offset} + ${innerOffset}px))`,
      }}
    >
      <div
        className={cn(
          "group pointer-events-auto sticky top-0 flex select-auto flex-col flex-nowrap items-center justify-center whitespace-nowrap rounded-b-md bg-[var(--accent-primary)] text-[var(--bg-primary)] px-2 py-1 text-xs font-medium",
          className
        )}
      >
        {label}
        <span className="max-h-[0] overflow-hidden opacity-80 transition-all group-hover:max-h-[2rem]">
          {formatDate(date, "MMM dd, yyyy")}
        </span>
      </div>
      <div className={cn("h-full w-[2px] bg-[var(--accent-primary)]", className)} />
    </div>
  );
};
