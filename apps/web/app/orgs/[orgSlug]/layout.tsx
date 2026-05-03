import { OrgShell } from '@/components/org-shell'
import { getOrgBySlug } from '@/server/orgs/queries'
import { getSessionOrRedirect } from '@/lib/get-session-or-redirect'

type Props = {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}

export default async function OrgLayout({ children, params }: Props) {
  await getSessionOrRedirect()
  const { orgSlug } = await params
  const org = await getOrgBySlug(orgSlug)
  const orgName = org?.name ?? orgSlug

  return (
    <div className="bg-cg-bg-400 relative flex h-screen flex-col overflow-x-hidden">
      <OrgShell orgSlug={orgSlug} orgName={orgName}>
        {children}
      </OrgShell>
    </div>
  )
}
