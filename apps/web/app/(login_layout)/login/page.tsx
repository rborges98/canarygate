import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { AuthCard } from '@/components/auth/auth-card'
import { Logo } from '@/components/branding/logo'

export default function Page() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10 md:px-12 md:py-14">
      <Link href="/" aria-label="CanaryGate home" className="mb-8">
        <Logo className="text-2xl" />
      </Link>

      <AuthCard>
        <LoginForm />
      </AuthCard>
    </div>
  )
}
