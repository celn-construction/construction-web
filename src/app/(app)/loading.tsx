export default function AppLoading() {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header skeleton */}
      <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />

      {/* Content skeleton */}
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-lg animate-pulse" />
    </div>
  );
}
