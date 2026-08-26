import Link from 'next/link'
import { Logo } from '@/components/branding/logo'

type LandingNavProps = {
  transparent?: boolean
}

export function LandingNav({ transparent = false }: LandingNavProps) {
  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        transparent
          ? ''
          : 'border-cg-bg-100 bg-background/80 border-b backdrop-blur-md'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="focus-visible:ring-cg-indigo-300 flex items-center rounded-lg focus-visible:ring-2"
        >
          <Logo />
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-6">
          <Link
            href="/docs"
            className="text-cg-neutral-300 hover:text-cg-neutral-100 focus-visible:ring-cg-indigo-300 hidden text-sm transition-colors focus-visible:ring-2 md:block"
          >
            Docs
          </Link>
          <Link
            href="/login"
            className="bg-cg-indigo-400 hover:bg-cg-indigo-300 focus-visible:ring-cg-indigo-300 inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors focus-visible:ring-2 sm:px-4 sm:py-2"
          >
            Get started free
          </Link>
        </nav>
      </div>
    </header>
  )
}
