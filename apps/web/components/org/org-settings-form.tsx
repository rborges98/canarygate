'use client'

import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { DangerZone } from '@/components/ui/danger-zone'
import { DangerZoneAction } from '@/components/ui/danger-zone-action'
import { updateOrg, deleteOrg } from '@/server/orgs/actions'

type Props = {
  orgId: string
  initialName: string
  initialSlug: string
}

type FormValues = {
  name: string
  slug: string
}

export function OrgSettingsForm({ orgId, initialName, initialSlug }: Props) {
  const router = useRouter()
  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<FormValues>({
    defaultValues: { name: initialName, slug: initialSlug }
  })

  const name = useWatch({ control, name: 'name' }) ?? ''

  async function onSubmit(data: FormValues) {
    const org = await updateOrg(orgId, { name: data.name, slug: data.slug })
    if (!org) {
      toast.error('Failed to save organization')
      return
    }

    toast.success('Organization saved')
    router.replace(`/orgs/${org.slug}/settings`)
    router.refresh()
  }

  const handleDelete = async () => {
    const ok = await deleteOrg(orgId)
    if (!ok) {
      toast.error('Failed to delete organization')
      return false
    }
    router.push('/orgs')
    return true
  }

  return (
    <div className="flex flex-col gap-4 px-8 py-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5"
      >
        <h3 className="mb-4 text-[13px] font-semibold text-white">General</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <div className="border-cg-indigo-600 bg-cg-indigo-950 text-cg-indigo-100 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-[22px] font-bold">
              {name[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <label className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]">
                Organization name
              </label>
              <input
                className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-100 focus:border-cg-indigo-300 w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none"
                {...register('name', { required: true })}
              />
            </div>
          </div>

          <div>
            <label className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]">
              Slug
            </label>
            <div className="border-cg-bg-100 flex overflow-hidden rounded-lg border">
              <span className="border-cg-bg-100 bg-cg-bg-200 text-cg-neutral-500 shrink-0 border-r px-3 py-2.5 font-mono text-[12px]">
                canarygate.com/
              </span>
              <input
                className="bg-cg-white-200 text-cg-indigo-100 flex-1 px-3 py-2.5 font-mono text-[12px] outline-none"
                {...register('slug', { required: true })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-cg-indigo-300 hover:bg-cg-indigo-400 self-start rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>

      <DangerZone>
        <DangerZoneAction
          title="Delete organization"
          description="Deleting this organization will permanently remove all projects, flags and members. This cannot be undone."
          actionLabel="Delete organization"
          confirmTitle="Delete organization?"
          confirmDescription="This permanently removes the organization, every project inside it, all feature flags and all member access. You will not be able to recover it later."
          confirmLabel="Delete organization"
          onAction={handleDelete}
        />
      </DangerZone>
    </div>
  )
}
