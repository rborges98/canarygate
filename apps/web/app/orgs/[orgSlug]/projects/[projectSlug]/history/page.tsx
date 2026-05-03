import { getHistory } from '@/server/history/queries'
import { getOrgBySlug } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import { ENVIRONMENTS } from '@/shared/environments'
import { HistoryList } from '@/components/project/history-list'
import { getSessionOrRedirect } from '@/lib/get-session-or-redirect'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}

export default async function HistoryPage({ params }: Props) {
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

  if (project.projectRole !== 'ADMIN') {
    notFound()
  }

  const { items, total } = await getHistory(org.id, project.id)

  return (
    <div>
      <HistoryList
        entries={items}
        total={total}
        orgId={org.id}
        projectId={project.id}
        environments={[...ENVIRONMENTS]}
      />
    </div>
  )
}
