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
  };
  event: {
    target: EventTarget | null;
    clientX: number;
    clientY: number;
  };
};

export type TaskClickHandler = (payload: TaskClickEventPayload) => void;

type GanttColumnConfig = {
  type: string;
  field?: string;
  text?: string;
  flex?: number;
  minWidth?: number;
  width?: number;
  resizable?: boolean;
};

type TooltipRendererArgs = {
  record: Record<string, unknown>;
  column: {
    field?: string;
  };
};

export type GanttConfig = {
  height?: string;
  autoHeight?: boolean;
  detectCSSCompatibilityIssues: boolean;
  rowHeight?: number;
  animateTreeNodeToggle?: boolean;
  toggleParentTasksOnClick?: boolean;
  project: {
    autoLoad: boolean;
    autoSync?: boolean;
    delayCalculation?: boolean;
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
    cellTooltip: {
      tooltipRenderer: (args: TooltipRendererArgs) => string;
    };
  };
  emptyText?: string;
  viewPreset: string;
  startDate?: Date;
  endDate?: Date;
  barMargin: number;
  listeners: {
    taskClick: TaskClickHandler;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellDblClick?: (...args: any[]) => void;
  };
};
