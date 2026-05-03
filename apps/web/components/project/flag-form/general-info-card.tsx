'use client'

import { useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { cn } from '@/shared/utils'
import { Info } from 'lucide-react'
import { inputCls, labelCls } from './shared'
import type { FlagFormData } from './shared'

type Props = {
  initialKeyTouched?: boolean
}

export function GeneralInfoCard({ initialKeyTouched = false }: Props) {
  const { register, control, setValue } = useFormContext<FlagFormData>()
  const [keyTouched, setKeyTouched] = useState(initialKeyTouched)

  const [name, key] = useWatch({ control, name: ['name', 'key'] })

  useEffect(() => {
    if (!keyTouched) {
      const derived = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      setValue('key', derived)
    }
  }, [name, keyTouched, setValue])

  const displayKey = keyTouched
    ? key
    : name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

  return (
    <div className="border-cg-bg-100 bg-cg-white-300 col-span-1 flex flex-col rounded-xl border p-5 md:col-span-2 md:row-start-1">
      <div className="mb-4 flex items-center gap-2">
        <Info size={14} className="text-cg-neutral-300" />
        <span className="text-[13px] font-semibold text-white">General Info</span>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div>
          <label className={labelCls}>Flag name</label>
          <input
            className={inputCls}
            placeholder="e.g. Beta Dashboard Access"
            autoFocus
            {...register('name')}
          />
        </div>
        <div>
          <label className={labelCls}>Key</label>
          <input
            className={cn(inputCls, 'font-mono')}
            placeholder="beta-dashboard-access"
            value={displayKey}
            onChange={(e) => {
              setKeyTouched(true)
              setValue('key', e.target.value.toLowerCase().replace(/\s+/g, '-'))
            }}
          />
        </div>
        <div className="flex flex-1 flex-col">
          <label className={labelCls}>Description</label>
          <textarea
            className={cn(inputCls, 'flex-1 resize-none')}
            placeholder="Describe the purpose and lifecycle of this flag..."
            {...register('description')}
          />
        </div>
      </div>
    </div>
  )
}
