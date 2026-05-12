// Shared types, interfaces and style constants used across flag-form sub-components
import { cn } from '@/shared/utils'

export type FlagType = 'boolean' | 'rollout'
export type EveryUnit = 'hours' | 'days' | 'weeks'
export type ScheduleAction = 'enable' | 'disable' | 'rollout'

export type FlagFormData = {
  name: string
  key: string
  description: string
  type: FlagType
  defaultEnabled: boolean
  rolloutPercent: number
  replicateToAll: boolean
  environmentSlugs: string[]
  scheduleEnabled: boolean
  scheduleDate: string
  scheduleAction: ScheduleAction
  autoRolloutEnabled: boolean
  increaseBy: number
  everyValue: number
  everyUnit: EveryUnit
  untilMax: number
  autoRolloutNextAt: string
  scheduleRolloutPercent: number
}

export type FlagFormProps = {
  mode: 'new' | 'edit'
  orgId: string
  projectId: string
  orgSlug: string
  projectSlug: string
  environmentSlug?: string
  flagId?: string
  initialData?: Partial<FlagFormData>
}

export const inputCls =
  'border-cg-bg-100 bg-cg-white-200 text-cg-neutral-100 placeholder:text-cg-neutral-300 focus:border-cg-indigo-300 w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none transition-colors'

export const labelCls =
  'text-cg-neutral-300 mb-1.5 block font-sans text-[10px] uppercase tracking-wider'

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-cg-indigo-300 mb-4 font-sans text-[10px] tracking-widest uppercase">
      {children}
    </p>
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="border-cg-bg-100 bg-cg-white-200 flex w-full gap-0.5 overflow-hidden rounded-lg border p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 rounded-md px-3 py-2 font-sans text-[12px] transition-colors',
            value === opt.value
              ? 'bg-cg-indigo-300 text-white'
              : 'text-cg-neutral-300 hover:text-cg-neutral-100'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
