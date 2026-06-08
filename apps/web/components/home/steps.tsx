'use client'

import { motion } from 'motion/react'

type Step = {
  number: string
  title: string
  description: string
  code?: string
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Install the SDK',
    description:
      'Works with any JavaScript or TypeScript project. One package, no peer dependencies.',
    code: 'npm install @canarygate/sdk',
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

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="border-cg-bg-100 bg-cg-bg-100 mt-4 overflow-hidden rounded-lg border">
      <div className="border-cg-bg-100 bg-cg-bg-200 flex items-center gap-1.5 border-b px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-red-500/60" />
        <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
        <div className="h-2 w-2 rounded-full bg-green-500/60" />
        <span className="text-cg-neutral-600 ml-2 font-mono text-[10px]">
          terminal
        </span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-cg-neutral-600 font-mono text-xs">$</span>
          <span className="text-cg-neutral-200 font-mono text-xs">{code}</span>
        </div>
      </div>
    </div>
  )
}

type StepCardProps = {
  step: Step
  index: number
  isLast: boolean
}

function StepCard({ step, index, isLast }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
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
        {step.code && <CodeBlock code={step.code} />}
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
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
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
