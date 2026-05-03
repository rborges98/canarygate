import Link from 'next/link'
import { cn } from '@/shared/utils'

type ProjectCardProps = {
  orgSlug: string
  name: string
  slug: string
  active: boolean
}

export function ProjectCard({ orgSlug, name, slug, active }: ProjectCardProps) {
  return (
    <Link href={`/orgs/${orgSlug}/projects/${slug}/flags`}>
      <div className="border-cg-bg-100 bg-cg-white-300 hover:border-cg-indigo-600 hover:bg-cg-indigo-950 group cursor-pointer rounded-xl border p-4 transition-all">
        <div className="mb-2 flex items-center gap-2">
          <div
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              active
                ? 'bg-cg-green-100 shadow-[0_0_5px_rgba(34,197,94,0.4)]'
                : 'bg-cg-red-100 shadow-[0_0_5px_rgba(239,68,68,0.35)]'
            )}
          />
          <span
            className={cn(
              'font-mono text-[10px]',
              active ? 'text-cg-green-100' : 'text-cg-red-100'
            )}
          >
            {active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="mb-0.5 text-[14px] font-semibold text-white">
          {name}
        </div>
        <div className="text-cg-neutral-500 font-mono text-[10px]">{slug}</div>
      </div>
    </Link>
  )
}

export default ProjectCard
