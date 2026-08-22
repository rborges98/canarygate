import { OrgShell } from '@/components/org/org-shell'
import { FlagStreamRefresher } from '@/components/project/flag-stream-refresher'
import { getOrgBySlugOrName } from '@/server/orgs/queries'
import { getSessionOrRedirect } from '@/shared/auth'

type Props = {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}

export default async function OrgLayout({ children, params }: Props) {
  const session = await getSessionOrRedirect()
  const { orgSlug } = await params
  const org = await getOrgBySlugOrName(orgSlug)
  const orgName = org?.name ?? orgSlug

  return (
    <div className="bg-cg-bg-400 relative flex h-screen flex-col overflow-x-hidden">
      <FlagStreamRefresher />
      <OrgShell orgSlug={orgSlug} orgName={orgName} user={session.user}>
        {children}
      </OrgShell>
    </div>
  )
}
