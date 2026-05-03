import { Skeleton } from '@/components/ui/skeleton'

export default function MembersLoading() {
  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-8 sm:py-6">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="ml-auto h-8 w-28 rounded-lg" />
      </div>

      {/* Split layout */}
      <div className="flex flex-col gap-3 md:flex-row">
        {/* Left — member list */}
        <div className="flex flex-col gap-1.5 md:basis-1/2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="border-cg-bg-100 bg-cg-white-300 flex items-center gap-3 rounded-lg border px-4 py-3"
            >
              <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-1.5 h-3 w-36" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>

        {/* Right — detail panel */}
        <div className="border-cg-bg-100 bg-cg-white-300 flex-1 rounded-xl border p-5">
          <div className="mb-5 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="mb-1.5 h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="mb-3 h-3 w-20" />
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
