import Link from 'next/link'
import { Logo } from '@/components/logo'

export function LandingFooter() {
  return (
    <footer className="border-cg-bg-100 bg-background border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="text-cg-neutral-400 max-w-xs text-sm">
              Feature flags for teams that want simplicity, control, and lower
              cost.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-3">
              <span className="text-cg-neutral-500 text-xs font-semibold tracking-wider uppercase">
                Product
              </span>
              <Link
                href="/docs"
                className="text-cg-neutral-400 hover:text-cg-neutral-100 text-sm transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/docs/getting-started/quickstart"
                className="text-cg-neutral-400 hover:text-cg-neutral-100 text-sm transition-colors"
              >
                Quickstart
              </Link>
              <Link
                href="/docs/sdk/javascript"
                className="text-cg-neutral-400 hover:text-cg-neutral-100 text-sm transition-colors"
              >
                SDK
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-cg-neutral-500 text-xs font-semibold tracking-wider uppercase">
                Company
              </span>
              <Link
                href="/login"
                className="text-cg-neutral-400 hover:text-cg-neutral-100 text-sm transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="text-cg-neutral-400 hover:text-cg-neutral-100 text-sm transition-colors"
              >
                Sign up
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-cg-neutral-500 text-xs font-semibold tracking-wider uppercase">
                Resources
              </span>
              <Link
                href="/docs/api-reference"
                className="text-cg-neutral-400 hover:text-cg-neutral-100 text-sm transition-colors"
              >
                API Reference
              </Link>
              <Link
                href="/docs/concepts"
                className="text-cg-neutral-400 hover:text-cg-neutral-100 text-sm transition-colors"
              >
                Concepts
              </Link>
            </div>
          </div>
        </div>
        <div className="border-cg-bg-100 mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-cg-neutral-600 text-xs">
            © {new Date().getFullYear()} CanaryGate. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-cg-neutral-600 hover:text-cg-neutral-400 text-xs transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-cg-neutral-600 hover:text-cg-neutral-400 text-xs transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
