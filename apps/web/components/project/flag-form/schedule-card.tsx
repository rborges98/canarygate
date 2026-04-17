'use client'

import { useFormContext, useWatch, Controller } from 'react-hook-form'
import { cn } from '@/shared/utils'
import { Calendar } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { labelCls } from './shared'
import type { FlagFormData, ScheduleAction } from './shared'

export function ScheduleCard() {
  const { control, register } = useFormContext<FlagFormData>()
  const [scheduleEnabled, scheduleAction] = useWatch({
    control,
    name: ['scheduleEnabled', 'scheduleAction']
  })

  return (
    <div
      className={cn(
        'col-span-1 rounded-xl border p-4 transition-all md:col-span-2 md:row-start-2',
        scheduleEnabled
          ? 'border-cg-indigo-600 bg-cg-indigo-950'
          : 'border-cg-bg-100'
      )}
    >
      <Controller
        name="scheduleEnabled"
        control={control}
        render={({ field }) => (
          <div
            role="button"
            tabIndex={0}
            onClick={() => field.onChange(!field.value)}
            onKeyDown={(e) => e.key === 'Enter' && field.onChange(!field.value)}
            className="mb-3 flex w-full cursor-pointer items-center gap-2.5 text-left"
          >
            <Calendar
              size={20}
              strokeWidth={field.value ? 2.5 : 1.5}
              className={
                field.value ? 'text-cg-indigo-200' : 'text-cg-neutral-300'
              }
            />
            <p
              className={cn(
                'flex-1 text-[13px] font-semibold',
                field.value ? 'text-white' : 'text-cg-neutral-300'
              )}
            >
              Schedule
            </p>
            <ToggleSwitch
              checked={field.value}
              onCheckedChange={() => field.onChange(!field.value)}
            />
          </div>
        )}
      />

      <div
        className={cn(
          'flex flex-col gap-3 transition-opacity',
          !scheduleEnabled && 'pointer-events-none opacity-30'
        )}
      >
        <div>
          <label className={labelCls}>Date &amp; time</label>
          <input
            type="datetime-local"
            className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-100 focus:border-cg-indigo-300 w-full rounded-lg border px-3.5 py-2.5 font-mono text-[13px] outline-none transition-colors"
            {...register('scheduleDate')}
          />
        </div>

        <div>
          <label className={labelCls}>Action</label>
          <Controller
            name="scheduleAction"
            control={control}
            render={({ field }) => (
              <div className="border-cg-bg-100 bg-cg-white-200 flex w-full gap-0.5 overflow-hidden rounded-lg border p-0.5">
                {(
                  [
                    {
                      value: 'enable' as ScheduleAction,
                      label: 'Enabled',
                      active:
                        'bg-cg-green-300 text-cg-green-100 border border-cg-green-200'
                    },
                    {
                      value: 'disable' as ScheduleAction,
                      label: 'Disabled',
                      active:
                        'bg-cg-red-300 text-cg-red-100 border border-cg-red-200'
                    },
                    {
                      value: 'rollout' as ScheduleAction,
                      label: 'Rollout',
                      active:
                        'bg-cg-yellow-400 text-cg-yellow-200 border border-[rgba(234,179,8,0.22)]'
                    }
                  ] as const
                ).map(({ value, label, active }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={cn(
                      'flex-1 rounded-md px-3 py-2 font-mono text-[12px] transition-colors',
                      field.value === value
                        ? active
                        : 'text-cg-neutral-300 hover:text-cg-neutral-100'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div
          className={cn(
            'transition-opacity',
            scheduleAction !== 'rollout' &&
              'pointer-events-none h-0 overflow-hidden opacity-0'
          )}
        >
          <Controller
            name="scheduleRolloutPercent"
            control={control}
            render={({ field }) => (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <label className={labelCls}>Rollout %</label>
                  <span className="text-cg-neutral-100 font-mono text-[13px] font-semibold">
                    {field.value}%
                  </span>
                </div>
                <Slider
                  value={[field.value]}
                  min={0}
                  max={100}
                  onValueChange={([v]) => field.onChange(v)}
                />
              </>
            )}
          />
        </div>
      </div>
    </div>
  )
}
