import { Skeleton } from '@/components/ui/skeleton'

export default function NewFlagLoading() {
  return (
    <div className="px-4 py-4 sm:px-8 sm:py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <Skeleton className="h-7 w-28" />
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-5">
        {/* GeneralInfoCard — col-span-3 */}
        <div className="border-cg-bg-100 bg-cg-white-300 col-span-3 rounded-xl border p-5">
          <Skeleton className="mb-4 h-4 w-24" />
          <Skeleton className="mb-3 h-9 w-full rounded-lg" />
          <Skeleton className="mb-3 h-9 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>

        {/* ScheduleCard — col-span-2 */}
        <div className="border-cg-bg-100 bg-cg-white-300 col-span-2 rounded-xl border p-5">
          <Skeleton className="mb-4 h-4 w-20" />
          <Skeleton className="mb-3 h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* ConfigurationCard — col-span-3 */}
        <div className="border-cg-bg-100 bg-cg-white-300 col-span-3 rounded-xl border p-5">
          <Skeleton className="mb-4 h-4 w-28" />
          <Skeleton className="mb-3 h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* AutoRolloutCard — col-span-2 */}
        <div className="border-cg-bg-100 bg-cg-white-300 col-span-2 rounded-xl border p-5">
          <Skeleton className="mb-4 h-4 w-24" />
          <Skeleton className="mb-3 h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>

      {/* EnvironmentReplicateCard */}
      <div className="border-cg-bg-100 bg-cg-white-300 mt-3.5 rounded-xl border p-5">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
