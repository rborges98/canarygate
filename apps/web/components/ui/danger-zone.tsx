import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/utils'

const dangerZoneVariants = cva(
  'rounded-xl border border-cg-red-200 bg-[rgba(239,68,68,0.03)] p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
  {
    variants: {},
    defaultVariants: {}
  }
)

type DangerZoneProps = VariantProps<typeof dangerZoneVariants> & {
  title: string
  description: string
  actionLabel: string
  onAction?: () => void
  className?: string
}

export function DangerZone({
  title,
  description,
  actionLabel,
  onAction,
  className
}: DangerZoneProps) {
  return (
    <div className={cn(dangerZoneVariants(), className)}>
      <div>
        <h3 className="text-cg-red-100 mb-1 text-[13px] font-semibold">
          {title}
        </h3>
        <p className="text-cg-neutral-300 text-[11px]">{description}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="border-cg-red-200 bg-cg-red-300 text-cg-red-100 hover:bg-cg-red-200 w-fit shrink-0 rounded-lg border px-4 py-2 text-[12px] font-semibold transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  )
}
