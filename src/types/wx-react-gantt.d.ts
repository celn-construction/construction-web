declare module 'wx-react-gantt' {
  import { ComponentType } from 'react';

  interface GanttProps {
    tasks?: any[];
    links?: any[];
    scales?: any[];
    columns?: any[] | false;
    zoom?: boolean | object;
    init?: (api: any) => void;
    apiRef?: React.RefObject<any>;
    ref?: React.RefObject<any>;
    taskTemplate?: ComponentType<any>;
    [key: string]: any;
  }

  export const Gantt: ComponentType<GanttProps>;
}

declare module 'wx-react-gantt/dist/gantt.css';
