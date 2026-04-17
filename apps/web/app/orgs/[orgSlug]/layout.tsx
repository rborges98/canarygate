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
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-cg-indigo-900)_0%,transparent_70%)]" />
      <OrgShell orgSlug={orgSlug} orgName={orgName}>
        {children}
      </OrgShell>
    </div>
  )
}
