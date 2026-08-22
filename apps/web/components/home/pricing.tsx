'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ShimmerBadge } from '@/components/ui/shimmer-badge'
import { PRICING_PLANS } from './pricing-plans'
import { PricingCardHidden } from './pricing-card-hidden'

export function V2Pricing() {
  return (
    <section className="border-cg-bg-100 border-t py-16 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          className="mb-12 flex flex-col gap-3"
        >
          <h2 className="text-cg-neutral-100 text-3xl font-semibold sm:text-4xl">
            Your next deploy can be your safest one.
          </h2>
          <p className="text-cg-neutral-300 text-base">
            The price of peace of mind starts at $0. No per-seat math.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 sm:-top-5">
            <ShimmerBadge label="🚀 Early access · everything free" />
          </div>

          <div className="grid grid-cols-1 gap-4 pt-10 sm:grid-cols-3 sm:pt-0">
            {PRICING_PLANS.map((plan, i) => (
              <PricingCardHidden key={plan.name} plan={plan} index={i} />
            ))}
          </div>
        </div>

        <motion.div
          className="border-cg-bg-100 mt-12 flex flex-col gap-4 border-t pt-8"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ type: 'spring', stiffness: 80, damping: 17 }}
        >
          <h3 className="text-cg-neutral-100 text-2xl font-bold sm:text-3xl">
            Try everything. Tell us what you&apos;d pay for.
          </h3>
          <p className="text-cg-neutral-400 leading-relaxed">
            Early users help shape pricing — and get locked-in perks when we
            launch it.
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
