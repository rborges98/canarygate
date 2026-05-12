import { notFound } from 'next/navigation'
import { getFlag } from '@/server/flags/queries'
import { getOrgBySlug } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import { FlagForm } from '@/components/project/flag-form'
import { getSessionOrRedirect } from '@/shared/auth'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string; flagKey: string[] }>
  searchParams: Promise<{ env?: string }>
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return ''
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  return normalized.slice(0, 16)
}

export default async function EditFlagPage({ params, searchParams }: Props) {
  const { orgSlug, projectSlug, flagKey } = await params
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
  const resolvedFlagKey = flagKey.join('/')

  const flag = await getFlag(org.id, project.id, resolvedFlagKey, currentSlug)
  if (!flag) {
    notFound()
  }

  const initialData = {
    name: flag.name,
    key: flag.key,
    description: flag.description,
    type: flag.type,
    defaultEnabled: flag.enabled,
    rolloutPercent: flag.rolloutPercent,
    scheduleEnabled: flag.scheduleEnabled ?? false,
    scheduleDate: toDateTimeLocalValue(flag.scheduleDate),
    scheduleAction: flag.scheduleAction ?? 'enable',
    autoRolloutEnabled: flag.autoRolloutEnabled ?? false,
    increaseBy: flag.increaseBy ?? 10,
    everyValue: flag.everyValue ?? 1,
    everyUnit: flag.everyUnit ?? 'hours',
    untilMax: flag.untilMax ?? 100,
    autoRolloutNextAt: flag.autoRolloutNextAt ?? '',
    scheduleRolloutPercent: flag.scheduleRolloutPercent ?? 0
  }

  return (
    <FlagForm
      mode="edit"
      orgId={org.id}
      projectId={project.id}
      orgSlug={orgSlug}
      projectSlug={projectSlug}
      environmentSlug={currentSlug}
      flagId={flag.id}
      initialData={initialData}
    />
  )
}
