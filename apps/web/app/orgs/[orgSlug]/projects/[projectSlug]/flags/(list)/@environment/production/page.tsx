import { getFlags } from '@/server/flags/queries'
import { getOrgBySlugOrName } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import { FlagsList } from '@/components/project/flags-list'
import { getSessionOrRedirect } from '@/shared/auth'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ProductionFlagsPage({
  params,
  searchParams
}: Props) {
  const { orgSlug, projectSlug } = await params
  const query = await searchParams
  const page = Math.max(1, Math.floor(Number(query.page) || 1))
  await getSessionOrRedirect()

  const org = await getOrgBySlugOrName(orgSlug)
  if (!org) notFound()

  const project = await getProjectBySlug(org.id, projectSlug)
  if (!project) notFound()

  const {
    items: flags,
    total,
    page: currentPage,
    pageSize
  } = await getFlags(org.id, project.id, 'production', page)

  return (
    <FlagsList
      flags={flags}
      orgSlug={orgSlug}
      projectSlug={projectSlug}
      currentEnv="production"
      pagination={{
        page: currentPage,
        pageSize,
        total,
        baseHref: `/orgs/${orgSlug}/projects/${projectSlug}/flags/production`
      }}
    />
  )
}