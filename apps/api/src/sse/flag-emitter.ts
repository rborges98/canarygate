import type { ServerResponse } from 'node:http'
import { createLogger } from '@canarygate/logger'

type Subscriber = {
  response: ServerResponse
  ip: string
  apiKey: string
  channelKey: string
  queue: string[]
  onDrain: (() => void) | null
}

const DEFAULT_MAX_CONNECTIONS_PER_IP = 10
const DEFAULT_MAX_CONNECTIONS_PER_API_KEY = 25
const MAX_QUEUED_EVENTS = 64

const log = createLogger({ service: 'canarygate-api' })

const subscribers = new Map<string, Set<Subscriber>>()
const connectionCountsByIp = new Map<string, number>()
const connectionCountsByApiKey = new Map<string, number>()

const parsedMaxConnectionsPerIp = Number.parseInt(
  process.env.SSE_MAX_CONNECTIONS_PER_IP ?? '',
  10
)
let maxConnectionsPerIp = DEFAULT_MAX_CONNECTIONS_PER_IP
if (
  Number.isInteger(parsedMaxConnectionsPerIp) &&
  parsedMaxConnectionsPerIp > 0
) {
  maxConnectionsPerIp = parsedMaxConnectionsPerIp
}

const parsedMaxConnectionsPerApiKey = Number.parseInt(
  process.env.SSE_MAX_CONNECTIONS_PER_API_KEY ?? '',
  10
)
let maxConnectionsPerApiKey = DEFAULT_MAX_CONNECTIONS_PER_API_KEY
if (
  Number.isInteger(parsedMaxConnectionsPerApiKey) &&
  parsedMaxConnectionsPerApiKey > 0
) {
  maxConnectionsPerApiKey = parsedMaxConnectionsPerApiKey
}

function incrementCount(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) ?? 0) + 1)
}

function decrementCount(counts: Map<string, number>, key: string) {
  const nextCount = (counts.get(key) ?? 0) - 1
  if (nextCount > 0) {
    counts.set(key, nextCount)
    return
  }

  counts.delete(key)
}

export function subscribe(
  projectId: string,
  response: ServerResponse,
  metadata: { ip: string; apiKey: string }
): { ok: true } | { ok: false; message: string } {
  if ((connectionCountsByIp.get(metadata.ip) ?? 0) >= maxConnectionsPerIp) {
    return {
      ok: false,
      message: 'Too many SSE connections from this IP address'
    }
  }

  if (
    (connectionCountsByApiKey.get(metadata.apiKey) ?? 0) >=
    maxConnectionsPerApiKey
  ) {
    return {
      ok: false,
      message: 'Too many SSE connections for this API key'
    }
  }

  if (!subscribers.has(projectId)) {
    subscribers.set(projectId, new Set())
  }

  subscribers.get(projectId)!.add({
    response,
    ip: metadata.ip,
    apiKey: metadata.apiKey,
    channelKey: projectId,
    queue: [],
    onDrain: null
  })

  incrementCount(connectionCountsByIp, metadata.ip)
  incrementCount(connectionCountsByApiKey, metadata.apiKey)

  return { ok: true }
}

export function unsubscribe(projectId: string, response: ServerResponse): void {
  const projectSubscribers = subscribers.get(projectId)
  if (!projectSubscribers) {
    return
  }

  for (const subscriber of projectSubscribers) {
    if (subscriber.response !== response) {
      continue
    }

    if (subscriber.onDrain) {
      subscriber.response.removeListener('drain', subscriber.onDrain)
      subscriber.onDrain = null
    }
    subscriber.queue = []

    projectSubscribers.delete(subscriber)
    decrementCount(connectionCountsByIp, subscriber.ip)
    decrementCount(connectionCountsByApiKey, subscriber.apiKey)
    break
  }

  if (projectSubscribers.size === 0) {
    subscribers.delete(projectId)
  }
}

function flushQueuedEvents(subscriber: Subscriber) {
  while (subscriber.queue.length > 0) {
    try {
      if (subscriber.response.write(subscriber.queue[0]) === false) {
        return
      }
    } catch {
      unsubscribe(subscriber.channelKey, subscriber.response)
      return
    }
    subscriber.queue.shift()
  }

  if (subscriber.onDrain) {
    subscriber.response.removeListener('drain', subscriber.onDrain)
    subscriber.onDrain = null
  }
}

export function emitFlagEvent(
  projectId: string,
  event: string,
  data: unknown
): void {
  const subs = subscribers.get(projectId)
  if (!subs || subs.size === 0) {
    return
  }

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const subscriber of subs) {
    if (subscriber.onDrain !== null) {
      if (subscriber.queue.length >= MAX_QUEUED_EVENTS) {
        log.info(
          { scope: 'sse.flagEmitter.backpressure', ip: subscriber.ip },
          'Closing SSE subscriber: queued events exceeded the cap'
        )
        unsubscribe(projectId, subscriber.response)
        continue
      }

      subscriber.queue.push(payload)
      continue
    }

    try {
      if (subscriber.response.write(payload) === false) {
        subscriber.queue.push(payload)
        subscriber.onDrain = () => {
          flushQueuedEvents(subscriber)
        }
        subscriber.response.on('drain', subscriber.onDrain)
      }
    } catch {
      unsubscribe(projectId, subscriber.response)
    }
  }
}

export function disconnectByApiKey(apiKey: string): number {
  const matches: Array<{ channelKey: string; response: ServerResponse }> = []

  for (const [channelKey, projectSubscribers] of subscribers.entries()) {
    for (const subscriber of projectSubscribers) {
      if (subscriber.apiKey === apiKey) {
        matches.push({ channelKey, response: subscriber.response })
      }
    }
  }

  for (const { channelKey, response } of matches) {
    unsubscribe(channelKey, response)
    if (!response.destroyed && !response.writableEnded) {
      response.end()
    }
  }

  return matches.length
}
