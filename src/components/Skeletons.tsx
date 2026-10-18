export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="neo-card p-5 bg-white h-32">
            <div className="h-3 bg-gray-200 border border-black/20 w-24 mb-3"></div>
            <div className="h-8 bg-gray-300 border border-black/20 w-36 mb-3"></div>
            <div className="h-3 bg-gray-200 border border-black/20 w-48"></div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="neo-card p-5 bg-white h-96 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-gray-300 border border-black/20 w-48"></div>
          <div className="h-6 bg-gray-200 border border-black/20 w-24"></div>
        </div>
        <div className="h-64 bg-gray-100 border border-black/10 flex items-center justify-center text-xs font-bold text-gray-400">
          Loading electricity analytics...
        </div>
        <div className="h-4 bg-gray-200 border border-black/20 w-64 mx-auto"></div>
      </div>

      {/* Tips and Spikes Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 neo-card p-5 bg-white h-64">
          <div className="h-5 bg-gray-300 border border-black/20 w-36 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-36 bg-gray-100 border border-black/10"></div>
            <div className="h-36 bg-gray-100 border border-black/10"></div>
          </div>
        </div>
        <div className="neo-card p-5 bg-white h-64">
          <div className="h-5 bg-gray-300 border border-black/20 w-28 mb-4"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-100 border border-black/10"></div>
            <div className="h-12 bg-gray-100 border border-black/10"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
