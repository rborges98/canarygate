import type { ServerResponse } from 'node:http'

type Subscriber = {
  response: ServerResponse
  ip: string
  apiKey: string
}

const DEFAULT_MAX_CONNECTIONS_PER_IP = 10
const DEFAULT_MAX_CONNECTIONS_PER_API_KEY = 25

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

  subscribers.get(projectId)!.add({ response, ...metadata })
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

    projectSubscribers.delete(subscriber)
    decrementCount(connectionCountsByIp, subscriber.ip)
    decrementCount(connectionCountsByApiKey, subscriber.apiKey)
    break
  }

  if (projectSubscribers.size === 0) {
    subscribers.delete(projectId)
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
    try {
      subscriber.response.write(payload)
    } catch {
      unsubscribe(projectId, subscriber.response)
    }
  }
}
