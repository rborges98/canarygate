import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import type { Member } from './types'

export function OwnerDetail({ member }: { member: Member }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <UserAvatar initial={member.initial} isOwner size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-bold text-white">{member.email}</p>
            <Badge variant="owner">OWNER</Badge>
          </div>
        </div>
      </div>

      {/* Owner permissions box */}
      <div className="border-cg-indigo-800 bg-cg-indigo-950 rounded-xl border p-4">
        <p className="text-cg-neutral-400 mb-3 font-mono text-[11px] uppercase tracking-wider">
          Owner permissions
        </p>
        <div className="flex flex-col gap-2">
          {[
            'Access and manage all projects',
            'Invite and remove any member',
            'Change org settings and billing',
            'Delete the organization'
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <div className="bg-cg-indigo-200 h-1.5 w-1.5 shrink-0 rounded-full" />
              <span className="text-cg-neutral-300 text-[12px]">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Multiple owners note */}
      <p className="text-cg-neutral-500 font-mono text-[11px]">
        An org can have multiple owners.
      </p>
    </div>
  )
}
