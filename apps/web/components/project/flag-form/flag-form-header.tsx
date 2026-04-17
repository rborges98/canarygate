'use client'

import Link from 'next/link'
import { useFormContext, useWatch } from 'react-hook-form'
import type { FlagFormData } from './shared'

type FlagFormHeaderProps = {
  mode: 'new' | 'edit'
  backHref: string
}

export function FlagFormHeader({ mode, backHref }: FlagFormHeaderProps) {
  const { control } = useFormContext<FlagFormData>()
  const key = useWatch({ control, name: 'key' })

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-[22px] font-bold text-white">
          {mode === 'new' ? 'New Flag' : 'Edit Flag'}
        </h1>
        {mode === 'edit' && (
          <p className="text-cg-neutral-300 mt-1 font-mono text-[11px]">
            ID: {key}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <Link
          href={backHref}
          className="border-cg-bg-100 hover:border-cg-neutral-500 text-cg-neutral-300 hover:text-cg-neutral-200 rounded-lg border px-4 py-2 text-[13px] font-medium transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="bg-cg-indigo-300 hover:bg-cg-indigo-400 rounded-lg px-5 py-2 text-[13px] font-semibold text-white transition-colors"
        >
          {mode === 'new' ? 'Create Flag' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
