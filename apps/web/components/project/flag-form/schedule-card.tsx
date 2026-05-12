'use client'

import { useEffect, useState } from 'react'
import { useFormContext, useWatch, Controller } from 'react-hook-form'
import { cn } from '@/shared/utils'
import { Calendar } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { Modal } from '@/components/ui/modal'
import { labelCls } from './shared'
import type { FlagFormData, ScheduleAction } from './shared'

type Props = {
  initialScheduleEnabled?: boolean
  initialScheduleDate?: string
}

export function ScheduleCard({
  initialScheduleEnabled,
  initialScheduleDate
}: Props) {
  const { control, register, setValue } = useFormContext<FlagFormData>()
  const [type, scheduleEnabled, scheduleAction] = useWatch({
    control,
    name: ['type', 'scheduleEnabled', 'scheduleAction']
  })
  const isRolloutType = type === 'rollout'
  const [showCancelModal, setShowCancelModal] = useState(false)

  const isScheduledInFuture =
    !!initialScheduleEnabled &&
    !!initialScheduleDate &&
    new Date(initialScheduleDate) > new Date()

  useEffect(() => {
    if (isRolloutType && scheduleAction !== 'rollout') {
      setValue('scheduleAction', 'rollout')
      return
    }

    if (!isRolloutType && scheduleAction === 'rollout') {
      setValue('scheduleAction', 'enable')
    }
  }, [isRolloutType, scheduleAction, setValue])

  function handleToggle(currentValue: boolean, onChange: (v: boolean) => void) {
    if (currentValue && isScheduledInFuture) {
      setShowCancelModal(true)
      return
    }
    onChange(!currentValue)
  }

  function confirmCancel(onChange: (v: boolean) => void) {
    setShowCancelModal(false)
    onChange(false)
  }

  return (
    <>
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
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleToggle(field.value, field.onChange)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleToggle(field.value, field.onChange)
                }
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
                  onCheckedChange={() =>
                    handleToggle(field.value, field.onChange)
                  }
                />
              </div>
              <Modal
                open={showCancelModal}
                onClose={() => setShowCancelModal(false)}
              >
                <div className="p-5">
                  <p className="text-cg-neutral-300 mb-1 font-sans text-[10px] tracking-wider uppercase">
                    Schedule
                  </p>
                  <h2 className="mb-2 text-[15px] font-semibold text-white">
                    Cancel scheduled action?
                  </h2>
                  <p className="text-cg-neutral-300 mb-5 text-[13px] leading-relaxed">
                    This flag has a pending schedule that hasn't fired yet.
                    Disabling it will cancel the scheduled action.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(false)}
                      className="border-cg-bg-100 text-cg-neutral-300 hover:text-cg-neutral-100 flex-1 rounded-lg border px-4 py-2.5 text-[13px] transition-colors"
                    >
                      Keep schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmCancel(field.onChange)}
                      className="bg-cg-red-300 border-cg-red-200 text-cg-red-100 flex-1 rounded-lg border px-4 py-2.5 text-[13px] font-semibold transition-colors"
                    >
                      Cancel schedule
                    </button>
                  </div>
                </div>
              </Modal>
            </>
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
              className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-100 focus:border-cg-indigo-300 w-full rounded-lg border px-3.5 py-2.5 font-mono text-[13px] transition-colors outline-none"
              {...register('scheduleDate')}
            />
          </div>

          {!isRolloutType && (
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
          )}

          <div
            className={cn(
              'transition-opacity',
              !isRolloutType &&
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
    </>
  )
}
