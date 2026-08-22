import { redirect, unstable_rethrow } from 'next/navigation'
import { getSession } from '@/shared/auth'
import { logServerWarn } from '@canarygate/logger'
import GradientWaves from '@/components/patterns/GradientWaves'

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  let session: Awaited<ReturnType<typeof getSession>> = null

  try {
    session = await getSession()
  } catch (error) {
    unstable_rethrow(error)

    logServerWarn('AuthLayout falhou ao carregar sessao', {
      routeGroup: '(login_layout)',
      reason: error instanceof Error ? error.message : 'unknown error'
    })
  }

  if (session) {
    redirect('/orgs')
  }

  return (
    <div className="bg-cg-bg-400 relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <GradientWaves />
      </div>
      {children}
    </div>
  )
}
