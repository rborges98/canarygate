import { createHmac } from 'node:crypto'
import type { FastifyBaseLogger } from 'fastify'
import { getQStashClient } from '../utils/webhook.ts'
import { assertPublicWebhookTarget } from '../utils/ssrf.ts'

export type WebhookEventType =
  | 'flag.created'
  | 'flag.updated'
  | 'flag.toggled'
  | 'flag.rollout_updated'
  | 'flag.deleted'

export type WebhookProject = {
  id: string
  slug: string
  webhookUrl: string | null
  webhookSecret: string | null
}

export type WebhookPayloadInput = {
  project: WebhookProject
  flag: {
    key: string
    name: string
    type: string
    enabled: boolean
    rolloutPercent: number | null
    updatedAt: Date | string
  }
  environment: { slug: string }
  actorEmail?: string | null
}

export function buildWebhookPayload(
  event: WebhookEventType,
  input: WebhookPayloadInput
) {
  return {
    event,
    projectId: input.project.id,
    projectSlug: input.project.slug,
    flag: {
      key: input.flag.key,
      name: input.flag.name,
      type: input.flag.type,
      enabled: input.flag.enabled,
      rolloutPercent: input.flag.rolloutPercent,
      updatedAt: new Date(input.flag.updatedAt).toISOString()
    },
    environment: { slug: input.environment.slug },
    timestamp: new Date().toISOString(),
    ...(input.actorEmail ? { actorEmail: input.actorEmail } : {})
  }
}

export async function deliverFlagWebhook(
  event: WebhookEventType,
  webhookProject: WebhookProject | null,
  flag: WebhookPayloadInput['flag'],
  environment: { slug: string },
  log: FastifyBaseLogger,
  actorEmail?: string | null
): Promise<void> {
  if (!webhookProject) {
    return
  }

  await dispatchWebhookDelivery(
    webhookProject,
    buildWebhookPayload(event, {
      project: webhookProject,
      flag,
      environment,
      actorEmail
    }),
    log
  )
}

export async function dispatchWebhookDelivery(
  project: WebhookProject,
  payload: object,
  log: FastifyBaseLogger
): Promise<boolean> {
  if (!project.webhookUrl || !project.webhookSecret) {
    return false
  }

  try {
    const targetCheck = await assertPublicWebhookTarget(project.webhookUrl)
    if (!targetCheck.ok) {
      log.error(
        {
          scope: 'webhook.delivery',
          projectId: project.id,
          reason: targetCheck.reason
        },
        'Blocked webhook delivery: target is not a public endpoint'
      )
      return false
    }

    const body = JSON.stringify(payload)
    const signature = createHmac('sha256', project.webhookSecret)
      .update(body)
      .digest('hex')

    await getQStashClient().publishJSON({
      url: project.webhookUrl,
      body: payload,
      headers: {
        'content-type': 'application/json',
        'x-canarygate-signature': `sha256=${signature}`
      },
      retries: 3
    })

    return true
  } catch (error) {
    log.error(
      {
        err: error,
        scope: 'webhook.delivery',
        projectId: project.id
      },
      'Failed to dispatch webhook delivery'
    )
    return false
  }
}