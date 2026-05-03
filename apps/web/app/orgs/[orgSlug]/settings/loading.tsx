import { Skeleton } from '@/components/ui/skeleton'

export default function OrgSettingsLoading() {
  return (
    <div className="flex flex-col gap-4 px-8 py-6">
      {/* General card */}
      <div className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5">
        <Skeleton className="mb-4 h-4 w-16" />

        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 flex-shrink-0 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="mb-1.5 h-3 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        <div className="mt-3">
          <Skeleton className="mb-1.5 h-3 w-12" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        <Skeleton className="mt-4 h-8 w-16 rounded-lg" />
      </div>

      {/* Danger zone card */}
      <div className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-4 h-3 w-64" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
    </div>
  )
}
