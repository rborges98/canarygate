import { getHistory } from '@/server/history/queries'
import { getOrgBySlug } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import { HistoryList } from '@/components/project/history-list'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}

export default async function HistoryPage({ params }: Props) {
  const { orgSlug, projectSlug } = await params
  const org = await getOrgBySlug(orgSlug)
  if (!org) notFound()
  const project = await getProjectBySlug(org.id, projectSlug)
  if (!project) notFound()

  const entries = await getHistory(org.id, project.id)
  return <HistoryList entries={entries} />
}
