export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border-l-4 border-l-gray-200 border border-gray-200 p-5">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="flex gap-4 mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-5 w-40 mb-6" />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-200 px-6 py-4">
          <Skeleton className="h-6 w-48 mb-2 bg-gray-300" />
          <Skeleton className="h-4 w-32 bg-gray-300" />
        </div>
        <div className="px-6 py-5 border-b border-gray-200">
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-5 border-b border-gray-200">
          <Skeleton className="h-4 w-20 mb-3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full mb-2" />
          ))}
        </div>
        <div className="px-6 py-4 flex gap-3">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-20 rounded-md ml-auto" />
        </div>
      </div>
    </div>
  );
}
