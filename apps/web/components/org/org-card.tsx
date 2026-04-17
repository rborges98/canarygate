import Link from 'next/link'
import { cn } from '@/shared/utils'

type OrgCardProps = {
  orgSlug: string
  initial: string
  name: string
  role: 'OWNER' | 'MEMBER'
  projects: number
  members: number
}

export function OrgCard({
  orgSlug,
  initial,
  name,
  role,
  projects,
  members
}: OrgCardProps) {
  const isOwner = role === 'OWNER'

  return (
    <Link href={`/orgs/${orgSlug}/projects`}>
      <div className="border-cg-bg-100 bg-cg-white-200 hover:border-cg-indigo-600 hover:bg-cg-indigo-950 group cursor-pointer rounded-xl border p-4 transition-all">
        <div className="mb-3 flex items-center gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold transition-transform group-hover:scale-105',
              isOwner
                ? 'bg-cg-indigo-950 text-cg-indigo-100'
                : 'bg-cg-bg-100 text-cg-neutral-400'
            )}
          >
            {initial}
          </div>
          <div>
            <div className="group-hover:text-cg-indigo-100 text-[13px] font-semibold text-white">
              {name}
            </div>
            <div className="text-cg-neutral-400 font-mono text-[10px]">
              {role}
            </div>
          </div>
        </div>
        <div className="text-cg-neutral-500 font-mono text-[11px]">
          {projects} {projects === 1 ? 'project' : 'projects'} · {members}{' '}
          members
        </div>
      </div>
    </Link>
  )
}

export default OrgCard
