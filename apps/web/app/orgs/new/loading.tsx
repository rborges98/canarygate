import { Nav } from '@/components/nav'
import { Skeleton } from '@/components/ui/skeleton'

export default function NewOrgLoading() {
  return (
    <div className="bg-cg-bg-400 relative flex min-h-screen flex-col overflow-hidden">
      <Nav />

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="border-cg-bg-100 bg-cg-white-300 rounded-2xl border p-8">
            <Skeleton className="mb-1 h-6 w-44" />
            <Skeleton className="mb-7 h-3.5 w-56" />

            <div className="mb-6 flex justify-center">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>

            <Skeleton className="mb-1.5 h-3 w-32" />
            <Skeleton className="mb-4 h-10 w-full rounded-lg" />

            <Skeleton className="mb-1.5 h-3 w-24" />
            <Skeleton className="mb-6 h-10 w-full rounded-lg" />

            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
