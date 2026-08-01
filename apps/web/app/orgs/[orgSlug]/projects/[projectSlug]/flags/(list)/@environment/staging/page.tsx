import { getFlags } from '@/server/flags/queries'
import { getOrgBySlugOrName } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import { FlagsList } from '@/components/project/flags-list'
import { getSessionOrRedirect } from '@/shared/auth'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}

export default async function StagingFlagsPage({ params }: Props) {
  const { orgSlug, projectSlug } = await params
  await getSessionOrRedirect()

  const org = await getOrgBySlugOrName(orgSlug)
  if (!org) notFound()

  const project = await getProjectBySlug(org.id, projectSlug)
  if (!project) notFound()

  const flags = await getFlags(org.id, project.id, 'staging')

  return (
    <FlagsList
      flags={flags}
      orgSlug={orgSlug}
      projectSlug={projectSlug}
      currentEnv="staging"
    />
  )
}
