import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function apiFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('better-auth.session_token')?.value
  const cookieHeader = sessionToken
    ? `better-auth.session_token=${sessionToken}`
    : ''
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string>),
      ...(cookieHeader ? { cookie: cookieHeader } : {})
    }
  })
  if (res.status === 401) redirect('/login')
  return res
}
