import { VerifyForm } from '@/components/auth/verify-form'
import { AuthCard } from '@/components/auth/auth-card'

type Props = {
  searchParams: Promise<{ e?: string }>
}

export default async function Page({ searchParams }: Props) {
  const { e } = await searchParams
  const email = e ? atob(e) : ''
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
      <AuthCard>
        <VerifyForm email={email} />
      </AuthCard>
    </div>
  )
}
