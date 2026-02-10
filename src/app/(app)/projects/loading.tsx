export default function ProjectsLoading() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg p-6">
      {/* Tree skeleton with two-level indentation (groups and tasks) */}
      <div className="space-y-2 animate-pulse">
        {[
          { indent: 0, width: 'w-48' }, // Group
          { indent: 1, width: 'w-40' }, // Task
          { indent: 1, width: 'w-44' }, // Task
          { indent: 1, width: 'w-36' }, // Task
          { indent: 0, width: 'w-52' }, // Group
          { indent: 1, width: 'w-44' }, // Task
          { indent: 1, width: 'w-40' }, // Task
          { indent: 1, width: 'w-32' }, // Task
          { indent: 0, width: 'w-48' }, // Group
          { indent: 1, width: 'w-36' }, // Task
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2"
            style={{ paddingLeft: `${item.indent * 24}px` }}
          >
            <div className="h-5 w-5 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className={`h-8 ${item.width} bg-gray-200 dark:bg-gray-800 rounded`} />
          </div>
        ))}
      </div>
    </div>
  );
}
