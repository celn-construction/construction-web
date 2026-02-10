import { useConstructionStore } from '../useConstructionStore';
import type { GanttDependency } from '@/types/gantt-types';

export function useDependencies(): GanttDependency[] {
  return useConstructionStore((state) => state.dependencies);
}
