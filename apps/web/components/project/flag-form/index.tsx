'use client'

import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { DangerZone } from '@/components/ui/danger-zone'
import { FlagFormHeader } from './flag-form-header'
import { GeneralInfoCard } from './general-info-card'
import { ConfigurationCard } from './configuration-card'
import { ScheduleCard } from './schedule-card'
import { AutoRolloutCard } from './auto-rollout-card'
import { updateFlag, deleteFlag, createFlag } from '@/server/flags/actions'
import type { FlagFormProps, FlagFormData } from './shared'

export type { FlagFormData } from './shared'

export function FlagForm({
  mode,
  orgId,
  projectId,
  orgSlug,
  projectSlug,
  flagId,
  initialData
}: FlagFormProps) {
  const router = useRouter()

  const methods = useForm<FlagFormData>({
    defaultValues: {
      name: initialData?.name ?? '',
      key: initialData?.key ?? '',
      description: initialData?.description ?? '',
      type: initialData?.type ?? 'boolean',
      defaultEnabled: initialData?.defaultEnabled ?? false,
      rolloutPercent: initialData?.rolloutPercent ?? 25,
      scheduleEnabled: initialData?.scheduleEnabled ?? false,
      scheduleDate: initialData?.scheduleDate ?? '',
      scheduleAction: initialData?.scheduleAction ?? 'enable',
      autoRolloutEnabled: initialData?.autoRolloutEnabled ?? false,
      increaseBy: initialData?.increaseBy ?? 10,
      everyValue: initialData?.everyValue ?? 1,
      everyUnit: initialData?.everyUnit ?? 'hours',
      untilMax: initialData?.untilMax ?? 100,
      scheduleRolloutPercent: initialData?.scheduleRolloutPercent ?? 25
    }
  })

  const backHref = `/orgs/${orgSlug}/projects/${projectSlug}/flags`

  const onSubmit = async (data: FlagFormData) => {
    if (mode === 'edit' && flagId) {
      await updateFlag(orgId, projectId, flagId, {
        name: data.name,
        description: data.description,
        enabled: data.defaultEnabled,
        rolloutPercent: data.rolloutPercent
      })
    } else {
      await createFlag(orgId, projectId, {
        name: data.name,
        key: data.key,
        description: data.description,
        type: data.type,
        rolloutPercent: data.rolloutPercent
      })
    }
    router.push(`/orgs/${orgSlug}/projects/${projectSlug}/flags`)
  }

  const handleDelete = async () => {
    if (!flagId) return
    const ok = await deleteFlag(orgId, projectId, flagId)
    if (ok) router.push(`/orgs/${orgSlug}/projects/${projectSlug}/flags`)
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="px-4 py-4 sm:px-8 sm:py-6"
      >
        <FlagFormHeader mode={mode} backHref={backHref} />

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-5">
          <GeneralInfoCard
            initialKeyTouched={mode === 'edit' || !!initialData?.key}
          />
          <ScheduleCard />
          <ConfigurationCard />
          <AutoRolloutCard />
        </div>

        {mode === 'edit' && (
          <div className="mt-3.5">
            <DangerZone
              title="Delete flag"
              description="Permanently delete this flag. This action cannot be undone."
              actionLabel="Delete flag"
              onAction={handleDelete}
            />
          </div>
        )}
      </form>
    </FormProvider>
  )
}
