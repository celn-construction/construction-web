/** Summary counts for display in the revision list. */
export interface RevisionSummary {
  tasksAdded: number;
  tasksModified: number;
  tasksRemoved: number;
  dependenciesAdded: number;
  dependenciesModified: number;
  dependenciesRemoved: number;
  resourcesAdded: number;
  resourcesModified: number;
  resourcesRemoved: number;
  assignmentsAdded: number;
  assignmentsModified: number;
  assignmentsRemoved: number;
  timeRangesAdded: number;
  timeRangesModified: number;
  timeRangesRemoved: number;
  totalChanges: number;
}
