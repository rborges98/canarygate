import { Nav } from '@/components/nav'
import { Skeleton } from '@/components/ui/skeleton'

export default function OrgsLoading() {
  return (
    <div className="bg-cg-bg-400 relative min-h-screen">
      <Nav />

      <div className="relative z-10 px-4 py-5 sm:px-8 sm:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-1.5 h-3.5 w-24" />
          </div>
          <Skeleton className="h-8 w-full sm:w-36" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border-cg-bg-100 bg-cg-white-200 rounded-xl border p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="mt-1.5 h-3 w-16" />
                </div>
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
