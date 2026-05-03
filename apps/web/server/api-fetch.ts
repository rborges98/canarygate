import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { logServerError, logServerInfo, logServerWarn } from '@/lib/server-log'

const MAX_RETRIES = 2
const TIMEOUT_MS = 15_000
const SENSITIVE_QUERY_PARAMS = ['apiKey', 'token', 'e']

function redactSensitiveUrl(rawUrl: string) {
  try {
    const parsedUrl = new URL(rawUrl)
    const pathSegments = parsedUrl.pathname.split('/')

    parsedUrl.pathname = pathSegments
      .map((segment, index) => {
        if (pathSegments[index - 1] === 'invites' && segment) {
          return '[redacted]'
        }

        return segment
      })
      .join('/')

    for (const param of SENSITIVE_QUERY_PARAMS) {
      if (parsedUrl.searchParams.has(param)) {
        parsedUrl.searchParams.set(param, '[redacted]')
      }
    }

    return parsedUrl.toString()
  } catch {
    return rawUrl
      .replace(/(\/invites\/)[^/?]+/gi, '$1[redacted]')
      .replace(/([?&](?:apiKey|token|e)=)[^&]+/gi, '$1[redacted]')
  }
}

async function fetchWithCookie(
  url: string,
  init: RequestInit,
  cookieHeader: string
): Promise<Response> {
  return fetch(url, {
    ...init,
    signal:
      (init?.signal as AbortSignal | undefined) ??
      AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      ...(init?.headers as Record<string, string>),
      ...(cookieHeader ? { cookie: cookieHeader } : {})
    }
  })
}

export async function apiFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const method = init?.method ?? 'GET'
  const safeUrl = redactSensitiveUrl(url)
  const startedAt = Date.now()
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('better-auth.session_token')?.value
  const cookieHeader = sessionToken
    ? `better-auth.session_token=${sessionToken}`
    : ''

  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithCookie(url, init ?? {}, cookieHeader)
      const durationMs = Date.now() - startedAt
      const logContext = {
        method,
        url: safeUrl,
        status: res.status,
        durationMs,
        requestId: res.headers.get('x-request-id'),
        attempt: attempt + 1
      }

      if (res.ok) {
        logServerInfo('apiFetch concluido', logContext)
      }

      if (!res.ok) {
        if (res.status >= 500) {
          logServerError('apiFetch recebeu resposta 5xx', undefined, logContext)
        } else {
          logServerWarn('apiFetch recebeu resposta nao-ok', logContext)
        }
      }

      if (res.status === 401) {
        redirect('/login')
      }

      return res
    } catch (err) {
      lastError = err
      const isRetryable =
        err instanceof TypeError ||
        (err instanceof DOMException && err.name === 'TimeoutError')

      if (isRetryable && attempt < MAX_RETRIES) {
        logServerWarn('apiFetch vai tentar novamente', {
          method,
          url: safeUrl,
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          reason:
            err instanceof Error ? err.message : 'erro desconhecido de rede'
        })
      }

      if (!isRetryable || attempt === MAX_RETRIES) {
        break
      }

      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
    }
  }

  logServerError('apiFetch falhou apos esgotar retries', lastError, {
    method,
    url: safeUrl,
    attempts: MAX_RETRIES + 1,
    durationMs: Date.now() - startedAt
  })
  throw lastError
}
