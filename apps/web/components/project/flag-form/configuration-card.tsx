'use client'

import { useFormContext, useWatch, Controller } from 'react-hook-form'
import { cn } from '@/shared/utils'
import { ToggleLeft, BarChart2, Rocket, SlidersHorizontal } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import type { FlagFormData, FlagType } from './shared'

export function ConfigurationCard() {
  const { control, setValue } = useFormContext<FlagFormData>()
  const [type, defaultEnabled, rolloutPercent] = useWatch({
    control,
    name: ['type', 'defaultEnabled', 'rolloutPercent']
  })
  const falsePercent = 100 - rolloutPercent

  const handleTypeChange = (v: FlagType) => {
    setValue('type', v)
    if (v !== 'rollout') {
      setValue('autoRolloutEnabled', false)
    }
  }

  return (
    <div className="border-cg-bg-100 bg-cg-white-300 col-span-1 rounded-xl border p-5 md:col-span-3 md:row-start-1">
      <div className="mb-4 flex items-center gap-2">
        <SlidersHorizontal size={14} className="text-cg-neutral-300" />
        <span className="text-[13px] font-semibold text-white">
          Configuration
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        {(
          [
            {
              value: 'boolean' as FlagType,
              Icon: ToggleLeft,
              label: 'Boolean',
              desc: 'Simple ON/OFF switch for features. Best for rapid deployments.'
            },
            {
              value: 'rollout' as FlagType,
              Icon: BarChart2,
              label: 'Rollout',
              desc: 'Percentage-based gradual release. Ideal for controlled rollouts.'
            }
          ] as const
        ).map(({ value, Icon, label, desc }) => {
          const active = type === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleTypeChange(value)}
              className={cn(
                'flex flex-col gap-2.5 rounded-xl border p-4 text-left transition-all',
                active
                  ? 'border-cg-indigo-600 bg-cg-indigo-950'
                  : 'border-cg-bg-100 hover:border-cg-neutral-700'
              )}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.5}
                className={
                  active ? 'text-cg-indigo-200' : 'text-cg-neutral-300'
                }
              />
              <div>
                <p
                  className={cn(
                    'mb-0.5 text-[13px] font-semibold',
                    active ? 'text-white' : 'text-cg-neutral-300'
                  )}
                >
                  {label}
                </p>
                <p className="text-cg-neutral-300 font-sans text-[11px] leading-relaxed">
                  {desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Boolean / Rollout overlay — no layout shift */}
      <div className="grid">
        <div
          className={cn(
            'col-start-1 row-start-1 h-full transition-opacity duration-150',
            type !== 'boolean' && 'pointer-events-none opacity-0'
          )}
        >
          <div className="border-cg-bg-100 relative flex h-full flex-col overflow-hidden rounded-xl border px-4 py-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ToggleLeft
                  size={13}
                  strokeWidth={defaultEnabled ? 2.5 : 1.5}
                  className={cn(
                    'transition-colors',
                    defaultEnabled ? 'text-cg-green-100' : 'text-cg-neutral-300'
                  )}
                />
                <span className="text-[12px] font-semibold text-white">
                  Default State
                </span>
              </div>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span
                className={cn(
                  'text-[36px] leading-none font-extrabold tracking-tight transition-colors',
                  defaultEnabled ? 'text-cg-green-100' : 'text-cg-red-100'
                )}
              >
                {defaultEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
              <Controller
                name="defaultEnabled"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch
                    checked={field.value}
                    size="lg"
                    onCheckedChange={() => field.onChange(!field.value)}
                  />
                )}
              />
            </div>
            <div>
              <div className="bg-cg-white-100 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    defaultEnabled ? 'bg-cg-green-100' : 'bg-cg-red-100'
                  )}
                  style={{ width: defaultEnabled ? '100%' : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'col-start-1 row-start-1 h-full transition-opacity duration-150',
            type !== 'rollout' && 'pointer-events-none opacity-0'
          )}
        >
          <div className="border-cg-bg-100 relative flex h-full flex-col overflow-hidden rounded-xl border px-4 py-3.5">
            <div className="mb-3 flex items-center gap-2">
              <Rocket size={13} className="text-cg-indigo-200" />
              <span className="text-[12px] font-semibold text-white">
                Rollout Strategy
              </span>
            </div>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-cg-indigo-200 text-[36px] leading-none font-extrabold tracking-tight">
                {rolloutPercent}%
              </span>
              <span className="text-cg-red-100 font-mono text-[10px]">
                {falsePercent}% disabled
              </span>
            </div>
            <Controller
              name="rolloutPercent"
              control={control}
              render={({ field }) => (
                <Slider
                  value={[field.value]}
                  min={0}
                  max={100}
                  onValueChange={([v]) => field.onChange(v)}
                  className="mb-2 w-full"
                />
              )}
            />
            <div className="flex justify-between">
              <span className="text-cg-neutral-300 font-mono text-[10px]">
                0%
              </span>
              <span className="text-cg-neutral-300 font-mono text-[10px]">
                100%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
