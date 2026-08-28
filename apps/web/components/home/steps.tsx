'use client'

import { motion } from 'motion/react'

type Step = {
  number: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Install the SDK',
    description:
      'Frameworkless by design. Official SDKs for JavaScript and Go — more on the way. Works with any stack.'
  },
  {
    number: '02',
    title: 'Create your flags',
    description:
      'Define flags in the dashboard. Set rollout percentages, environments, and schedules.',
  },
  {
    number: '03',
    title: 'Control in real-time',
    description:
      'Toggle, rollback, or adjust rollout live. No deploy needed. Changes propagate in milliseconds.',
  },
]

type StepCardProps = {
  step: Step
  index: number
  isLast: boolean
}

function StepCard({ step, index, isLast }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 75, damping: 17, delay: index * 0.12 }}
      className="relative flex flex-col gap-4"
    >
      {!isLast && (
        <div className="from-cg-bg-100 absolute top-9 left-full hidden h-px w-full -translate-y-1/2 bg-linear-to-r to-transparent md:block" />
      )}

      <span
        aria-hidden
        className="text-cg-indigo-300 select-none font-mono text-7xl leading-none font-bold"
      >
        {step.number}
      </span>

      <div className="flex flex-col gap-2">
        <h3 className="text-cg-neutral-100 text-base font-semibold">
          {step.title}
        </h3>
        <p className="text-cg-neutral-300 text-sm leading-relaxed">
          {step.description}
        </p>
      </div>
    </motion.div>
  )
}

export function V2Steps() {
  return (
    <section
      id="how-it-works"
      className="border-cg-bg-100 border-t py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          className="mb-12 flex flex-col gap-3"
        >
          <h2 className="text-cg-neutral-100 text-3xl font-semibold sm:text-4xl">
            Up and running in minutes.
          </h2>
          <p className="text-cg-neutral-300 text-base">
            No complex setup. No vendor lock-in.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <StepCard
              key={step.number}
              step={step}
              index={i}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
