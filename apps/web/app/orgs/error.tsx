'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { BorderBeam } from '@/components/ui/border-beam'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function OrgsError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="bg-cg-bg-400 relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_70%)]" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-10 md:px-12 md:py-14">
        <div className="w-full max-w-2xl">
          <div className="relative rounded-3xl border p-8 text-center md:p-10">
            <BorderBeam
              borderWidth={2}
              colorFrom="var(--color-cg-indigo-400)"
              colorTo="var(--color-cg-indigo-100)"
              size={220}
            />

            <span className="bg-cg-indigo-950 text-cg-indigo-100 border-cg-indigo-600 mb-5 inline-flex rounded-full border px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.18em] uppercase">
              Route error
            </span>

            <h1 className="mb-3 text-[28px] font-extrabold tracking-tight text-white md:text-[34px]">
              We couldn&apos;t load this area.
            </h1>

            <p className="text-cg-neutral-300 mx-auto mb-8 max-w-lg text-[13px] leading-6 md:text-[14px]">
              A request or server render failed while opening this section. You
              can retry this route now or go back to the organizations list.
            </p>

            {process.env.NODE_ENV === 'development' && error.message ? (
              <p className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-300 mb-8 rounded-xl border px-4 py-3 text-left font-mono text-[11px] leading-5">
                {error.message}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => reset()}
                className="bg-cg-indigo-400 hover:bg-cg-indigo-300 rounded-lg px-5 py-3 text-[13px] font-semibold text-white transition-colors"
              >
                Try again
              </button>
              <Link
                href="/orgs"
                className="border-cg-bg-100 text-cg-neutral-200 hover:bg-cg-white-200 rounded-lg border px-5 py-3 text-[13px] font-semibold transition-colors"
              >
                Go to organizations
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
