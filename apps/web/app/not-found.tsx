import Link from 'next/link'
import Header from '@/components/header'
import { BorderBeam } from '@/components/ui/border-beam'

export default function NotFound() {
  return (
    <div className="bg-cg-bg-400 relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_70%)]" />

      <Header
        right={
          <Link
            href="/login"
            className="text-cg-neutral-300 text-[12px] font-medium transition-colors hover:text-white"
          >
            Sign in
          </Link>
        }
      />

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10 md:px-12 md:py-14">
        <div className="w-full max-w-2xl">
          <div className="relative rounded-3xl border p-8 text-center md:p-10">
            <BorderBeam
              borderWidth={2}
              colorFrom="var(--color-cg-indigo-400)"
              colorTo="var(--color-cg-indigo-100)"
              size={220}
            />

            <span className="bg-cg-indigo-950 text-cg-indigo-100 border-cg-indigo-600 mb-5 inline-flex rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
              404
            </span>

            <h1 className="mb-3 text-[28px] font-extrabold tracking-tight text-white md:text-[34px]">
              This page slipped past the gate.
            </h1>

            <p className="text-cg-neutral-300 mx-auto mb-8 max-w-lg text-[13px] leading-6 md:text-[14px]">
              The URL may be wrong, the resource may no longer exist, or you may
              need to sign in before opening this area.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/login"
                className="bg-cg-indigo-400 hover:bg-cg-indigo-300 rounded-lg px-5 py-3 text-[13px] font-semibold text-white transition-colors"
              >
                Go to login
              </Link>
              <Link
                href="/"
                className="border-cg-bg-100 text-cg-neutral-200 hover:bg-cg-white-200 rounded-lg border px-5 py-3 text-[13px] font-semibold transition-colors"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
