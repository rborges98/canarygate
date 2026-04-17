'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { cn } from '@/shared/utils'
import type { FlagItem } from '@/server/flags/queries'

type FilterTab = 'all' | 'enabled' | 'disabled' | 'rollout'

const dotColor: Record<FlagItem['status'], string> = {
  enabled: 'bg-cg-green-100 shadow-[0_0_6px_rgba(34,197,94,0.5)]',
  disabled: 'bg-cg-red-100 shadow-[0_0_5px_rgba(239,68,68,0.4)]',
  rollout: 'bg-cg-yellow-200 shadow-[0_0_6px_rgba(234,179,8,0.5)]'
}

type Props = {
  flags: FlagItem[]
  orgSlug: string
  projectSlug: string
}

export function FlagsList({ flags, orgSlug, projectSlug }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')

  const filtered = flags.filter((f) => {
    const matchesSearch =
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase())

    const matchesFilter = filter === 'all' || f.status === filter

    return matchesSearch && matchesFilter
  })

  return (
    <div className="px-4 py-4 sm:px-8 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search flags..."
        />

        <div className="flex gap-1.5">
          {(['all', 'enabled', 'disabled', 'rollout'] as FilterTab[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  'rounded-md border px-3 py-1.5 font-mono text-[11px] font-medium transition-colors',
                  filter === tab
                    ? 'border-cg-indigo-600 bg-cg-indigo-950 text-cg-indigo-100'
                    : 'border-cg-bg-100 text-cg-neutral-500 hover:text-cg-neutral-300'
                )}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <Link
          href={`/orgs/${orgSlug}/projects/${projectSlug}/flags/new`}
          className="bg-cg-indigo-300 hover:bg-cg-indigo-400 w-full rounded-lg px-4 py-2 text-center text-[12px] font-semibold text-white transition-colors sm:ml-auto sm:w-fit"
        >
          + New flag
        </Link>
      </div>

      <div className="flex flex-col gap-1.5">
        {filtered.map((flag) => (
          <Link
            key={flag.key}
            href={`/orgs/${orgSlug}/projects/${projectSlug}/flags/${flag.flagId}`}
            className="border-cg-bg-100 bg-cg-white-300 hover:border-cg-neutral-700 hover:bg-cg-white-100 grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-lg border px-4 py-3 transition-all"
          >
            <div
              className={cn(
                'h-2 w-2 shrink-0 rounded-full',
                dotColor[flag.status]
              )}
            />

            <div>
              <div className="font-mono text-[13px] font-semibold text-white">
                {flag.key}
              </div>
              <div className="text-cg-neutral-300 mt-0.5 text-[11px]">
                {flag.description}
              </div>
            </div>

            {flag.status === 'rollout' && flag.rollout !== undefined ? (
              <div className="flex items-center gap-2">
                <div className="bg-cg-yellow-400 h-1 w-14 overflow-hidden rounded-full">
                  <div
                    className="from-cg-yellow-300 to-cg-yellow-100 bg-linear-to-r h-full"
                    style={{ width: `${flag.rollout}%` }}
                  />
                </div>
                <span className="text-cg-yellow-200 font-mono text-[11px]">
                  {flag.rollout}%
                </span>
              </div>
            ) : (
              <Badge variant={flag.status}>{flag.status}</Badge>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
