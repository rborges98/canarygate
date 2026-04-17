import { getMembers } from '@/server/members/queries'
import { getProjects } from '@/server/projects/queries'
import { getOrgBySlug } from '@/server/orgs/queries'
import { MembersClient } from '@/components/members/members-client'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string }>
}

export default async function MembersPage({ params }: Props) {
  const { orgSlug } = await params
  const org = await getOrgBySlug(orgSlug)
  if (!org) notFound()

  const [members, projects] = await Promise.all([
    getMembers(org.id),
    getProjects(org.id)
  ])
  const availableProjects = projects.map((p) => ({
    projectId: p.projectId,
    name: p.name
  }))
  return (
    <MembersClient
      orgId={org.id}
      members={members}
      availableProjects={availableProjects}
    />
  )
}
