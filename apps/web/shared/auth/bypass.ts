function isLocalUrl(value: string | undefined) {
  if (!value) {
    return false
  }

  try {
    const url = new URL(value)
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

export function isLocalAuthBypassEnabled() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

  return (
    process.env.NODE_ENV === 'development' &&
    process.env.BYPASS_AUTH === 'true' &&
    isLocalUrl(appUrl) &&
    isLocalUrl(apiUrl)
  )
}
