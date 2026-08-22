'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { DangerZone } from '@/components/patterns/danger-zone'
import { DangerZoneAction } from '@/components/patterns/danger-zone-action'
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
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [apiKeyRevealed, setApiKeyRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  async function onSaveGeneral(data: GeneralFormValues) {
    const res = await updateProject(orgId, projectId, {
      name: data.name,
      slug: data.slug
    })
    if (!res.ok) {
      toast.error(res.message ?? 'Failed to save project')
      return
    }
    toast.success('Project saved')
    router.refresh()
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    const res = await regenerateApiKey(orgId, projectId)
    setIsRegenerating(false)
    if (res.ok) {
      setApiKey(res.data)
      setApiKeyRevealed(true)
      toast.success('API key regenerated')
    } else {
      toast.error(res.message ?? 'Failed to regenerate API key')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function onSaveWebhook(data: WebhookFormValues) {
    const res = await updateWebhook(orgId, projectId, data.webhookUrl || null)
    if (!res.ok) {
      toast.error(res.message ?? 'Failed to save webhook')
      return
    }
    toast.success('Webhook saved')
  }

  const handleDelete = async () => {
    const res = await deleteProject(orgId, projectId)
    if (!res.ok) {
      toast.error(res.message ?? 'Failed to delete project')
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
    const res = await toggleProjectActive(orgId, projectId)
    setIsTogglePending(false)

    if (!res.ok) {
      toast.error(res.message ?? 'Failed to update project status')
      return false
    }

    setIsActive(res.data.active)
    toast.success(res.data.active ? 'Project reactivated' : 'Project deactivated')
    router.refresh()
    return true
  }

  const maskedKey = '••••••••••••••••••••••••••••••••'
  const hasKey = apiKey.length > 0
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
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-8">
      <form
        onSubmit={generalForm.handleSubmit(onSaveGeneral)}
        className="border-cg-bg-100 bg-cg-white-300 rounded-xl border p-5"
      >
        <h3 className="mb-4 text-[13px] font-semibold text-white">General</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="project-settings-name"
              className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]"
            >
              Name
            </label>
            <input
              id="project-settings-name"
              className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-100 focus:border-cg-indigo-300 focus-visible:ring-cg-indigo-300 w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none focus-visible:ring-2"
              {...generalForm.register('name', { required: true })}
            />
          </div>
          <div>
            <label
              htmlFor="project-settings-slug"
              className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]"
            >
              Slug
            </label>
            <div className="border-cg-bg-100 flex overflow-hidden rounded-lg border">
              <span className="border-cg-bg-100 bg-cg-bg-200 text-cg-neutral-500 max-w-[40%] shrink-0 truncate border-r px-3 py-2.5 font-mono text-[12px]">
                {orgSlug}/
              </span>
              <input
                id="project-settings-slug"
                className="bg-cg-white-200 text-cg-indigo-100 min-w-0 flex-1 px-3 py-2.5 font-mono text-[12px] outline-none focus-visible:border-cg-indigo-300 focus-visible:ring-cg-indigo-300 focus-visible:ring-2"
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
            {hasKey && apiKeyRevealed ? apiKey : maskedKey}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!hasKey}
              title={hasKey ? undefined : 'Regenerate the key to get a new one'}
              className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-300 flex-1 rounded-lg border px-3 py-2.5 text-[12px] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-cg-neutral-300 sm:flex-none"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={() => setApiKeyRevealed((v) => !v)}
              disabled={!hasKey}
              title={hasKey ? undefined : 'Regenerate the key to get a new one'}
              className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-300 flex-1 rounded-lg border px-3 py-2.5 text-[12px] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-cg-neutral-300 sm:flex-none"
            >
              {apiKeyRevealed ? 'Hide' : 'Reveal'}
            </button>
          </div>
        </div>
        {!hasKey && (
          <p className="text-cg-neutral-500 mt-2 text-[11px]">
            For security, your key is only shown right after it is generated.
            Regenerate it to get a new one.
          </p>
        )}
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="text-cg-neutral-500 hover:text-cg-neutral-300 mt-3 font-sans text-[11px] transition-colors disabled:opacity-50"
        >
          {isRegenerating ? 'Regenerating...' : '↻ Regenerate key'}
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
        <label
          htmlFor="project-settings-webhook-url"
          className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]"
        >
          Webhook URL
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="project-settings-webhook-url"
            className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-500 focus:border-cg-indigo-300 focus:text-cg-neutral-100 focus-visible:ring-cg-indigo-300 w-full min-w-0 rounded-lg border px-4 py-2.5 font-mono text-[12px] outline-none focus-visible:ring-2 sm:flex-1"
            placeholder="https://your-app.com/webhook"
            {...webhookForm.register('webhookUrl')}
          />
          <button
            type="submit"
            disabled={webhookForm.formState.isSubmitting}
            className="bg-cg-indigo-300 hover:bg-cg-indigo-400 w-full rounded-lg px-3 py-2.5 text-[12px] font-semibold text-white transition-colors disabled:opacity-50 sm:w-auto"
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
