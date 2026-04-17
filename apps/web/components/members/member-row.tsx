import { cn } from '@/shared/utils'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import type { Member } from './types'

interface MemberRowProps {
  member: Member
  isSelected: boolean
  onSelect: () => void
}

export function MemberRow({ member, isSelected, onSelect }: MemberRowProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
        isSelected
          ? 'bg-cg-indigo-950 border-cg-indigo-600'
          : 'bg-cg-white-300 border-cg-bg-100 hover:border-cg-indigo-800 hover:bg-cg-white-200'
      )}
    >
      <UserAvatar initial={member.initial} isOwner={member.isOwner} size="md" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-white">
          {member.email}
        </p>
        <p className="text-cg-neutral-500 truncate font-mono text-[11px]">
          {member.isOwner
            ? 'Owner'
            : member.projects.length === 0
              ? 'No projects'
              : `${member.projects.length} project${member.projects.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {member.isOwner && <Badge variant="owner">OWNER</Badge>}
    </button>
  )
}
