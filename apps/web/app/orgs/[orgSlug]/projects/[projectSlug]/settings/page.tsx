import {
  getProjectBySlug,
  getApiKey,
  getWebhook
} from '@/server/projects/queries'
import { getOrgBySlug } from '@/server/orgs/queries'
import { ProjectSettingsForm } from '@/components/project/project-settings-form'
import { getSessionOrRedirect } from '@/shared/auth'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}

export default async function ProjectSettingsPage({ params }: Props) {
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

  const [apiKey, webhookUrl] = await Promise.all([
    getApiKey(org.id, project.id),
    getWebhook(org.id, project.id)
  ])

  return (
    <ProjectSettingsForm
      orgId={org.id}
      projectId={project.id}
      orgSlug={orgSlug}
      initialName={project.name}
      initialSlug={project.slug}
      initialActive={project.active}
      initialApiKey={apiKey ?? ''}
      initialWebhookUrl={webhookUrl ?? ''}
    />
  )
}
