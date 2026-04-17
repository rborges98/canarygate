'use client'

import { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { UserAvatar } from '@/components/ui/user-avatar'
import { cn } from '@/shared/utils'
import type { MemberItem } from '@/server/members/queries'
import { sendInvite } from '@/server/members/actions'

interface Props {
  orgId: string
  projectId: string
  members: MemberItem[]
}

export function ProjectMembersClient({
  orgId,
  projectId,
  members: initialMembers
}: Props) {
  const [members] = useState<MemberItem[]>(initialMembers)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER')
  const [inviting, setInviting] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const projectMembers = useMemo(() => {
    return members
      .filter(
        (m) => m.isOwner || m.projects.some((p) => p.projectId === projectId)
      )
      .filter((m) => {
        const matchesSearch = m.email
          .toLowerCase()
          .includes(search.toLowerCase())
        const role = m.isOwner
          ? 'owner'
          : (m.projects
              .find((p) => p.projectId === projectId)
              ?.role?.toLowerCase() ?? 'member')
        const matchesRole = roleFilter === 'all' || role === roleFilter
        return matchesSearch && matchesRole
      })
  }, [members, projectId, search, roleFilter])

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    await sendInvite(orgId, {
      email: inviteEmail.trim(),
      orgRole: 'MEMBER',
      projectId,
      projectRole: inviteRole
    })
    setInviting(false)
    setInviteEmail('')
    setInviteRole('MEMBER')
    setInviteOpen(false)
  }

  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-8 sm:py-6">
      {/* Top bar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search members..."
        />
        <div className="flex gap-1.5">
          {(['all', 'owner', 'admin', 'member'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={cn(
                'rounded-md border px-3 py-1.5 font-mono text-[11px] font-medium transition-colors',
                roleFilter === role
                  ? 'border-cg-indigo-600 bg-cg-indigo-950 text-cg-indigo-100'
                  : 'border-cg-bg-100 text-cg-neutral-500 hover:text-cg-neutral-300'
              )}
            >
              {role}
            </button>
          ))}
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="bg-cg-indigo-300 hover:bg-cg-indigo-400 ml-auto rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-colors"
        >
          + Invite to project
        </button>
      </div>

      {/* Member list */}
      <div className="flex flex-col gap-1.5">
        {projectMembers.map((member) => {
          const projectAccess = member.projects.find(
            (p) => p.projectId === projectId
          )
          const roleLabel = member.isOwner
            ? 'Owner'
            : projectAccess?.role === 'ADMIN'
              ? 'Admin'
              : 'Member'

          return (
            <div
              key={member.id}
              className="bg-cg-white-300 border-cg-bg-100 flex items-center gap-3 rounded-lg border px-4 py-3"
            >
              <UserAvatar
                initial={member.initial}
                isOwner={member.isOwner}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[13px] font-semibold text-white">
                  {member.email}
                </p>
              </div>
              <Badge
                variant={
                  member.isOwner
                    ? 'owner'
                    : projectAccess?.role === 'ADMIN'
                      ? 'admin'
                      : 'member'
                }
              >
                {roleLabel.toUpperCase()}
              </Badge>
            </div>
          )
        })}

        {projectMembers.length === 0 && (
          <div className="border-cg-bg-100 flex items-center justify-center rounded-lg border py-12">
            <p className="text-cg-neutral-600 font-mono text-[11px]">
              No members yet
            </p>
          </div>
        )}
      </div>

      {/* Invite modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <div className="border-cg-bg-100 border-b px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="border-cg-indigo-600 bg-cg-indigo-800 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border">
              <span className="text-[15px]">✉️</span>
            </div>
            <div>
              <h3 className="mb-1 text-[15px] font-bold text-white">
                Invite to project
              </h3>
              <p className="text-cg-neutral-300 text-[12px] leading-5">
                They&apos;ll be added to the org and get access to this project.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4">
          <div>
            <label className="text-cg-neutral-400 mb-1.5 block font-mono text-[11px]">
              Email
            </label>
            <input
              type="email"
              className="border-cg-bg-100 bg-cg-bg-200 text-cg-neutral-100 focus:border-cg-indigo-300 w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none transition-colors"
              placeholder="member@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-cg-neutral-400 mb-1.5 block font-mono text-[11px]">
              Project role
            </label>
            <Select
              options={[
                { value: 'MEMBER', label: 'Member' },
                { value: 'ADMIN', label: 'Admin' }
              ]}
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as 'MEMBER' | 'ADMIN')
              }
            />
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button
            className="bg-cg-indigo-300 hover:bg-cg-indigo-400 flex-1 rounded-lg py-2.5 text-[12px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleSendInvite}
            disabled={inviting || !inviteEmail.trim()}
          >
            {inviting ? 'Sending...' : 'Send invite'}
          </button>
          <button
            className="border-cg-bg-100 bg-cg-bg-100 text-cg-neutral-300 flex-1 rounded-lg border py-2.5 text-[12px] transition-colors hover:text-white"
            onClick={() => setInviteOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  )
}
