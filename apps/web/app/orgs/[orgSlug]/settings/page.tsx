import { getOrgBySlug } from '@/server/orgs/queries'
import { OrgSettingsForm } from '@/components/org/org-settings-form'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string }>
}

export default async function OrgSettingsPage({ params }: Props) {
  const { orgSlug } = await params
  const org = await getOrgBySlug(orgSlug)
  if (!org) notFound()

  return (
    <OrgSettingsForm
      orgId={org.id}
      initialName={org.name}
      initialSlug={org.slug}
    />
  )
}
