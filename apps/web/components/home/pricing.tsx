'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { cn } from '@/shared/utils'

type PricingPlan = {
  name: string
  price: string
  period: string
  tagline: string
  features: string[]
  highlighted: boolean
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    tagline: 'For solo developers. Start today.',
    features: [
      '1 project · 50 flags per project',
      '1 member (solo)',
      'Boolean flags + Rollout %',
      '3 environments',
      '7-day audit history',
      'SSE real-time updates',
      'Community support',
    ],
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '$45',
    period: '/month',
    tagline: 'For small teams. Ship together.',
    features: [
      '10 projects · 100 flags per project',
      'Up to 10 members',
      'Boolean flags + Rollout %',
      '3 environments',
      '6-month audit history',
      'SSE real-time updates',
      'Webhooks',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    tagline: 'For teams that need full control.',
    features: [
      '50 projects · unlimited flags',
      'Up to 50 members',
      'Auto-rollout + Schedule',
      '3 environments',
      '1-year audit history + CSV',
      'SSE real-time updates',
      'Webhooks',
      'Priority support',
    ],
    highlighted: false,
  },
]

function PlanCard({ plan, index }: { plan: PricingPlan; index: number }) {
  return (
    <motion.div
      className={cn(
        'bg-cg-bg-100 border-cg-bg-100 flex flex-col gap-4 rounded-xl border p-6',
        plan.highlighted && 'ring-cg-indigo-300/50 ring-1'
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-cg-neutral-500 text-xs font-semibold tracking-widest uppercase">
          {plan.name}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-cg-neutral-100 text-3xl font-bold">
            {plan.price}
          </span>
          <span className="text-cg-neutral-500 text-sm">{plan.period}</span>
        </div>
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
    </motion.div>
  )
}

export function V2Pricing() {
  return (
    <section className="border-cg-bg-100 border-t py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex flex-col gap-3"
        >
          <h2 className="text-cg-neutral-100 text-3xl font-semibold sm:text-4xl">
            Your next deploy can be your safest one.
          </h2>
          <p className="text-cg-neutral-300 text-base">
            The price of peace of mind starts at $0. No per-seat math.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PRICING_PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>

        <motion.div
          className="border-cg-bg-100 mt-12 flex flex-col gap-4 border-t pt-8"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-cg-neutral-100 text-2xl font-bold sm:text-3xl">
            Never lose a Friday deploy again.
          </h3>
          <p className="text-cg-neutral-400 leading-relaxed">
            Start free. Your first 50 flags ship on us.
          </p>
          <Link
            href="/login"
            className="bg-cg-indigo-400 hover:bg-cg-indigo-300 inline-flex items-center self-start rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            Get started free →
          </Link>
          <p className="text-cg-neutral-500 text-sm">
            No credit card. No contracts. Your account is your email.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
