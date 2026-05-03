'use client'

import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { DangerZone } from '@/components/ui/danger-zone'
import { DangerZoneAction } from '@/components/ui/danger-zone-action'
import { FlagFormHeader } from './flag-form-header'
import { GeneralInfoCard } from './general-info-card'
import { ConfigurationCard } from './configuration-card'
import { ScheduleCard } from './schedule-card'
import { AutoRolloutCard } from './auto-rollout-card'
import { EnvironmentReplicateCard } from './environment-replicate-card'
import { toast } from 'sonner'
import { updateFlag, deleteFlag, createFlag } from '@/server/flags/actions'
import type { FlagFormProps, FlagFormData } from './shared'
import { ENVIRONMENTS } from '@/shared/environments'

export type { FlagFormData } from './shared'

export function FlagForm({
  mode,
  orgId,
  projectId,
  orgSlug,
  projectSlug,
  environmentSlug,
  flagId,
  initialData
}: FlagFormProps) {
  const router = useRouter()

  const defaultEnvSlugs = ENVIRONMENTS.map((e) => e.slug)

  const methods = useForm<FlagFormData>({
    defaultValues: {
      name: initialData?.name ?? '',
      key: initialData?.key ?? '',
      description: initialData?.description ?? '',
      type: initialData?.type ?? 'boolean',
      defaultEnabled: initialData?.defaultEnabled ?? false,
      rolloutPercent: initialData?.rolloutPercent ?? 25,
      replicateToAll: true,
      environmentSlugs: defaultEnvSlugs,
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
    try {
      if (mode === 'edit' && flagId) {
        const res = await updateFlag(
          orgId,
          projectId,
          flagId,
          {
            name: data.name,
            description: data.description,
            enabled: data.defaultEnabled,
            rolloutPercent: data.rolloutPercent,
            scheduleEnabled: data.scheduleEnabled,
            scheduleDate: data.scheduleEnabled ? data.scheduleDate : null,
            scheduleAction: data.scheduleAction,
            scheduleRolloutPercent: data.scheduleRolloutPercent,
            autoRolloutEnabled: data.autoRolloutEnabled,
            autoRolloutIncreaseBy: data.increaseBy,
            autoRolloutEveryValue: data.everyValue,
            autoRolloutEveryUnit: data.everyUnit,
            autoRolloutUntilMax: data.untilMax
          },
          environmentSlug
        )
        if (!res) {
          toast.error('Something went wrong')
          return
        }
        toast.success('Flag saved')
      } else {
        if (!data.replicateToAll && data.environmentSlugs.length === 0) {
          toast.error('Select at least one environment')
          return
        }
        const targetEnvs = data.replicateToAll
          ? undefined
          : data.environmentSlugs
        const res = await createFlag(orgId, projectId, {
          name: data.name,
          key: data.key,
          description: data.description,
          type: data.type,
          enabled: data.defaultEnabled,
          rolloutPercent: data.rolloutPercent,
          scheduleEnabled: data.scheduleEnabled,
          scheduleDate: data.scheduleEnabled ? data.scheduleDate : null,
          scheduleAction: data.scheduleAction,
          scheduleRolloutPercent: data.scheduleRolloutPercent,
          autoRolloutEnabled: data.autoRolloutEnabled,
          autoRolloutIncreaseBy: data.increaseBy,
          autoRolloutEveryValue: data.everyValue,
          autoRolloutEveryUnit: data.everyUnit,
          autoRolloutUntilMax: data.untilMax,
          environments: targetEnvs
        })
        if (!res) {
          toast.error('Something went wrong')
          return
        }
        toast.success('Flag created')
      }
      router.push(`/orgs/${orgSlug}/projects/${projectSlug}/flags`)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong')
    }
  }

  const handleDelete = async () => {
    if (!flagId) {
      return false
    }

    const ok = await deleteFlag(orgId, projectId, flagId)
    if (!ok) {
      toast.error('Failed to delete flag')
      return false
    }
    router.push(`/orgs/${orgSlug}/projects/${projectSlug}/flags`)
    return true
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

        {mode === 'new' && (
          <div className="mt-3.5">
            <EnvironmentReplicateCard />
          </div>
        )}

        {mode === 'edit' && (
          <div className="mt-3.5">
            <DangerZone>
              <DangerZoneAction
                title="Delete flag"
                description="Permanently delete this flag. This action cannot be undone."
                actionLabel="Delete flag"
                confirmTitle="Delete flag?"
                confirmDescription="This permanently removes the flag configuration, rollout rules and change history tied to it. You will not be able to recover it later."
                confirmLabel="Delete flag"
                onAction={handleDelete}
              />
            </DangerZone>
          </div>
        )}
      </form>
    </FormProvider>
  )
}
