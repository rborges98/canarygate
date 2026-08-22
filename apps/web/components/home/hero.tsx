'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { MotionProps, TargetAndTransition, Transition } from 'motion/react'
import Link from 'next/link'

const FEATURE_PILLS = [
  'Gradual rollout',
  'Scheduled rollout',
  'Instant rollback',
  'Real-time SSE',
  'Open source'
]

const SPRING_GENTLE: Transition = { type: 'spring', stiffness: 65, damping: 18 }
const SPRING_SOFT: Transition = { type: 'spring', stiffness: 80, damping: 16 }
const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 105, damping: 15 }

const ENTRANCE_DELAYS = {
  badge: 0.25,
  headlineFirstLine: 0.4,
  headlineSecondLine: 0.54,
  subtitle: 0.68,
  ctas: 0.82,
  passwordlessHint: 0.9,
  pills: 0.96
} as const

const PILL_STAGGER = 0.06
const REDUCED_MOTION_FADE_DURATION = 0.35

type EntranceConfig = {
  delay: number
  y: number
  scale: number
  blur: number
  spring?: Transition
}

type EntranceMotionProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'transition'
>

function getEntranceProps(
  prefersReducedMotion: boolean,
  { delay, y, scale, blur, spring = SPRING_SOFT }: EntranceConfig
): EntranceMotionProps {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: REDUCED_MOTION_FADE_DURATION, delay }
    }
  }

  const hidden: TargetAndTransition = {
    opacity: 0,
    y,
    scale,
    filter: `blur(${blur}px)`
  }
  const shown: TargetAndTransition = {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)'
  }

  return { initial: hidden, animate: shown, transition: { ...spring, delay } }
}

export function V2Hero() {
  const prefersReducedMotion = useReducedMotion()
  const reduced = Boolean(prefersReducedMotion)

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
        <div className="flex flex-col items-center gap-6 sm:gap-8">
          <motion.div
            {...getEntranceProps(reduced, {
              delay: ENTRANCE_DELAYS.badge,
              y: -12,
              scale: 1,
              blur: 6,
              spring: SPRING_SNAPPY
            })}
          >
            <span className="border-cg-indigo-600/50 bg-cg-indigo-950/50 text-cg-indigo-200 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] sm:text-xs">
              <span className="bg-cg-green-100 h-1.5 w-1.5 animate-pulse rounded-full" />
              Open source feature flags
            </span>
          </motion.div>

          <h1 className="text-3xl leading-[1.15] font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <motion.span
              className="text-cg-neutral-100 inline-block whitespace-nowrap"
              {...getEntranceProps(reduced, {
                delay: ENTRANCE_DELAYS.headlineFirstLine,
                y: 40,
                scale: 0.97,
                blur: 10,
                spring: SPRING_GENTLE
              })}
            >
              Deploy on Friday.
            </motion.span>
            <br />
            <motion.span
              className="text-cg-indigo-300 inline-block whitespace-nowrap"
              {...getEntranceProps(reduced, {
                delay: ENTRANCE_DELAYS.headlineSecondLine,
                y: 40,
                scale: 0.97,
                blur: 10,
                spring: SPRING_GENTLE
              })}
            >
              Sleep on Saturday.
            </motion.span>
          </h1>

          <motion.p
            className="text-cg-neutral-400 max-w-xl text-[13px] leading-relaxed sm:text-base"
            {...getEntranceProps(reduced, {
              delay: ENTRANCE_DELAYS.subtitle,
              y: 28,
              scale: 0.99,
              blur: 8
            })}
          >
            Feature flags that just work. Create, toggle, and roll out — no
            YAML, no complexity.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-3"
            {...getEntranceProps(reduced, {
              delay: ENTRANCE_DELAYS.ctas,
              y: 24,
              scale: 0.96,
              blur: 6,
              spring: SPRING_SNAPPY
            })}
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

          <motion.p
            className="text-cg-neutral-500 text-sm"
            {...getEntranceProps(reduced, {
              delay: ENTRANCE_DELAYS.passwordlessHint,
              y: 16,
              scale: 0.98,
              blur: 4
            })}
          >
            No passwords. Sign up and log in with just your email.
          </motion.p>

          <div className="flex flex-wrap justify-center gap-2">
            {FEATURE_PILLS.map((pill, index) => (
              <motion.span
                key={pill}
                className="border-cg-bg-100 text-cg-neutral-500 rounded-full border px-3 py-1 text-xs"
                {...getEntranceProps(reduced, {
                  delay: ENTRANCE_DELAYS.pills + index * PILL_STAGGER,
                  y: 16,
                  scale: 0.98,
                  blur: 4,
                  spring: SPRING_SNAPPY
                })}
              >
                {pill}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
