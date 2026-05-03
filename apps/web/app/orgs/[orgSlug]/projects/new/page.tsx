import { CreateProjectForm } from '@/components/project/create-project-form'
import { getOrgBySlug } from '@/server/orgs/queries'
import { getSessionOrRedirect } from '@/lib/get-session-or-redirect'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string }>
}

export default async function Page({ params }: Props) {
  const { orgSlug } = await params
  await getSessionOrRedirect()
  const org = await getOrgBySlug(orgSlug)
  if (!org) {
    notFound()
  }

  return <CreateProjectForm orgId={org.id} orgSlug={orgSlug} />
}
