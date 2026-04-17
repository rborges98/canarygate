'use client'

import { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { SearchInput } from '@/components/ui/search-input'
import { MemberRow } from '@/components/members/member-row'
import { OwnerDetail } from '@/components/members/owner-detail'
import { MemberDetail } from '@/components/members/member-detail'
import type { Member } from '@/components/members/types'
import { makeOwner, removeMember, sendInvite } from '@/server/members/actions'

interface Props {
  orgId: string
  members: Member[]
  availableProjects: { projectId: string; name: string }[]
}

export function MembersClient({
  orgId,
  members: initialMembers,
  availableProjects
}: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [selectedId, setSelectedId] = useState<string>(
    initialMembers[0]?.id ?? ''
  )
  const [makeOwnerTarget, setMakeOwnerTarget] = useState<Member | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'OWNER'>('MEMBER')
  const [inviting, setInviting] = useState(false)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch = m.email.toLowerCase().includes(search.toLowerCase())
      const matchesProject =
        projectFilter === 'all' ||
        m.isOwner ||
        m.projects.some((p) => p.projectId === projectFilter)
      return matchesSearch && matchesProject
    })
  }, [members, search, projectFilter])

  const selected =
    filteredMembers.find((m) => m.id === selectedId) ?? filteredMembers[0]

  const confirmMakeOwner = async () => {
    if (!makeOwnerTarget) return
    await makeOwner(orgId, makeOwnerTarget.id)
    setMembers((prev) =>
      prev.map((m) =>
        m.id === makeOwnerTarget.id ? { ...m, isOwner: true } : m
      )
    )
    setMakeOwnerTarget(null)
  }

  const confirmRemove = async () => {
    if (!removeTarget) return
    await removeMember(orgId, removeTarget.id)
    const remaining = members.filter((m) => m.id !== removeTarget.id)
    setMembers(remaining)
    setSelectedId(remaining[0]?.id ?? '')
    setRemoveTarget(null)
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    await sendInvite(orgId, { email: inviteEmail.trim(), orgRole: inviteRole })
    setInviting(false)
    setInviteEmail('')
    setInviteRole('MEMBER')
    setInviteOpen(false)
  }

  return (
    <div className="flex h-full flex-col px-4 py-4 sm:px-8 sm:py-6">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search members..."
        />
        <Select
          variant="compact"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All projects' },
            ...availableProjects.map((p) => ({
              value: p.projectId,
              label: p.name
            }))
          ]}
        />
        <button
          onClick={() => setInviteOpen(true)}
          className="bg-cg-indigo-300 hover:bg-cg-indigo-400 ml-auto rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-colors"
        >
          + Invite member
        </button>
      </div>

      {/* Split layout */}
      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 md:flex-row">
        {/* Left — member list */}
        <div className="flex flex-col gap-1.5 overflow-y-auto md:shrink-0 md:basis-1/2">
          {filteredMembers.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isSelected={selectedId === member.id}
              onSelect={() => setSelectedId(member.id)}
            />
          ))}
        </div>

        {/* Right — detail panel */}
        <div className="border-cg-bg-100 bg-cg-white-300 h-fit flex-1 overflow-y-auto rounded-xl border p-5">
          {selected ? (
            selected.isOwner ? (
              <OwnerDetail member={selected} />
            ) : (
              <MemberDetail
                key={selected.id}
                orgId={orgId}
                member={selected}
                availableProjects={availableProjects}
                onMakeOwner={() => setMakeOwnerTarget(selected)}
                onRemoveFromOrg={() => setRemoveTarget(selected)}
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-cg-neutral-600 font-mono text-[11px]">
                Select a member
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Make owner modal */}
      <Modal open={!!makeOwnerTarget} onClose={() => setMakeOwnerTarget(null)}>
        <div className="border-cg-bg-100 border-b px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="border-cg-indigo-600 bg-cg-indigo-800 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border">
              <span className="text-[15px]">👑</span>
            </div>
            <div>
              <h3 className="mb-1 text-[15px] font-bold text-white">
                Make owner?
              </h3>
              <p className="text-cg-neutral-300 text-[12px] leading-5">
                You&apos;re giving{' '}
                <span className="font-medium text-white">
                  {makeOwnerTarget?.email}
                </span>{' '}
                full ownership of this organization.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <p className="text-cg-neutral-400 mb-3 text-[11px]">
            As an Owner, they will be able to:
          </p>
          <div className="mb-4 flex flex-col gap-2">
            {[
              'Access and manage all projects',
              'Invite and remove any member',
              'Change org settings and billing',
              'Delete the organization'
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="bg-cg-indigo-200 h-1.5 w-1.5 shrink-0 rounded-full" />
                <span className="text-cg-neutral-300 text-[12px]">{item}</span>
              </div>
            ))}
          </div>
          <div className="border-cg-indigo-800 bg-cg-indigo-950 text-cg-indigo-200 rounded-lg border px-3 py-2 font-mono text-[11px]">
            You&apos;ll remain an Owner. An org can have multiple owners.
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button
            className="bg-cg-indigo-300 hover:bg-cg-indigo-400 flex-1 rounded-lg py-2.5 text-[12px] font-semibold text-white transition-colors"
            onClick={confirmMakeOwner}
          >
            Confirm
          </button>
          <button
            className="border-cg-bg-100 bg-cg-bg-100 text-cg-neutral-300 flex-1 rounded-lg border py-2.5 text-[12px] transition-colors hover:text-white"
            onClick={() => setMakeOwnerTarget(null)}
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Remove from org modal */}
      <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)}>
        <div className="border-cg-bg-100 border-b px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="border-cg-red-200 bg-cg-red-300 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border">
              <span className="text-[15px]">🗑</span>
            </div>
            <div>
              <h3 className="mb-1 text-[15px] font-bold text-white">
                Remove member?
              </h3>
              <p className="text-cg-neutral-300 text-[12px] leading-5">
                <span className="font-medium text-white">
                  {removeTarget?.email}
                </span>{' '}
                will lose access to all projects in this organization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-6">
          <button
            className="bg-cg-red-300 border-cg-red-200 text-cg-red-100 flex-1 rounded-lg border py-2.5 text-[12px] font-semibold transition-colors hover:bg-[rgba(239,68,68,0.18)]"
            onClick={confirmRemove}
          >
            Remove
          </button>
          <button
            className="border-cg-bg-100 bg-cg-bg-100 text-cg-neutral-300 flex-1 rounded-lg border py-2.5 text-[12px] transition-colors hover:text-white"
            onClick={() => setRemoveTarget(null)}
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Invite member modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <div className="border-cg-bg-100 border-b px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="border-cg-indigo-600 bg-cg-indigo-800 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border">
              <span className="text-[15px]">✉️</span>
            </div>
            <div>
              <h3 className="mb-1 text-[15px] font-bold text-white">
                Invite member
              </h3>
              <p className="text-cg-neutral-300 text-[12px] leading-5">
                Send an invite link to join this organization.
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
              className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-100 focus:border-cg-indigo-300 w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none transition-colors"
              placeholder="member@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-cg-neutral-400 mb-1.5 block font-mono text-[11px]">
              Org role
            </label>
            <Select
              options={[
                { value: 'MEMBER', label: 'Member' },
                { value: 'OWNER', label: 'Owner' }
              ]}
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as 'MEMBER' | 'OWNER')
              }
            />
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button
            className="bg-cg-indigo-300 hover:bg-cg-indigo-400 disabled:bg-cg-white-200 disabled:text-cg-neutral-500 flex-1 rounded-lg py-2.5 text-[12px] font-semibold text-white transition-colors disabled:cursor-not-allowed"
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
