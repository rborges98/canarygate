import { Skeleton } from '@/components/ui/skeleton'

export default function NewProjectLoading() {
  return (
    <div className="flex items-start justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="border-cg-bg-100 bg-cg-white-300 rounded-2xl border p-8">
          <Skeleton className="mb-1 h-6 w-36" />
          <Skeleton className="mb-7 h-3.5 w-52" />

          {/* Name */}
          <Skeleton className="mb-1.5 h-3 w-24" />
          <Skeleton className="mb-4 h-10 w-full rounded-lg" />

          {/* Slug */}
          <Skeleton className="mb-1.5 h-3 w-20" />
          <Skeleton className="mb-6 h-10 w-full rounded-lg" />

          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
