import type { Model, Column, Grid, Row, TaskModel, DomClassList } from '@bryntum/gantt';

export type PopoverPlacement = {
  anchorPosition: { top: number; left: number };
  transformOrigin: {
    vertical: 'center' | 'top' | 'bottom';
    horizontal: 'left' | 'right';
  };
  paperMargin: string;
};

export type SelectedTask = {
  id: string;
  name: string;
};

export type TaskClickEventPayload = {
  taskRecord: {
    id: string | number;
    name?: string;
    isParent?: boolean;
    /**
     * Bryntum sets this to true while the record has only a generated/phantom
     * id (i.e. has not been persisted via gantt.sync yet). Mutations that read
     * `record.id` against the DB will fail with NOT_FOUND for phantom records.
     */
    isPhantom?: boolean;
  };
  event: {
    target: EventTarget | null;
    clientX: number;
    clientY: number;
  };
};

export type TaskClickHandler = (payload: TaskClickEventPayload) => void;

/** Bryntum DomConfig — a virtual DOM node descriptor used by column renderers. */
export interface BryntumDomConfig {
  tag?: string;
  class?: string;
  html?: string;
  text?: string;
  style?: string | Record<string, string>;
  dataset?: Record<string, string>;
  children?: BryntumDomConfig[];
  [key: string]: unknown;
}

/** Column renderer data — mirrors Bryntum's own renderer signature from gantt.d.ts. */
export interface ColumnRendererData {
  cellElement: HTMLElement;
  value: unknown;
  record: Model;
  column: Column;
  grid: Grid;
  row: Row;
  size: { height: number; configuredHeight: number };
  isExport: boolean;
  isMeasuring: boolean;
}

type GanttColumnConfig = {
  type: string;
  field?: string;
  text?: string;
  flex?: number;
  minWidth?: number;
  width?: number;
  resizable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  widgets?: Record<string, unknown>[];
  renderer?: (data: ColumnRendererData) => string | BryntumDomConfig | BryntumDomConfig[] | HTMLElement | void;
};

type TooltipRendererArgs = {
  record: Record<string, unknown>;
  column: {
    field?: string;
  };
};

/** Minimal interface for Bryntum dependency records. */
export interface BryntumDependencyRecord {
  id: string | number;
  fromTask: BryntumTaskRecord;
  toTask: BryntumTaskRecord;
  type: number;
  lag: number;
  lagUnit: string | null;
  set(field: string | Record<string, unknown>, value?: unknown): void;
  remove(): void;
}

/** Minimal interface for Bryntum resource records. */
export interface BryntumResourceRecord {
  id: string | number;
  name: string;
}

/** Minimal interface for Bryntum assignment records. */
export interface BryntumAssignmentRecord {
  id: string | number;
  resource: BryntumResourceRecord;
  event: BryntumTaskRecord;
  units: number;
  set(field: string | Record<string, unknown>, value?: unknown): void;
  remove(): void;
}

/** Minimal interface for Bryntum task record methods used in row actions and task info dialog. */
export interface BryntumTaskRecord {
  id: string | number;
  name?: string;
  isExpanded: boolean;
  isParent: boolean;
  predecessors: BryntumDependencyRecord[];
  successors: BryntumDependencyRecord[];
  startDate: Date | null;
  endDate: Date | null;
  duration: number | null;
  durationUnit: string;
  percentDone: number;
  effort: number | null;
  effortUnit: string | null;
  manuallyScheduled: boolean;
  constraintType: string | null;
  constraintDate: Date | null;
  note: string | null;
  cls: string | null;
  rollup: boolean;
  appendChild(data: Record<string, unknown>): void;
  remove(): void;
  get(field: string): unknown;
  set(field: string | Record<string, unknown>, value?: unknown): void;
}

/** Minimal interface for Gantt instance methods used in row action handlers. */
export interface BryntumGanttInstance {
  expand(record: BryntumTaskRecord): void;
  indent(records: BryntumTaskRecord[]): void;
  outdent(records: BryntumTaskRecord[]): void;
  selectedRecords: BryntumTaskRecord[];
  dependencyStore: {
    remove(records: unknown[]): void;
    add(data: Record<string, unknown>): unknown;
    allRecords: BryntumDependencyRecord[];
  };
  project: {
    taskStore: {
      getById(id: string | number): BryntumTaskRecord | null;
      allRecords: BryntumTaskRecord[];
    };
    resourceStore: {
      allRecords: BryntumResourceRecord[];
    };
    assignmentStore: {
      add(data: Record<string, unknown>): unknown;
      remove(records: unknown[]): void;
      allRecords: BryntumAssignmentRecord[];
    };
    dependencyStore: {
      add(data: Record<string, unknown>): unknown;
      remove(records: unknown[]): void;
      allRecords: BryntumDependencyRecord[];
    };
  };
}

export type GanttConfig = {
  height?: string;
  autoHeight?: boolean;
  autoAdjustTimeAxis?: boolean;
  infiniteScroll?: boolean;
  bufferCoef?: number;
  detectCSSCompatibilityIssues: boolean;
  loadMask?: string | null | Record<string, unknown>;
  syncMask?: string | null | Record<string, unknown>;
  rowHeight?: number;
  animateTreeNodeToggle?: boolean;
  project: {
    autoLoad: boolean;
    autoSync?: boolean;
    writeAllFields?: boolean;
    taskModelClass?: typeof TaskModel;
    delayCalculation?: boolean;
    resetUndoRedoQueuesAfterLoad?: boolean;
    stm?: {
      autoRecord?: boolean;
      autoRecordTransactionStopTimeout?: number;
      disabled?: boolean;
    };
    transport: {
      load: {
        url: string;
        fetchOptions?: {
          credentials: 'include' | 'omit' | 'same-origin';
        };
      };
      sync?: {
        url: string;
        fetchOptions?: {
          credentials: 'include' | 'omit' | 'same-origin';
        };
      };
    };
    listeners?: {
      beforeLoad?: () => void;
      load?: () => void;
      loadFail?: (payload: { response: { message?: string } }) => void;
    };
  };
  columns: GanttColumnConfig[];
  features: {
    taskEdit?: boolean;
    columnLines?: boolean | { renderer?: (...args: unknown[]) => void };
    stripe?: boolean;
    nonWorkingTime?: boolean;
    cellTooltip: {
      tooltipRenderer: (args: TooltipRendererArgs) => string;
    };
    tree?: { toggleTreeNode?: boolean };
    percentBar?: boolean | { allowResize?: boolean };
    taskResize?: boolean | {
      showTooltip?: boolean;
      allowResizeToZero?: boolean;
      leftHandle?: boolean;
      rightHandle?: boolean;
      tooltipTemplate?: (data: {
        record: TaskModel;
        startDate: Date | null;
        endDate: Date | null;
        duration: number | null;
      }) => string;
    };
    taskMenu?: boolean | { cls?: string };
    cellMenu?: boolean | { cls?: string };
    scheduleMenu?: boolean | { cls?: string };
    dependencyMenu?: boolean | { cls?: string };
  };
  emptyText?: string;
  viewPreset: string;
  presets?: Array<{
    id: string;
    base?: string;
    headers?: Array<{ unit: string; dateFormat: string }>;
  }>;
  startDate?: Date;
  endDate?: Date;
  barMargin: number;
  taskRenderer?: (detail: {
    taskRecord: TaskModel;
    renderData: {
      cls: DomClassList | string;
      style: string | Record<string, string>;
      wrapperCls: DomClassList | string;
      iconCls: DomClassList | string;
    };
  }) => string | BryntumDomConfig | BryntumDomConfig[];
  listeners: {
    taskClick?: TaskClickHandler;
    cellDblClick?: (event: {
      grid: Grid;
      record: Model;
      column: Column;
      cellElement: HTMLElement;
      target: HTMLElement;
      event: MouseEvent;
    }) => void;
    cellClick?: (event: {
      grid: Grid;
      record: Model;
      column: Column;
      cellElement: HTMLElement;
      target: HTMLElement;
      event: MouseEvent;
    }) => void;
  };
};
