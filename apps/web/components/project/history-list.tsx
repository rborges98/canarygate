'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { SearchInput } from '@/components/ui/search-input'
import { UserAvatar } from '@/components/ui/user-avatar'
import { cn } from '@/shared/utils'
import type { HistoryItem } from '@/server/history/queries'

type ApiAction = HistoryItem['action']
type ActionFilter = 'all' | ApiAction

function actionToVariant(
  action: ApiAction
): 'created' | 'deleted' | 'enabled' | 'rollout' | 'canary' {
  switch (action) {
    case 'created':
      return 'created'
    case 'deleted':
      return 'deleted'
    case 'toggled':
      return 'enabled'
    case 'rollout_updated':
      return 'rollout'
    case 'updated':
      return 'canary'
  }
}

function actionToLabel(action: ApiAction): string {
  switch (action) {
    case 'created':
      return 'CREATED'
    case 'deleted':
      return 'DELETED'
    case 'toggled':
      return 'TOGGLED'
    case 'rollout_updated':
      return 'ROLLOUT'
    case 'updated':
      return 'UPDATED'
  }
}

function actionToDescription(action: ApiAction): string {
  switch (action) {
    case 'created':
      return 'created'
    case 'deleted':
      return 'deleted'
    case 'toggled':
      return 'toggled'
    case 'rollout_updated':
      return 'changed rollout of'
    case 'updated':
      return 'updated'
  }
}

function formatTime(createdAt: string): string {
  const d = new Date(createdAt)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function renderChanges(entry: HistoryItem): React.ReactNode {
  const { action, changes } = entry

  if (action === 'created' || action === 'deleted' || !changes) return null

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
    if (key === 'enabled') return togglePill(!!value)
    if (key === 'rolloutPercent') return rolloutPill(value)
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
        if (fromVal === toVal) return null
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
    if (diffs.length === 0) return null
    return <div className="mt-1.5 flex flex-col gap-1">{diffs}</div>
  }

  return null
}

interface Props {
  entries: HistoryItem[]
}

export function HistoryList({ entries }: Props) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all')

  const filtered = entries.filter((entry) => {
    const matchesSearch =
      entry.flagKey.toLowerCase().includes(search.toLowerCase()) ||
      entry.actorEmail.toLowerCase().includes(search.toLowerCase())
    const matchesAction =
      actionFilter === 'all' || entry.action === actionFilter
    return matchesSearch && matchesAction
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
          onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
        />
      </div>

      {/* Entries */}
      <div className="flex flex-col gap-2">
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="border-cg-bg-100 bg-cg-white-300 flex items-start gap-3 rounded-lg border px-3 py-3 sm:items-center"
          >
            <UserAvatar initial={entry.actorInitial} size="sm" />

            <div className="min-w-0 flex-1">
              <div className="text-[12px] text-white">
                <span className="text-cg-indigo-200 font-mono text-[11px] font-semibold">
                  {entry.actorEmail}
                </span>{' '}
                <span className="text-cg-neutral-400">
                  {actionToDescription(entry.action)}
                </span>{' '}
                <span className="text-cg-indigo-100 font-mono text-[11px]">
                  {entry.flagKey}
                </span>
              </div>
              {renderChanges(entry)}
              <div className="text-cg-neutral-500 mt-0.5 font-mono text-[10px]">
                {formatTime(entry.createdAt)}
              </div>
            </div>

            <Badge
              variant={actionToVariant(entry.action)}
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
    </div>
  )
}
