import { notFound } from 'next/navigation'
import { getFlag } from '@/server/flags/queries'
import { getOrgBySlug } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import type { FlagFormData } from '@/components/project/flag-form'
import { FlagForm } from '@/components/project/flag-form'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string; flagId: string }>
}

export default async function EditFlagPage({ params }: Props) {
  const { orgSlug, projectSlug, flagId } = await params
  const org = await getOrgBySlug(orgSlug)
  if (!org) notFound()
  const project = await getProjectBySlug(org.id, projectSlug)
  if (!project) notFound()

  const flag = await getFlag(org.id, project.id, flagId)
  if (!flag) notFound()

  const initialData: Partial<FlagFormData> = {
    name: flag.name,
    key: flag.key,
    description: flag.description,
    type: flag.type,
    defaultEnabled: flag.enabled,
    rolloutPercent: flag.rolloutPercent,
    scheduleEnabled: flag.scheduleEnabled ?? false,
    scheduleDate: flag.scheduleDate ?? '',
    scheduleAction: flag.scheduleAction ?? 'enable',
    autoRolloutEnabled: flag.autoRolloutEnabled ?? false,
    increaseBy: flag.increaseBy ?? 10,
    everyValue: flag.everyValue ?? 1,
    everyUnit: flag.everyUnit ?? 'hours',
    untilMax: flag.untilMax ?? 100,
    scheduleRolloutPercent: flag.scheduleRolloutPercent ?? 0
  }

  return (
    <FlagForm
      mode="edit"
      orgId={org.id}
      projectId={project.id}
      orgSlug={orgSlug}
      projectSlug={projectSlug}
      flagId={flagId}
      initialData={initialData}
    />
  )
}
