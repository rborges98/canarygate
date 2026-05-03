import { Skeleton } from '@/components/ui/skeleton'

export default function HistoryLoading() {
  return (
    <div className="px-4 py-4 sm:px-8 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-cg-bg-100 bg-cg-white-300 flex items-center gap-3 rounded-lg border px-4 py-3"
          >
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3 w-64" />
              <Skeleton className="mt-1.5 h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
