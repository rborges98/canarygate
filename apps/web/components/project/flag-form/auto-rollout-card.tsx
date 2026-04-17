'use client'

import { useState, useRef } from 'react'
import { useFormContext, useWatch, Controller } from 'react-hook-form'
import { cn } from '@/shared/utils'
import { TrendingUp } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { StepperInput } from '@/components/ui/stepper-input'
import { labelCls, SegmentedControl } from './shared'
import type { FlagFormData, EveryUnit } from './shared'

export function AutoRolloutCard() {
  const { control, setValue } = useFormContext<FlagFormData>()
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [
    type,
    enabled,
    increaseBy,
    everyValue,
    everyUnit,
    untilMax,
    rolloutPercent
  ] = useWatch({
    control,
    name: [
      'type',
      'autoRolloutEnabled',
      'increaseBy',
      'everyValue',
      'everyUnit',
      'untilMax',
      'rolloutPercent'
    ]
  })

  const isRolloutType = type === 'rollout'

  const handleToggleAttempt = () => {
    if (!isRolloutType) {
      setShowTooltip(true)
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
      tooltipTimer.current = setTimeout(() => setShowTooltip(false), 2500)
      return
    }
    setValue('autoRolloutEnabled', !enabled)
  }

  const everyUnitLabel = everyValue === 1 ? everyUnit.slice(0, -1) : everyUnit

  const doneIn = (() => {
    const steps = Math.max(
      1,
      Math.ceil((untilMax - rolloutPercent) / increaseBy)
    )
    const total = steps * everyValue
    return everyUnit === 'hours'
      ? `${total}h`
      : everyUnit === 'days'
        ? `${total}d`
        : `${total}w`
  })()

  return (
    <div
      className={cn(
        'col-span-1 rounded-xl border p-4 transition-all md:col-span-3 md:row-start-2',
        enabled ? 'border-cg-indigo-600 bg-cg-indigo-950' : 'border-cg-bg-100'
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggleAttempt}
        onKeyDown={(e) => e.key === 'Enter' && handleToggleAttempt()}
        className="mb-3 flex w-full cursor-pointer items-center gap-2.5 text-left"
      >
        <TrendingUp
          size={20}
          strokeWidth={enabled ? 2.5 : 1.5}
          className={enabled ? 'text-cg-indigo-200' : 'text-cg-neutral-300'}
        />
        <p
          className={cn(
            'flex-1 text-[13px] font-semibold',
            enabled ? 'text-white' : 'text-cg-neutral-300'
          )}
        >
          Auto-rollout
        </p>
        <div className="relative">
          <ToggleSwitch
            checked={enabled}
            onCheckedChange={handleToggleAttempt}
          />
          {showTooltip && (
            <div className="border-cg-bg-100 bg-cg-bg-200 text-cg-neutral-300 absolute right-0 top-9 z-10 w-max max-w-[200px] rounded-lg border px-3 py-2 font-mono text-[11px] shadow-lg">
              <span className="border-cg-bg-100 bg-cg-bg-200 absolute -top-[5px] right-3 h-2.5 w-2.5 rotate-45 border-l border-t" />
              Only active for rollout flags
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          'flex flex-col gap-3 transition-opacity',
          !enabled && 'pointer-events-none opacity-30'
        )}
      >
        <div className="flex flex-col gap-3">
          <Controller
            name="increaseBy"
            control={control}
            render={({ field }) => (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className={labelCls}>Increase by</label>
                  <span className="text-cg-neutral-100 font-mono text-[13px] font-semibold">
                    {field.value}%
                  </span>
                </div>
                <Slider
                  value={[field.value]}
                  min={1}
                  max={100}
                  onValueChange={([v]) => field.onChange(v)}
                />
              </div>
            )}
          />
          <Controller
            name="untilMax"
            control={control}
            render={({ field }) => (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className={labelCls}>Max rollout</label>
                  <span className="text-cg-neutral-100 font-mono text-[13px] font-semibold">
                    {field.value}%
                  </span>
                </div>
                <Slider
                  value={[field.value]}
                  min={1}
                  max={100}
                  onValueChange={([v]) => field.onChange(v)}
                />
              </div>
            )}
          />
        </div>

        <div>
          <label className={labelCls}>Interval</label>
          <div className="flex items-stretch gap-2">
            <div className="w-28 shrink-0">
              <Controller
                name="everyValue"
                control={control}
                render={({ field }) => (
                  <StepperInput
                    value={field.value}
                    min={1}
                    max={999}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <Controller
              name="everyUnit"
              control={control}
              render={({ field }) => (
                <SegmentedControl
                  options={[
                    { label: 'Hours', value: 'hours' as EveryUnit },
                    { label: 'Days', value: 'days' as EveryUnit },
                    { label: 'Weeks', value: 'weeks' as EveryUnit }
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>

        <p className="text-cg-neutral-300 font-mono text-[11px]">
          +{increaseBy}% every {everyValue} {everyUnitLabel} · done in {doneIn}
        </p>
      </div>
    </div>
  )
}
