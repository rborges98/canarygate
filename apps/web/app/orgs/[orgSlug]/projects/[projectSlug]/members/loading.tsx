import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectMembersLoading() {
  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-8 sm:py-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-md" />
          ))}
        </div>
        <Skeleton className="ml-auto h-8 w-32 rounded-lg" />
      </div>

      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-cg-bg-100 bg-cg-white-300 flex items-center gap-3 rounded-lg border px-4 py-3"
          >
            <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1.5 h-3 w-40" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
