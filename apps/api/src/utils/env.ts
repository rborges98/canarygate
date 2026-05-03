export const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export function getRequiredEnv(name: string, scope: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`[${scope}] Missing required env var: ${name}`)
  }

  return value
}

export function getRequiredUrl(
  name: string,
  developmentFallback: string,
  scope: string
) {
  const value = process.env[name]
  if (value) {
    return value
  }

  if (!IS_PRODUCTION) {
    return developmentFallback
  }

  throw new Error(`[${scope}] Missing required env var: ${name}`)
}
