import { FlagForm } from '@/components/project/flag-form'
import { getOrgBySlug } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import { getSessionOrRedirect } from '@/shared/auth'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}

export default async function Page({ params }: Props) {
  const { orgSlug, projectSlug } = await params
  await getSessionOrRedirect()
  const org = await getOrgBySlug(orgSlug)
  if (!org) {
    notFound()
  }

  const project = await getProjectBySlug(org.id, projectSlug)
  if (!project) {
    notFound()
  }

  return (
    <FlagForm
      mode="new"
      orgId={org.id}
      projectId={project.id}
      orgSlug={orgSlug}
      projectSlug={projectSlug}
    />
  )
}
