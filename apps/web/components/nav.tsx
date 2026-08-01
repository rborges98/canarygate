import Link from 'next/link'
import { cn } from '@/shared/utils'
import { Logo } from '@/components/logo'
import { UserMenu } from '@/components/user-menu'
import type { SessionUser } from '@/shared/auth'

type NavProps = {
  org?: { label: string; orgSlug: string }
  project?: { label: string; projectSlug: string }
  className?: string
  user?: SessionUser | null
}

export function Nav({ org, project, className, user }: NavProps) {
  return (
    <nav
      className={cn(
        'border-cg-bg-100 relative z-30 flex h-[60px] items-center justify-between border-b px-4 sm:px-8',
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2 text-[13px]">
        <Link href="/orgs">
          <Logo />
        </Link>

        {org && (
          <>
            <span className="text-cg-neutral-700">/</span>
            {project ? (
              <Link
                href={`/orgs/${org.orgSlug}/projects`}
                className="text-cg-neutral-300 max-w-[120px] truncate font-medium transition-colors hover:text-white sm:max-w-none"
              >
                {org.label}
              </Link>
            ) : (
              <span className="max-w-[140px] truncate font-semibold text-white sm:max-w-none">
                {org.label}
              </span>
            )}
          </>
        )}

        {project && (
          <>
            <span className="text-cg-neutral-700">/</span>
            <span className="max-w-[120px] truncate font-semibold text-white sm:max-w-none">
              {project.label}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cg-neutral-400 hover:text-white text-[13px] transition-colors"
        >
          Docs
        </Link>
        <UserMenu initialUser={user} />
      </div>
    </nav>
  )
}

export default Nav
