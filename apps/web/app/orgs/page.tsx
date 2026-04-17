import Link from 'next/link'
import { OrgCard } from '@/components/org/org-card'
import { Nav } from '@/components/nav'
import { getOrgs } from '@/server/orgs/queries'
import { getSessionOrRedirect } from '@/lib/get-session-or-redirect'

export default async function OrgsPage() {
  await getSessionOrRedirect()
  const orgs = await getOrgs()
  return (
    <div className="bg-cg-bg-400 relative min-h-screen">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-cg-indigo-900)_0%,transparent_70%)]" />

      <Nav />

      <div className="relative z-10 px-4 py-5 sm:px-8 sm:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-white">Organizations</h2>
            <p className="text-cg-neutral-400 mt-0.5 font-mono text-[12px]">
              Your workspaces
            </p>
          </div>
          <Link
            href="/orgs/new"
            className="bg-cg-indigo-300 hover:bg-cg-indigo-400 w-full rounded-lg px-4 py-2 text-center text-[12px] font-semibold text-white transition-colors sm:w-fit"
          >
            + New organization
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <OrgCard key={org.orgId} {...org} />
          ))}
        </div>
      </div>
    </div>
  )
}
