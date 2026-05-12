import { redirect } from 'next/navigation'
import { BorderBeam } from '@/components/ui/border-beam'
import Header from '@/components/header'
import { getSession } from '@/shared/auth'
import { logServerWarn } from '@canarygate/logger'

export default async function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  let session: Awaited<ReturnType<typeof getSession>> = null

  try {
    session = await getSession()
  } catch (error) {
    logServerWarn('AuthLayout falhou ao carregar sessao', {
      routeGroup: '(login_layout)',
      reason: error instanceof Error ? error.message : 'unknown error'
    })
  }

  if (session) {
    redirect('/orgs')
  }

  return (
    <div className="bg-cg-bg-400 relative flex min-h-screen flex-col overflow-hidden md:flex-row">
      <div className="relative z-10 hidden w-105 shrink-0 flex-col justify-between px-14 py-14 md:flex">
        <Header />

        <div>
          <p className="mb-3 text-[30px] leading-tight font-extrabold tracking-tight text-white">
            Deploy on Friday.
            <br />
            <span className="text-cg-indigo-300">Sleep on Saturday.</span>
          </p>
          <span className="text-cg-neutral-300 font-sans text-[12px]">
            no more rollbacks
          </span>
        </div>

        <p className="text-cg-neutral-300 font-sans text-[10px]">
          canarygate.com · open source
        </p>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 md:px-12 md:py-14">
        <div className="mb-8 self-start text-[17px] font-bold text-white md:hidden">
          <Header />
        </div>

        <div className="w-full max-w-85">
          <div className="relative rounded-[18px] border p-6 md:p-8">
            <BorderBeam
              borderWidth={2}
              colorFrom="var(--color-cg-indigo-400)"
              colorTo="var(--color-cg-indigo-100)"
              size={200}
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
