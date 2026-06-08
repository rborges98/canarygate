'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { DangerZone } from '@/components/danger-zone'
import { DangerZoneAction } from '@/components/danger-zone-action'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import {
  updateProject,
  deleteProject,
  toggleProjectActive,
  regenerateApiKey,
  updateWebhook
} from '@/server/projects/actions'

type Props = {
  orgId: string
  projectId: string
  orgSlug: string
  initialName: string
  initialSlug: string
  initialActive: boolean
  initialApiKey: string
  initialWebhookUrl: string
}

type GeneralFormValues = {
  name: string
  slug: string
}

type WebhookFormValues = {
  webhookUrl: string
}

export function ProjectSettingsForm({
  orgId,
  projectId,
  orgSlug,
  initialName,
  initialSlug,
  initialActive,
  initialApiKey,
  initialWebhookUrl
}: Props) {
  const router = useRouter()

  const generalForm = useForm<GeneralFormValues>({
    defaultValues: { name: initialName, slug: initialSlug }
  })
  const webhookForm = useForm<WebhookFormValues>({
    defaultValues: { webhookUrl: initialWebhookUrl }
  })

  const [apiKey, setApiKey] = useState(initialApiKey)
  const [isActive, setIsActive] = useState(initialActive)
  const [isTogglePending, setIsTogglePending] = useState(false)
  const [apiKeyRevealed, setApiKeyRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  async function onSaveGeneral(data: GeneralFormValues) {
    const ok = await updateProject(orgId, projectId, {
      name: data.name,
      slug: data.slug
    })
    if (!ok) {
      toast.error('Failed to save project')
      return
    }
    toast.success('Project saved')
    router.refresh()
  }

  const handleRegenerate = async () => {
    const newKey = await regenerateApiKey(orgId, projectId)
    if (newKey) {
      setApiKey(newKey)
      setApiKeyRevealed(true)
      toast.success('API key regenerated')
    } else {
      toast.error('Failed to regenerate API key')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function onSaveWebhook(data: WebhookFormValues) {
    const ok = await updateWebhook(orgId, projectId, data.webhookUrl || null)
    if (!ok) {
      toast.error('Failed to save webhook')
      return
    }
    toast.success('Webhook saved')
  }

  const handleDelete = async () => {
    const ok = await deleteProject(orgId, projectId)
    if (!ok) {
      toast.error('Failed to delete project')
      return false
    }
    router.push(`/orgs/${orgSlug}/projects`)
    return true
  }

  const handleToggleActive = async () => {
    if (isTogglePending) {
      return false
    }

    setIsTogglePending(true)
    const nextProjectState = await toggleProjectActive(orgId, projectId)
    setIsTogglePending(false)

    if (!nextProjectState) {
      toast.error('Failed to update project status')
      return false
    }

    setIsActive(nextProjectState.active)
    toast.success(
      nextProjectState.active ? 'Project reactivated' : 'Project deactivated'
    )
    router.refresh()
    return true
  }

  const maskedKey = '••••••••••••••••••••••••••••••••'
  let toggleActionTitle = 'Reactivate project'
  let toggleActionDescription =
    'Restore this project to the regular project list for all members with access.'
  let toggleActionLabel = 'Reactivate project'
  let toggleConfirmTitle = 'Reactivate project?'
  let toggleConfirmDescription =
    'This will make the project visible again to every member who already has access to it.'
  let toggleConfirmLabel = 'Reactivate project'

  if (isActive) {
    toggleActionTitle = 'Deactivate project'
    toggleActionDescription =
      'Inactive projects are hidden from regular members. Project admins and org owners can still access them.'
    toggleActionLabel = 'Deactivate project'
    toggleConfirmTitle = 'Deactivate project?'
    toggleConfirmDescription =
      'Regular members will stop seeing this project in the project list. Project admins and org owners will still be able to access it.'
    toggleConfirmLabel = 'Deactivate project'
  }

  if (isTogglePending) {
    toggleActionLabel = 'Updating...'
  }

  return (
    <div className="flex flex-col gap-4 px-8 py-6">
      <form
        onSubmit={generalForm.handleSubmit(onSaveGeneral)}
        className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5"
      >
        <h3 className="mb-4 text-[13px] font-semibold text-white">General</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]">
              Name
            </label>
            <input
              className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-100 focus:border-cg-indigo-300 w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none"
              {...generalForm.register('name', { required: true })}
            />
          </div>
          <div>
            <label className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]">
              Slug
            </label>
            <div className="border-cg-bg-100 flex overflow-hidden rounded-lg border">
              <span className="border-cg-bg-100 bg-cg-bg-200 text-cg-neutral-500 shrink-0 border-r px-3 py-2.5 font-mono text-[12px]">
                {orgSlug}/
              </span>
              <input
                className="bg-cg-white-200 text-cg-indigo-100 flex-1 px-3 py-2.5 font-mono text-[12px] outline-none"
                {...generalForm.register('slug', { required: true })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={generalForm.formState.isSubmitting}
            className="bg-cg-indigo-300 hover:bg-cg-indigo-400 self-start rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-colors disabled:opacity-50"
          >
            {generalForm.formState.isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5">
        <h3 className="mb-1 text-[13px] font-semibold text-white">API Key</h3>
        <p className="text-cg-neutral-300 mb-4 text-[11px]">
          Use this key to authenticate requests from your SDK.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="border-cg-bg-100 bg-cg-white-200 text-cg-indigo-100 min-w-0 flex-1 truncate rounded-lg border px-4 py-2.5 font-mono text-[12px]">
            {apiKeyRevealed ? apiKey : maskedKey}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-300 flex-1 rounded-lg border px-3 py-2.5 text-[12px] transition-colors hover:text-white sm:flex-none"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => setApiKeyRevealed((v) => !v)}
              className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-300 flex-1 rounded-lg border px-3 py-2.5 text-[12px] transition-colors hover:text-white sm:flex-none"
            >
              {apiKeyRevealed ? 'Hide' : 'Reveal'}
            </button>
          </div>
        </div>
        <button
          onClick={handleRegenerate}
          className="text-cg-neutral-500 hover:text-cg-neutral-300 mt-3 font-sans text-[11px] transition-colors"
        >
          ↻ Regenerate key
        </button>
      </div>

      <form
        onSubmit={webhookForm.handleSubmit(onSaveWebhook)}
        className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5"
      >
        <h3 className="mb-1 text-[13px] font-semibold text-white">Webhook</h3>
        <p className="text-cg-neutral-300 mb-4 text-[11px]">
          Receive a POST request when a flag changes.
        </p>
        <div className="flex items-center gap-2">
          <input
            className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-500 focus:border-cg-indigo-300 focus:text-cg-neutral-100 flex-1 rounded-lg border px-4 py-2.5 font-mono text-[12px] outline-none"
            placeholder="https://your-app.com/webhook"
            {...webhookForm.register('webhookUrl')}
          />
          <button
            type="submit"
            disabled={webhookForm.formState.isSubmitting}
            className="bg-cg-indigo-300 hover:bg-cg-indigo-400 rounded-lg px-3 py-2.5 text-[12px] font-semibold text-white transition-colors disabled:opacity-50"
          >
            {webhookForm.formState.isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <DangerZone>
          <DangerZoneAction
            title={toggleActionTitle}
            description={toggleActionDescription}
            actionLabel={toggleActionLabel}
            confirmTitle={toggleConfirmTitle}
            confirmDescription={toggleConfirmDescription}
            confirmLabel={toggleConfirmLabel}
            isPending={isTogglePending}
            onAction={handleToggleActive}
          />

          <DangerZoneAction
            title="Delete project"
            description="Permanently delete this project and all of its flags. This action cannot be undone."
            actionLabel="Delete project"
            confirmTitle="Delete project?"
            confirmDescription="This permanently removes the project, its flags and related history. You will not be able to recover it later."
            confirmLabel="Delete project"
            onAction={handleDelete}
          />
        </DangerZone>
      </div>
    </div>
  )
}
