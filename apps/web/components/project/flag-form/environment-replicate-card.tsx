'use client'

import { useFormContext, useWatch, Controller } from 'react-hook-form'
import { cn } from '@/shared/utils'
import { Layers, Check } from 'lucide-react'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import type { FlagFormData } from './shared'
import { ENVIRONMENTS } from '@/shared/environments'

const ENV_COLORS: Record<string, { dot: string; check: string }> = {
  production: {
    dot: 'bg-cg-red-100',
    check: 'text-cg-red-100'
  },
  staging: {
    dot: 'bg-cg-yellow-200',
    check: 'text-cg-yellow-200'
  },
  development: {
    dot: 'bg-cg-indigo-300',
    check: 'text-cg-indigo-300'
  }
}
const DEFAULT_ENV_COLORS = {
  dot: 'bg-cg-neutral-400',
  check: 'text-cg-neutral-400'
}

export function EnvironmentReplicateCard() {
  const { control, setValue } = useFormContext<FlagFormData>()
  const [replicateToAll, environmentSlugs] = useWatch({
    control,
    name: ['replicateToAll', 'environmentSlugs']
  })

  const toggleEnv = (slug: string) => {
    const current = environmentSlugs ?? []
    if (current.includes(slug)) {
      setValue(
        'environmentSlugs',
        current.filter((s) => s !== slug)
      )
    } else {
      setValue('environmentSlugs', [...current, slug])
    }
  }

  return (
    <div className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-cg-neutral-300" />
          <span className="text-[13px] font-semibold text-white">
            Environments
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cg-neutral-400 font-sans text-[11px]">
            Replicate to all
          </span>
          <Controller
            control={control}
            name="replicateToAll"
            render={({ field }) => (
              <ToggleSwitch
                checked={field.value}
                onCheckedChange={() => field.onChange(!field.value)}
              />
            )}
          />
        </div>
      </div>

      {replicateToAll ? (
        <div className="flex flex-wrap gap-2">
          {ENVIRONMENTS.map((env) => {
            const colors = ENV_COLORS[env.slug] ?? DEFAULT_ENV_COLORS
            return (
              <div
                key={env.slug}
                className="border-cg-bg-100 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] text-white opacity-60"
              >
                <div className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
                {env.slug}
                <Check size={13} className={cn('ml-0.5', colors.check)} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ENVIRONMENTS.map((env) => {
            const colors = ENV_COLORS[env.slug] ?? DEFAULT_ENV_COLORS
            const selected = (environmentSlugs ?? []).includes(env.slug)
            return (
              <button
                key={env.slug}
                type="button"
                onClick={() => toggleEnv(env.slug)}
                className={cn(
                  'border-cg-bg-100 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-all',
                  selected
                    ? 'text-white'
                    : 'text-cg-neutral-400 hover:text-cg-neutral-200'
                )}
              >
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    colors.dot,
                    !selected && 'opacity-30'
                  )}
                />
                {env.slug}
                {selected && (
                  <Check size={13} className={cn('ml-0.5', colors.check)} />
                )}
              </button>
            )
          })}
        </div>
      )}

      {!replicateToAll && (environmentSlugs ?? []).length === 0 && (
        <p className="text-cg-red-100 mt-2 font-sans text-[11px]">
          Select at least one environment
        </p>
      )}
    </div>
  )
}
