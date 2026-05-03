'use client'

import React, { useState, useTransition } from 'react'
import { Badge, type BadgeColor } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SearchInput } from '@/components/ui/search-input'
import { UserAvatar } from '@/components/ui/user-avatar'
import { cn } from '@/shared/utils'
import { loadMoreHistory } from '@/server/history/actions'
import type { HistoryItem } from '@/server/history/queries'
import { ENVIRONMENTS, type Environment } from '@/shared/environments'

const ENV_COLORS: Record<string, string> = {
  production: 'bg-cg-red-200/10 border-cg-red-200/60 text-cg-red-100',
  staging: 'bg-cg-yellow-200/10 border-cg-yellow-200/60 text-cg-yellow-200',
  development: 'bg-cg-indigo-950/60 border-cg-indigo-600/60 text-cg-indigo-100'
}
const DEFAULT_ENV_COLOR = 'bg-cg-bg-100 border-cg-bg-200 text-cg-neutral-400'

type ApiAction = HistoryItem['action']
type ActionFilter = 'all' | ApiAction

const ACTION_BADGE_COLOR: Record<ApiAction, BadgeColor> = {
  created: 'indigo',
  deleted: 'red',
  toggled: 'green',
  rollout_updated: 'yellow',
  updated: 'yellow'
}

const ACTION_LABEL_BY_TYPE: Record<ApiAction, string> = {
  created: 'CREATED',
  deleted: 'DELETED',
  toggled: 'TOGGLED',
  rollout_updated: 'ROLLOUT',
  updated: 'UPDATED'
}

const ACTION_DESCRIPTION_BY_TYPE: Record<ApiAction, string> = {
  created: 'created',
  deleted: 'deleted',
  toggled: 'toggled',
  rollout_updated: 'changed rollout of',
  updated: 'updated'
}

function actionToLabel(action: ApiAction): string {
  return ACTION_LABEL_BY_TYPE[action]
}

function actionToDescription(action: ApiAction): string {
  return ACTION_DESCRIPTION_BY_TYPE[action]
}

function formatTime(createdAt: string): string {
  const d = new Date(createdAt)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) {
    return 'just now'
  }

  if (mins < 60) {
    return `${mins} minute${mins > 1 ? 's' : ''} ago`
  }

  const hours = Math.floor(mins / 60)
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }

  const days = Math.floor(hours / 24)
  if (days === 1) {
    return 'yesterday'
  }

  return `${days} days ago`
}

function renderChanges(entry: HistoryItem): React.ReactNode {
  const { action, changes } = entry

  if (action === 'created' || action === 'deleted' || !changes) {
    return null
  }

  const togglePill = (isEnabled: boolean) => (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 font-mono text-[10px]',
        isEnabled
          ? 'bg-cg-green-300 border-cg-green-200 text-cg-green-100 border'
          : 'bg-cg-red-300 border-cg-red-200 text-cg-red-100 border'
      )}
    >
      {isEnabled ? 'enabled' : 'disabled'}
    </span>
  )

  const rolloutPill = (value: unknown) => (
    <span className="bg-cg-indigo-800 border-cg-indigo-700 text-cg-indigo-100 rounded border px-1.5 py-0.5 font-mono text-[10px]">
      {String(value)}%
    </span>
  )

  const textPill = (value: unknown) => (
    <span className="bg-cg-bg-100 text-cg-neutral-300 rounded px-1.5 py-0.5 font-mono text-[10px]">
      {String(value)}
    </span>
  )

  const word = (text: string) => (
    <span className="text-cg-neutral-500 font-mono text-[10px]">{text}</span>
  )

  const c = changes as {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
  }
  const before = c.before ?? {}
  const after = c.after ?? {}

  const valuePill = (key: string, value: unknown) => {
    if (key === 'enabled') {
      return togglePill(!!value)
    }

    if (key === 'rolloutPercent') {
      return rolloutPill(value)
    }

    return textPill(value)
  }

  if (action === 'toggled') {
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {word('changed from')}
        {togglePill(!!before.enabled)}
        {word('to')}
        {togglePill(!!after.enabled)}
      </div>
    )
  }

  if (action === 'rollout_updated') {
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {word('changed from')}
        {rolloutPill(before.rolloutPercent)}
        {word('to')}
        {rolloutPill(after.rolloutPercent)}
      </div>
    )
  }

  if (action === 'updated') {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
    const diffs = Array.from(allKeys)
      .map((key) => {
        const fromVal = before[key]
        const toVal = after[key]
        if (fromVal === undefined || fromVal === toVal) {
          return null
        }

        return (
          <div key={key} className="flex flex-wrap items-center gap-1">
            {word('changed from')}
            {valuePill(key, fromVal)}
            {word('to')}
            {valuePill(key, toVal)}
          </div>
        )
      })
      .filter(Boolean)
    if (diffs.length === 0) {
      return null
    }

    return <div className="mt-1.5 flex flex-col gap-1">{diffs}</div>
  }

  return null
}

type Props = {
  entries: HistoryItem[]
  total: number
  orgId: string
  projectId: string
  environments?: Environment[]
}

export function HistoryList({
  entries: initialEntries,
  total: initialTotal,
  orgId,
  projectId
}: Props) {
  const [entries, setEntries] = useState(initialEntries)
  const [serverTotal, setServerTotal] = useState(initialTotal)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all')
  const [envFilter, setEnvFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  const hasMore = entries.length < serverTotal

  function handleActionFilterChange(newFilter: ActionFilter) {
    setActionFilter(newFilter)
    startTransition(async () => {
      const action = newFilter === 'all' ? undefined : newFilter
      const envSlug = envFilter === 'all' ? undefined : envFilter
      const { items, total } = await loadMoreHistory(
        orgId,
        projectId,
        0,
        action,
        envSlug
      )
      setEntries(items)
      setServerTotal(total)
    })
  }

  function handleEnvFilterChange(newEnv: string) {
    setEnvFilter(newEnv)
    startTransition(async () => {
      const action = actionFilter === 'all' ? undefined : actionFilter
      const envSlug = newEnv === 'all' ? undefined : newEnv
      const { items, total } = await loadMoreHistory(
        orgId,
        projectId,
        0,
        action,
        envSlug
      )
      setEntries(items)
      setServerTotal(total)
    })
  }

  function handleLoadMore() {
    startTransition(async () => {
      const action = actionFilter === 'all' ? undefined : actionFilter
      const envSlug = envFilter === 'all' ? undefined : envFilter
      const { items } = await loadMoreHistory(
        orgId,
        projectId,
        entries.length,
        action,
        envSlug
      )
      setEntries((prev) => [...prev, ...items])
    })
  }

  const filtered = entries.filter((entry) => {
    const matchesSearch =
      entry.flagKey.toLowerCase().includes(search.toLowerCase()) ||
      entry.actorEmail.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="px-4 py-4 sm:px-8 sm:py-6">
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter by flag or member..."
        />

        <Select
          variant="compact"
          options={[
            { value: 'all', label: 'All actions' },
            { value: 'created', label: 'Created' },
            { value: 'deleted', label: 'Deleted' },
            { value: 'toggled', label: 'Toggled' },
            { value: 'rollout_updated', label: 'Rollout changed' },
            { value: 'updated', label: 'Updated' }
          ]}
          value={actionFilter}
          onChange={(e) =>
            handleActionFilterChange(e.target.value as ActionFilter)
          }
        />

        {ENVIRONMENTS.length > 0 && (
          <Select
            variant="compact"
            options={[
              { value: 'all', label: 'All environments' },
              ...ENVIRONMENTS.map((e) => ({ value: e.slug, label: e.name }))
            ]}
            value={envFilter}
            onChange={(e) => handleEnvFilterChange(e.target.value)}
          />
        )}
      </div>

      {/* Entries */}
      <div className="flex flex-col gap-2">
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="border-cg-bg-100 bg-cg-white-300 flex items-start gap-3 rounded-lg border px-3 py-3 sm:items-center"
          >
            <UserAvatar
              initial={entry.actorInitial}
              variant="muted"
              size="md"
            />

            <div className="min-w-0 flex-1">
              <div className="flex gap-2 text-[12px] text-white">
                <span className="text-cg-indigo-200 font-mono font-semibold">
                  {entry.actorEmail}
                </span>
                <span className="text-cg-neutral-400">
                  {actionToDescription(entry.action)}
                </span>
                <span className="text-cg-indigo-100 font-mono">
                  {entry.flagKey}
                </span>
                {entry.environmentSlug && (
                  <>
                    {' '}
                    <span className="text-cg-neutral-400">on</span>
                    <span
                      className={cn(
                        'inline-flex rounded border px-1.5 py-0.5 align-middle font-mono text-[10px]',
                        ENV_COLORS[entry.environmentSlug] ?? DEFAULT_ENV_COLOR
                      )}
                    >
                      {entry.environmentSlug}
                    </span>
                  </>
                )}
              </div>
              {renderChanges(entry)}
              <div className="mt-0.5">
                <span className="text-cg-neutral-400 font-mono text-[10px]">
                  {formatTime(entry.createdAt)}
                </span>
              </div>
            </div>

            <Badge
              color={ACTION_BADGE_COLOR[entry.action]}
              className="mt-0.5 shrink-0 sm:mt-0"
            >
              {actionToLabel(entry.action)}
            </Badge>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-cg-neutral-600 py-8 text-center font-mono text-[12px]">
          No entries found
        </div>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="bg-cg-bg-100 hover:bg-cg-bg-200 text-cg-neutral-300 disabled:text-cg-neutral-600 rounded-md px-4 py-2 font-sans text-[12px] transition-colors disabled:cursor-not-allowed"
          >
            {isPending ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      {!hasMore && entries.length > 0 && (
        <div className="text-cg-neutral-600 mt-4 text-center font-mono text-[10px]">
          Showing all {serverTotal} entries
        </div>
      )}
    </div>
  )
}
