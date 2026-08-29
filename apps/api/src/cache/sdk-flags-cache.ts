import { createRedisConnection } from '@canarygate/redis'

const SNAPSHOT_TTL_SECONDS = 60

const cache = createRedisConnection('api sdk flags cache', {
  connectionName: 'api-sdk-flags-cache',
  lazyConnect: true,
  enableOfflineQueue: false
})

cache.on('error', () => {
  // Redis unavailable: commands fail fast and the SDK falls back to the DB.
})

export function buildFlagSnapshotCacheKey(
  projectId: string,
  environmentId: string
) {
  return `sdk:snapshot:${projectId}:${environmentId}`
}

export async function getFlagSnapshot(
  projectId: string,
  environmentId: string
): Promise<string | null> {
  try {
    return await cache.get(buildFlagSnapshotCacheKey(projectId, environmentId))
  } catch (error) {
    console.error(
      `[api sdk flags cache] Failed to read snapshot for ${projectId}/${environmentId}:`,
      error
    )
    return null
  }
}

export async function setFlagSnapshot(
  projectId: string,
  environmentId: string,
  payload: string
): Promise<void> {
  try {
    await cache.set(
      buildFlagSnapshotCacheKey(projectId, environmentId),
      payload,
      'EX',
      SNAPSHOT_TTL_SECONDS
    )
  } catch (error) {
    console.error(
      `[api sdk flags cache] Failed to write snapshot for ${projectId}/${environmentId}:`,
      error
    )
  }
}

export async function invalidateFlagSnapshot(
  projectId: string,
  environmentId: string
): Promise<void> {
  try {
    await cache.del(buildFlagSnapshotCacheKey(projectId, environmentId))
  } catch (error) {
    console.error(
      `[api sdk flags cache] Failed to invalidate snapshot for ${projectId}/${environmentId}:`,
      error
    )
  }
}

export async function stopFlagSnapshotCache(): Promise<void> {
  await cache.quit().catch(() => {})
}
