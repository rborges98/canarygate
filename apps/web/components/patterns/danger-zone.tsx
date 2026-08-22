import type { ReactNode } from 'react'
import { cn } from '@/shared/utils'

type DangerZoneProps = {
  title?: string
  children: ReactNode
  className?: string
}

export function DangerZone({
  title = 'Danger zone',
  children,
  className
}: DangerZoneProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-cg-red-200 bg-[rgba(239,68,68,0.03)]',
        className
      )}
    >
      <div className="border-b border-[rgba(239,68,68,0.18)] px-5 py-4">
        <h2 className="text-cg-red-100 text-[13px] font-semibold">{title}</h2>
      </div>
      <div className="divide-y divide-[rgba(239,68,68,0.14)] px-5 py-1">
        {children}
      </div>
    </section>
  )
}