'use client'

import { motion } from 'motion/react'
import { cn } from '@/shared/utils'
import type { PricingPlan } from './pricing-plans'

type PricingCardProps = {
  plan: PricingPlan
  index: number
  className?: string
  contentClassName?: string
  priceSlot?: React.ReactNode
}

export function PricingCard({
  plan,
  index,
  className,
  contentClassName,
  priceSlot
}: PricingCardProps) {
  return (
    <motion.div
      className={cn(
        'bg-cg-bg-100 border-cg-bg-100 relative flex flex-col gap-4 rounded-xl border p-6',
        plan.highlighted && 'ring-cg-indigo-300/50 ring-1',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
    >
      <div className={cn('flex flex-col gap-4', contentClassName)}>
        <div className="flex flex-col gap-1">
          <span className="text-cg-neutral-500 text-xs font-semibold tracking-widest uppercase">
            {plan.name}
          </span>
          {priceSlot ?? (
            <div className="flex items-baseline gap-1">
              <span className="text-cg-neutral-100 text-3xl font-bold">
                {plan.price}
              </span>
              <span className="text-cg-neutral-500 text-sm">{plan.period}</span>
            </div>
          )}
          <p className="text-cg-neutral-400 mt-1 text-xs">{plan.tagline}</p>
        </div>

        <ul className="border-cg-bg-100 flex flex-col gap-2 border-t pt-3">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="text-cg-neutral-300 flex items-start gap-2 text-sm"
            >
              <span className="text-cg-green-100 mt-0.5 shrink-0 text-xs">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

export default PricingCard
