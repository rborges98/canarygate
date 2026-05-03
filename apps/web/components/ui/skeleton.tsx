import { cn } from '@/shared/utils'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('bg-cg-white-100 animate-pulse rounded-md', className)}
    />
  )
}
