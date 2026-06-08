import Link from 'next/link'
import { Logo } from '@/components/logo'

type LandingNavProps = {
  transparent?: boolean
}

export function LandingNav({ transparent = false }: LandingNavProps) {
  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 flex items-center justify-between px-4 py-4 transition-all duration-300 sm:px-8 ${transparent ? '' : 'border-cg-bg-100 bg-background/80 border-b backdrop-blur-md'}`}
    >
      <Link href="/" className="flex items-center">
        <Logo />
      </Link>
      <nav className="flex items-center gap-6">
        <Link
          href="/docs"
          className="text-cg-neutral-300 hover:text-cg-neutral-100 text-sm transition-colors"
        >
          Docs
        </Link>
        <Link
          href="/docs/getting-started/quickstart"
          className="text-cg-neutral-300 hover:text-cg-neutral-100 text-sm transition-colors"
        >
          Pricing
        </Link>
        <Link
          href="/login"
          className="text-cg-neutral-300 hover:text-cg-neutral-100 text-sm transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/login"
          className="bg-cg-indigo-400 hover:bg-cg-indigo-300 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
        >
          Get started free
        </Link>
      </nav>
    </header>
  )
}
