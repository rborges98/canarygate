import { OrgShell } from '@/components/org-shell'
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
      <OrgShell orgSlug={orgSlug} orgName={orgName} user={session.user}>
        {children}
      </OrgShell>
    </div>
  )
}
