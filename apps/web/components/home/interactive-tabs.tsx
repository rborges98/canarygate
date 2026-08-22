'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useInView } from 'motion/react'
import { Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/shared/utils'

type MockupProps = {
  isInView: boolean
}

type MockFlag = {
  key: string
  description: string
  status: 'enabled' | 'disabled' | 'rollout'
  rollout?: number
}

const CONTROL_FLAGS: MockFlag[] = [
  { key: 'new-checkout', description: 'New checkout flow', status: 'enabled' },
  {
    key: 'ai-search-beta',
    description: 'AI-powered search',
    status: 'rollout',
    rollout: 25
  },
  {
    key: 'dark-mode-v2',
    description: 'Dark mode redesign',
    status: 'disabled'
  }
]

const DOT_COLOR: Record<MockFlag['status'], string> = {
  enabled: 'bg-cg-green-100 shadow-[0_0_6px_rgba(34,197,94,0.5)]',
  disabled: 'bg-cg-red-100 shadow-[0_0_5px_rgba(239,68,68,0.4)]',
  rollout: 'bg-cg-yellow-200 shadow-[0_0_6px_rgba(234,179,8,0.5)]'
}

const STATUS_BADGE_COLOR: Record<
  Exclude<MockFlag['status'], 'rollout'>,
  'green' | 'red'
> = {
  enabled: 'green',
  disabled: 'red'
}

function ControlFlag({ flag }: { flag: MockFlag }) {
  return (
    <div className="border-cg-bg-100 bg-cg-white-300 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border px-4 py-3">
      <div
        className={cn(
          'h-2 w-2 shrink-0 rounded-full',
          DOT_COLOR[flag.status],
          flag.status === 'enabled' && 'animate-pulse'
        )}
      />
      <div>
        <div className="text-white truncate font-mono text-[13px] font-semibold">
          {flag.key}
        </div>
        <div className="text-cg-neutral-300 mt-0.5 text-[11px]">
          {flag.description}
        </div>
      </div>
      {flag.status === 'rollout' && flag.rollout !== undefined ? (
        <div className="flex shrink-0 items-center gap-2">
          <div className="bg-cg-yellow-400/30 h-1 w-14 overflow-hidden rounded-full">
            <motion.div
              className="from-cg-yellow-300 to-cg-yellow-100 h-full bg-linear-to-r"
              animate={{ width: `${flag.rollout}%` }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            />
          </div>
          <span className="text-cg-yellow-200 font-mono text-[11px]">
            {flag.rollout}%
          </span>
        </div>
      ) : flag.status !== 'rollout' ? (
        <Badge color={STATUS_BADGE_COLOR[flag.status]}>{flag.status}</Badge>
      ) : null}
    </div>
  )
}

function FlagControlMockup({ isInView }: MockupProps) {
  const [flags, setFlags] = useState<MockFlag[]>(CONTROL_FLAGS)

  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      setFlags((prev) =>
        prev.map((f) => {
          if (f.key === 'dark-mode-v2') {
            return {
              ...f,
              status: f.status === 'disabled' ? 'enabled' : 'disabled'
            }
          }
          if (f.key === 'ai-search-beta') {
            const next = f.rollout === 25 ? 50 : f.rollout === 50 ? 75 : 25
            return { ...f, rollout: next }
          }
          return f
        })
      )
    }, 2000)
    return () => clearInterval(interval)
  }, [isInView])

  return (
    <div className="border-cg-bg-100 bg-cg-bg-100 overflow-hidden rounded-xl border shadow-xl">
      <div className="border-cg-bg-100 bg-cg-bg-200 flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/60" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
          <div className="h-3 w-3 rounded-full bg-green-500/60" />
        </div>
        <span className="text-cg-neutral-300 font-mono text-xs">
          Feature flags — Production
        </span>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="bg-cg-green-100 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-cg-green-100 relative inline-flex h-2 w-2 rounded-full" />
          </span>
          <span className="text-cg-green-100 font-mono text-xs">Live</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        {flags.map((flag) => (
          <ControlFlag key={flag.key} flag={flag} />
        ))}
      </div>
    </div>
  )
}

const ROLLOUT_STEPS = [5, 25, 50, 100]

function RolloutMockup({ isInView }: MockupProps) {
  const [stepIndex, setStepIndex] = useState(1)

  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % ROLLOUT_STEPS.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [isInView])

  const percent = ROLLOUT_STEPS[stepIndex]

  return (
    <div className="border-cg-bg-100 bg-cg-bg-100 overflow-hidden rounded-xl border shadow-xl">
      <div className="border-cg-bg-100 flex items-center justify-between border-b px-5 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-cg-neutral-100 font-mono text-sm font-semibold">
            payment-v2
          </span>
          <span className="text-cg-neutral-300 text-[10px]">
            New payment flow · Production
          </span>
        </div>
        <span className="text-cg-green-100 border-cg-green-200/30 bg-cg-green-300/10 rounded-full border px-2 py-0.5 font-mono text-[10px]">
          active
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 py-8">
        <AnimatePresence mode="wait">
          <motion.span
            key={percent}
            className="text-cg-indigo-200 font-mono text-7xl leading-none font-bold tracking-tight sm:text-8xl"
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {percent}%
          </motion.span>
        </AnimatePresence>
        <span className="text-cg-neutral-300 text-xs">
          ~{Math.round(percent * 28.5).toLocaleString()}K users receiving this
          feature
        </span>
      </div>

      <div className="px-5 pb-5">
        <div className="bg-cg-bg-200 h-2 overflow-hidden rounded-full">
          <motion.div
            className="bg-cg-indigo-400 h-full rounded-full"
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          />
        </div>
        <div className="relative mt-3 h-4">
          {ROLLOUT_STEPS.map((step, i) => {
            const isFirst = i === 0
            const isLast = i === ROLLOUT_STEPS.length - 1
            return (
              <span
                key={step}
                style={
                  isFirst || isLast
                    ? undefined
                    : { left: `${step}%`, transform: 'translateX(-50%)' }
                }
                className={cn(
                  'absolute top-0 font-mono text-[10px] transition-colors duration-500',
                  i <= stepIndex ? 'text-cg-indigo-300' : 'text-cg-neutral-300',
                  isFirst && 'left-0',
                  isLast && 'right-0'
                )}
              >
                {step}%
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const SCHEDULE_OFFSET_DAYS = 3

function getScheduledTarget() {
  const target = new Date()
  target.setUTCDate(target.getUTCDate() + SCHEDULE_OFFSET_DAYS)
  target.setUTCHours(9, 0, 0, 0)
  return target
}

const COUNTDOWN_UNITS = [
  { key: 'd', label: 'days' },
  { key: 'h', label: 'hours' },
  { key: 'm', label: 'min' },
  { key: 's', label: 'sec' }
] as const

function ScheduledMockup({ isInView }: MockupProps) {
  const [now, setNow] = useState(() => Date.now())
  const [target] = useState(getScheduledTarget)

  useEffect(() => {
    if (!isInView) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isInView])

  const diff = Math.max(0, target.getTime() - now)
  const remaining: Record<(typeof COUNTDOWN_UNITS)[number]['key'], number> = {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000)
  }

  const targetLabel = `${target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })} · 09:00 UTC`

  return (
    <div className="border-cg-bg-100 bg-cg-bg-100 overflow-hidden rounded-xl border shadow-xl">
      <div className="border-cg-bg-100 flex items-center justify-between border-b px-5 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-cg-neutral-100 font-mono text-sm font-semibold">
            new-pricing
          </span>
          <span className="text-cg-neutral-300 text-[10px]">
            New pricing page · Production
          </span>
        </div>
        <span className="border-cg-yellow-200/30 bg-cg-yellow-300/10 text-cg-yellow-200 rounded-full border px-2 py-0.5 font-mono text-[10px]">
          scheduled
        </span>
      </div>

      <div className="px-5 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Calendar size={13} className="text-cg-yellow-200" strokeWidth={2} />
          <span className="text-cg-neutral-300 text-[11px]">Goes live on</span>
          <span className="text-cg-neutral-200 font-mono text-[11px] font-semibold">
            {targetLabel}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {COUNTDOWN_UNITS.map((unit) => (
            <div
              key={unit.label}
              className="bg-cg-bg-200 flex flex-col items-center gap-1 rounded-lg py-3"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={remaining[unit.key]}
                  className="text-cg-indigo-200 font-mono text-2xl font-bold"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                >
                  {String(remaining[unit.key]).padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
              <span className="text-cg-neutral-300 text-[9px]">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-cg-bg-200 mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-cg-neutral-300 text-[10px]">
              Auto-enables at scheduled time
            </span>
            <span className="text-cg-neutral-300 text-[10px]">
              No deploy required · Created by Ana R.
            </span>
          </div>
          <span className="text-cg-yellow-200 text-base">⏱</span>
        </div>
      </div>
    </div>
  )
}

type LiveEvent = {
  id: number
  flag: string
  change: string
  author: string
  env: string
  ago: string
}

const INITIAL_EVENTS: LiveEvent[] = [
  {
    id: 1,
    flag: 'payment-v2',
    change: 'rollout: 50%',
    author: 'Ana R.',
    env: 'production',
    ago: '2s'
  },
  {
    id: 2,
    flag: 'ai-search-beta',
    change: 'disabled',
    author: 'Carlos M.',
    env: 'staging',
    ago: '8s'
  },
  {
    id: 3,
    flag: 'beta-pricing',
    change: 'enabled',
    author: 'Maria L.',
    env: 'production',
    ago: '15s'
  }
]

const INCOMING_EVENTS: Omit<LiveEvent, 'id' | 'ago'>[] = [
  {
    flag: 'dark-mode-v2',
    change: 'enabled',
    author: 'João S.',
    env: 'production'
  },
  {
    flag: 'new-checkout',
    change: 'rollout: 100%',
    author: 'Ana R.',
    env: 'production'
  },
  {
    flag: 'early-access',
    change: 'disabled',
    author: 'Carlos M.',
    env: 'staging'
  }
]

function RealtimeMockup({ isInView }: MockupProps) {
  const [events, setEvents] = useState<LiveEvent[]>(INITIAL_EVENTS)
  const nextIdRef = useRef(10)
  const nextEventIndexRef = useRef(0)

  useEffect(() => {
    if (!isInView) return
    const interval = setInterval(() => {
      const incoming =
        INCOMING_EVENTS[nextEventIndexRef.current % INCOMING_EVENTS.length]
      nextEventIndexRef.current++
      setEvents((prev) => [
        { ...incoming, id: nextIdRef.current++, ago: 'now' },
        ...prev.slice(0, 2)
      ])
    }, 1800)
    return () => clearInterval(interval)
  }, [isInView])

  return (
    <div className="bg-cg-bg-600 border-cg-bg-100 overflow-hidden rounded-xl border shadow-xl">
      <div className="border-cg-bg-100 flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="bg-cg-green-100 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
            <span className="bg-cg-green-100 relative inline-flex h-2 w-2 rounded-full" />
          </span>
          <span className="text-cg-neutral-300 font-mono text-[11px]">
            SSE · connected
          </span>
        </div>
        <span className="text-cg-neutral-300 font-mono text-[10px]">
          stream
        </span>
      </div>

      <div className="flex flex-col font-mono">
        <AnimatePresence initial={false}>
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              className={cn(
                'px-4 py-2.5',
                i < events.length - 1 && 'border-cg-bg-100/60 border-b'
              )}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="text-cg-indigo-300 shrink-0 text-[10px]">
                    ›
                  </span>
                  <span className="text-cg-neutral-100 text-[12px] font-semibold">
                    {event.flag}
                  </span>
                  <span className="text-cg-neutral-300 text-[11px]">
                    {event.change}
                  </span>
                </div>
                <span className="text-cg-neutral-300 shrink-0 text-[10px]">
                  {event.ago}
                </span>
              </div>
              <div className="mt-0.5 pl-4">
                <span className="text-cg-neutral-300 text-[10px]">
                  {event.author} · {event.env}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-cg-bg-100 border-t px-4 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-cg-neutral-300 font-mono text-[10px]">
            avg propagation
          </span>
          <span className="text-cg-indigo-200 font-mono text-[10px] font-semibold">
            47ms
          </span>
        </div>
      </div>
    </div>
  )
}

type AuditEntry = {
  id: number
  actorEmail: string
  actionDescription: string
  flag: string
  env: string
  time: string
  dotColor: string
  changes?: {
    kind: 'toggle' | 'rollout'
    beforeLabel: string
    afterLabel: string
  }
}

const ACTION_DOT_COLOR = {
  created: 'bg-cg-indigo-300',
  deleted: 'bg-cg-red-100',
  toggled: 'bg-cg-green-100',
  rollout_updated: 'bg-cg-yellow-200'
}

const AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 1,
    actorEmail: 'ana@team.dev',
    actionDescription: 'changed rollout of',
    flag: 'payment-v2',
    env: 'production',
    time: '2 minutes ago',
    dotColor: ACTION_DOT_COLOR.rollout_updated,
    changes: { kind: 'rollout', beforeLabel: '25%', afterLabel: '50%' }
  },
  {
    id: 2,
    actorEmail: 'carlos@team.dev',
    actionDescription: 'toggled',
    flag: 'ai-search-beta',
    env: 'staging',
    time: '18 minutes ago',
    dotColor: ACTION_DOT_COLOR.toggled,
    changes: { kind: 'toggle', beforeLabel: 'disabled', afterLabel: 'enabled' }
  },
  {
    id: 3,
    actorEmail: 'maria@team.dev',
    actionDescription: 'created',
    flag: 'beta-pricing',
    env: 'production',
    time: '1 hour ago',
    dotColor: ACTION_DOT_COLOR.created
  },
  {
    id: 4,
    actorEmail: 'joao@team.dev',
    actionDescription: 'deleted',
    flag: 'legacy-auth',
    env: 'development',
    time: 'yesterday',
    dotColor: ACTION_DOT_COLOR.deleted
  }
]

function ChangesWord({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-cg-neutral-500 font-mono text-[10px]">
      {children}
    </span>
  )
}

function TogglePill({ isEnabled }: { isEnabled: boolean }) {
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 font-mono text-[10px]',
        isEnabled ? 'text-cg-green-100' : 'text-cg-red-100'
      )}
    >
      {isEnabled ? 'enabled' : 'disabled'}
    </span>
  )
}

function RolloutPill({ value }: { value: string }) {
  return (
    <span className="text-cg-indigo-200 px-1.5 py-0.5 font-mono text-[10px]">
      {value}
    </span>
  )
}

function AuditMockup() {
  return (
    <div className="border-cg-bg-100 bg-cg-bg-100 overflow-hidden rounded-xl border shadow-xl">
      <div className="border-cg-bg-100 flex items-center justify-between border-b px-5 py-3">
        <span className="text-cg-neutral-300 text-sm font-semibold">
          History
        </span>
        <span className="text-cg-neutral-500 font-mono text-[10px]">
          128 entries
        </span>
      </div>

      <div className="flex flex-col px-5 py-2">
        {AUDIT_ENTRIES.map((entry, i) => (
          <motion.div
            key={entry.id}
            className="flex items-start gap-3 py-3"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.07 }}
          >
            <div className="mt-1.5 flex flex-col items-center">
              <span className={cn('h-2 w-2 rounded-full', entry.dotColor)} />
              {i < AUDIT_ENTRIES.length - 1 && (
                <div
                  className="bg-cg-bg-100 mt-1 w-px"
                  style={{ height: '28px' }}
                />
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-cg-neutral-200 text-[12px] font-semibold">
                  {entry.actorEmail}
                </span>
                <span className="text-cg-neutral-400 text-[11px]">
                  {entry.actionDescription}
                </span>
                <span className="text-cg-indigo-200 font-mono text-[11px] font-semibold">
                  {entry.flag}
                </span>
              </div>

              {entry.changes && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <ChangesWord>changed from</ChangesWord>
                  {entry.changes.kind === 'rollout' ? (
                    <RolloutPill value={entry.changes.beforeLabel} />
                  ) : (
                    <TogglePill
                      isEnabled={entry.changes.beforeLabel === 'enabled'}
                    />
                  )}
                  <ChangesWord>to</ChangesWord>
                  {entry.changes.kind === 'rollout' ? (
                    <RolloutPill value={entry.changes.afterLabel} />
                  ) : (
                    <TogglePill
                      isEnabled={entry.changes.afterLabel === 'enabled'}
                    />
                  )}
                </div>
              )}

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="text-cg-neutral-500 font-mono text-[10px]">
                  {entry.time}
                </span>
                <span className="text-cg-neutral-600 text-[10px]">·</span>
                <span className="text-cg-neutral-500 font-mono text-[10px]">
                  {entry.env}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

type TabItem = {
  number: string
  title: string
  description: string
  Mockup: (props: MockupProps) => React.ReactNode
}

const TABS: TabItem[] = [
  {
    number: '01',
    title: 'Flag control',
    description:
      'Create, enable, disable, or adjust any flag from the dashboard. Changes propagate in milliseconds — no deploys.',
    Mockup: FlagControlMockup
  },
  {
    number: '02',
    title: 'Gradual rollout',
    description:
      'Release to 5%, 25%, 50%, or 100% of users. Watch the numbers, increase at your own pace.',
    Mockup: RolloutMockup
  },
  {
    number: '03',
    title: 'Scheduled release',
    description:
      'Set a flag to go live automatically at a specific date and time. No manual deploys, no staying up at midnight.',
    Mockup: ScheduledMockup
  },
  {
    number: '04',
    title: 'Real-time SSE',
    description:
      'Flag changes reach every connected client in under 100ms via Server-Sent Events. No polling, no delays.',
    Mockup: RealtimeMockup
  },
  {
    number: '05',
    title: 'Audit trail',
    description:
      'Every change is logged with author, timestamp, and environment. Always know who changed what and when.',
    Mockup: AuditMockup
  }
]

export function V2InteractiveTabs() {
  const [activeTab, setActiveTab] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const inView = useInView(containerRef, { amount: 0.2 })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      const idx = Math.min(Math.floor(v * TABS.length), TABS.length - 1)
      setActiveTab(idx)
    })
    return unsubscribe
  }, [scrollYProgress])

  const ActiveMockup = TABS[activeTab].Mockup

  return (
    <div
      ref={containerRef}
      style={{ height: '350vh' }}
      className="relative hidden md:block"
    >
      <section className="border-cg-bg-100 bg-cg-bg-600 sticky top-0 h-screen overflow-hidden border-t">
        <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-4 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex flex-col gap-3"
          >
            <h2 className="text-cg-neutral-100 text-3xl font-semibold sm:text-4xl">
              Control every change in production.
            </h2>
            <p className="text-cg-neutral-300 text-base">
              From flag creation to gradual rollout to real-time audit.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-1">
              {TABS.map((tab, i) => (
                <div
                  key={tab.number}
                  className={cn(
                    'flex items-start gap-4 rounded-xl p-4 transition-colors duration-300',
                    activeTab === i ? 'bg-cg-bg-100' : ''
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 shrink-0 font-mono text-sm font-bold transition-colors duration-300',
                      activeTab === i
                        ? 'text-cg-indigo-200'
                        : 'text-cg-neutral-300'
                    )}
                  >
                    {tab.number}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-sm font-semibold transition-colors duration-300',
                        activeTab === i
                          ? 'text-cg-neutral-100'
                          : 'text-cg-neutral-300'
                      )}
                    >
                      {tab.title}
                    </p>
                    <AnimatePresence>
                      {activeTab === i && (
                        <motion.p
                          className="text-cg-neutral-300 mt-1 text-sm leading-relaxed"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          {tab.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="bg-cg-indigo-800/20 pointer-events-none absolute inset-0 -z-10 rounded-2xl blur-3xl" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <ActiveMockup isInView={inView} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
