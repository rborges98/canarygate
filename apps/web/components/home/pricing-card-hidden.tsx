import { PricingCard } from './pricing-card'
import type { PricingPlan } from './pricing-plans'

type PricingCardHiddenProps = {
  plan: PricingPlan
  index: number
}

export function PricingCardHidden({ plan, index }: PricingCardHiddenProps) {
  return (
    <div className="relative h-full">
      <PricingCard
        plan={plan}
        index={index}
        className="h-full"
        contentClassName="pointer-events-none blur-[7px] opacity-60 select-none"
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
        <span className="border-cg-yellow-200/40 bg-cg-yellow-400/90 text-cg-bg-500 rounded-full border px-4 py-1.5 font-mono text-xs font-bold tracking-wide uppercase shadow-lg shadow-black/20">
          Free
        </span>
        <span className="text-cg-neutral-400 text-[11px]">
          Pricing hidden during Early Access
        </span>
      </div>
    </div>
  )
}

export default PricingCardHidden
