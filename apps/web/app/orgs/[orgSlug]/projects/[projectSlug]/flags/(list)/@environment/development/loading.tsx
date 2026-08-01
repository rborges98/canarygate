import { Skeleton } from '@/components/ui/skeleton'

export default function FlagsLoading() {
  return (
    <div className="px-4 py-4 sm:px-8 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-14 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-8 w-full sm:ml-auto sm:w-24" />
      </div>

      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-cg-bg-100 bg-cg-white-300 grid grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-lg border px-4 py-3"
          >
            <Skeleton className="h-2 w-2 rounded-full" />
            <div>
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="mt-1.5 h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
