'use client'

import { motion } from 'motion/react'
import Link from 'next/link'

const FEATURE_PILLS = [
  'Gradual rollout',
  'Scheduled rollout',
  'Instant rollback',
  'Real-time SSE',
  'Open source'
]

export function V2Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-5rem)] items-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-8">
        <div className="flex flex-col items-center gap-8">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span className="border-cg-indigo-600/50 bg-cg-indigo-950/50 text-cg-indigo-200 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs">
              <span className="bg-cg-green-100 h-1.5 w-1.5 animate-pulse rounded-full" />
              Open source feature flags
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl leading-[1.1] font-bold tracking-tight sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="text-cg-neutral-100">Deploy on Friday.</span>
            <br />
            <span className="text-cg-indigo-300 whitespace-nowrap">
              Sleep on Saturday.
            </span>
          </motion.h1>

          <motion.p
            className="text-cg-neutral-400 max-w-xl text-base leading-relaxed sm:text-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Feature flags that just work. Create, toggle, and roll out — no
            YAML, no complexity.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/login"
              className="bg-cg-indigo-400 hover:bg-cg-indigo-300 inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors"
            >
              Start free →
            </Link>
            <Link
              href="/docs"
              className="border-cg-bg-100 text-cg-neutral-300 hover:text-cg-neutral-100 inline-flex items-center rounded-lg border px-6 py-3 text-sm font-semibold transition-colors"
            >
              View docs
            </Link>
          </motion.div>

          <motion.div
            className="flex flex-wrap justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {FEATURE_PILLS.map((pill) => (
              <span
                key={pill}
                className="border-cg-bg-100 text-cg-neutral-500 rounded-full border px-3 py-1 text-xs"
              >
                {pill}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
