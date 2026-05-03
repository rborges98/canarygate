import { getMembers } from '@/server/members/queries'
import { getOrgBySlug } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import { ProjectMembersClient } from '@/components/project/project-members-client'
import { getSessionOrRedirect } from '@/lib/get-session-or-redirect'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}

export default async function ProjectMembersPage({ params }: Props) {
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

  const members = await getMembers(org.id)
  return (
    <ProjectMembersClient
      orgId={org.id}
      projectId={project.id}
      members={members}
    />
  )
}
