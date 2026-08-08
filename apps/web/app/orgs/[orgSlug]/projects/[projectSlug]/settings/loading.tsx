import { Skeleton } from '@/components/ui/skeleton'

export default function ProjectSettingsLoading() {
  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-8">
      {/* General */}
      <div className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5">
        <Skeleton className="mb-4 h-4 w-16" />
        <div className="flex flex-col gap-3">
          <div>
            <Skeleton className="mb-1.5 h-3 w-12" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="mb-1.5 h-3 w-8" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* API Key */}
      <div className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5">
        <Skeleton className="mb-1 h-4 w-16" />
        <Skeleton className="mb-4 h-3 w-56" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-16 rounded-lg" />
            <Skeleton className="h-10 w-16 rounded-lg" />
          </div>
        </div>
        <Skeleton className="mt-3 h-3 w-28" />
      </div>

      {/* Webhook */}
      <div className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5">
        <Skeleton className="mb-1 h-4 w-20" />
        <Skeleton className="mb-4 h-3 w-52" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-16 rounded-lg" />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-cg-red-200 bg-[rgba(239,68,68,0.03)]">
          <div className="border-b border-[rgba(239,68,68,0.18)] px-5 py-4">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="divide-y divide-[rgba(239,68,68,0.14)] px-5 py-1">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center justify-between py-4">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
