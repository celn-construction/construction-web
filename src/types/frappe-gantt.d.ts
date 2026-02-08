declare module 'frappe-gantt' {
  interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string[];
    [key: string]: unknown;
  }

  interface PopupContext {
    task: GanttTask;
    chart: Gantt;
    set_title(title: string): void;
    set_subtitle(subtitle: string): void;
    set_details(html: string): void;
    add_action(label: string, callback: () => void): void;
    hide(): void;
  }

  interface GanttOptions {
    view_mode?: string;
    date_format?: string;
    bar_height?: number;
    bar_corner_radius?: number;
    padding?: number;
    column_width?: number;
    scroll_to?: string | Date;
    popup?: (ctx: PopupContext) => void;
    popup_on?: 'click' | 'hover';
    readonly?: boolean;
    readonly_dates?: boolean;
    readonly_progress?: boolean;
    holidays?: string[];
    ignore?: string[];
    lines?: 'both' | 'vertical' | 'horizontal' | 'none';
    today_button?: boolean;
    snap_at?: number;
    move_dependencies?: boolean;
    on_click?: (task: GanttTask) => void;
    on_double_click?: (task: GanttTask) => void;
    on_hover?: (task: GanttTask) => void;
    on_date_change?: (task: GanttTask, start: Date, end: Date) => void;
    on_progress_change?: (task: GanttTask, progress: number) => void;
    on_view_change?: (mode: { name: string }) => void;
    view_mode_select?: boolean;
    view_modes?: string[];
    container_height?: number;
    language?: string;
  }

  class Gantt {
    tasks: GanttTask[];

    constructor(
      wrapper: string | HTMLElement,
      tasks: GanttTask[],
      options?: GanttOptions
    );

    change_view_mode(mode: string): void;
    refresh(tasks: GanttTask[]): void;
    update_task(id: string, task: Partial<GanttTask>): void;
    update_options(options: Partial<GanttOptions>): void;
    scroll_current(): void;
  }

  export default Gantt;
}
