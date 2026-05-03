import { getFlags } from '@/server/flags/queries'
import { getOrgBySlug } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import { FlagsList } from '@/components/project/flags-list'
import { EnvironmentSelector } from '@/components/project/environment-selector'
import { getSessionOrRedirect } from '@/lib/get-session-or-redirect'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string }>
  searchParams: Promise<{ env?: string }>
}

export default async function FlagsPage({ params, searchParams }: Props) {
  const { orgSlug, projectSlug } = await params
  const { env } = await searchParams
  await getSessionOrRedirect()
  const org = await getOrgBySlug(orgSlug)
  if (!org) {
    notFound()
  }

  const project = await getProjectBySlug(org.id, projectSlug)
  if (!project) {
    notFound()
  }

  const currentSlug = env ?? 'production'

  const flags = await getFlags(org.id, project.id, currentSlug)

  return (
    <div>
      <div className="border-cg-bg-100 flex items-center border-b px-4 pt-3 sm:px-8">
        <EnvironmentSelector currentSlug={currentSlug} />
      </div>
      <FlagsList
        flags={flags}
        orgSlug={orgSlug}
        projectSlug={projectSlug}
        currentEnv={currentSlug}
      />
    </div>
  )
}
