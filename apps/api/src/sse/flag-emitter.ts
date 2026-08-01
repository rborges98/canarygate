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

// Rastreia o nome do ambiente (slug) de cada canal de forma segura em memória
export const channelSlugs = new Map<string, string>()

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
  projectId: string, // Representa o channelKey (projectId:environmentId)
  response: ServerResponse,
  metadata: { ip: string; apiKey: string; environmentSlug?: string }
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

  subscribers
    .get(projectId)!
    .add({ response, ip: metadata.ip, apiKey: metadata.apiKey })

  // Salva o slug do ambiente associado a este canal
  channelSlugs.set(projectId, metadata.environmentSlug || 'unknown')

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
    channelSlugs.delete(projectId) // Limpa o mapa de slugs para evitar vazamento de memória
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

export function getDetailedSseMetrics() {
  let totalConnections = 0

  // Agrupa os ambientes por projeto usando uma chave interna temporária em memória
  const projectGroupMap = new Map<
    string,
    Array<{ name: string; connections: number }>
  >()

  for (const [channelKey, projectSubscribers] of subscribers.entries()) {
    const connectionCount = projectSubscribers.size

    if (connectionCount > 0) {
      totalConnections += connectionCount

      const [projectId] = channelKey.split(':')
      if (!projectId) continue

      // Resgata o nome amigável do ambiente (dev, stg, prod) salvo no registro do canal
      const envName = channelSlugs.get(channelKey) || 'unknown'

      if (!projectGroupMap.has(projectId)) {
        projectGroupMap.set(projectId, [])
      }

      projectGroupMap.get(projectId)!.push({
        name: envName,
        connections: connectionCount
      })
    }
  }

  // Mapeia os dados para o formato final, omitindo totalmente os IDs dos projetos
  const projectsList = Array.from(projectGroupMap.values())
    .map((envs) => {
      // Ordena os ambientes internos colocando os que possuem mais tráfego no topo
      envs.sort((a, b) => b.connections - a.connections)
      const projectTotal = envs.reduce((sum, e) => sum + e.connections, 0)

      return {
        totalConnections: projectTotal,
        environments: envs
      }
    })
    // Ordena os blocos de projetos anônimos do mais pesado para o mais leve
    .sort((a, b) => b.totalConnections - a.totalConnections)

  return {
    totalConnections,
    totalActiveProjects: projectsList.length,
    projects: projectsList
  }
}
