import { getFlags } from '@/server/flags/queries'
import { getOrgBySlug } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import { FlagsList } from '@/components/project/flags-list'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}

export default async function FlagsPage({ params }: Props) {
  const { orgSlug, projectSlug } = await params
  const org = await getOrgBySlug(orgSlug)
  if (!org) notFound()
  const project = await getProjectBySlug(org.id, projectSlug)
  if (!project) notFound()

  const flags = await getFlags(org.id, project.id)
  return <FlagsList flags={flags} orgSlug={orgSlug} projectSlug={projectSlug} />
}
