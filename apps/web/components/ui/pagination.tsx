import Link from 'next/link'
import { cn } from '@/shared/utils'

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  baseHref: string
}

function buildHref(baseHref: string, targetPage: number) {
  if (targetPage <= 1) {
    return baseHref
  }
  const separator = baseHref.includes('?') ? '&' : '?'
  return `${baseHref}${separator}page=${targetPage}`
}

const buttonClasses =
  'rounded-md border px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-colors'

export function Pagination({ page, pageSize, total, baseHref }: PaginationProps) {
  if (total <= 0) {
    return null
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasPrevious = page > 1
  const hasNext = page < totalPages
  const from = Math.min((page - 1) * pageSize + 1, total)
  const to = Math.min(page * pageSize, total)

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-cg-neutral-500 font-mono text-[11px]">
        {from}-{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        {hasPrevious ? (
          <Link
            href={buildHref(baseHref, page - 1)}
            className={cn(
              buttonClasses,
              'border-cg-bg-100 text-cg-neutral-500 hover:border-cg-neutral-700 hover:text-cg-neutral-300'
            )}
          >
            Previous
          </Link>
        ) : (
          <span
            className={cn(
              buttonClasses,
              'border-cg-bg-100 text-cg-neutral-600 cursor-not-allowed opacity-50'
            )}
          >
            Previous
          </span>
        )}
        <span className="text-cg-neutral-400 px-1 font-mono text-[11px]">
          {page} / {totalPages}
        </span>
        {hasNext ? (
          <Link
            href={buildHref(baseHref, page + 1)}
            className={cn(
              buttonClasses,
              'border-cg-bg-100 text-cg-neutral-500 hover:border-cg-neutral-700 hover:text-cg-neutral-300'
            )}
          >
            Next
          </Link>
        ) : (
          <span
            className={cn(
              buttonClasses,
              'border-cg-bg-100 text-cg-neutral-600 cursor-not-allowed opacity-50'
            )}
          >
            Next
          </span>
        )}
      </div>
    </div>
  )
}

export default Pagination