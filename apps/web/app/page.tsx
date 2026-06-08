import { LandingNav } from '@/components/home/nav'
import { LandingFooter } from '@/components/home/footer'
import { V2Hero } from '@/components/home/hero'
import { V2InteractiveTabs } from '@/components/home/interactive-tabs'
import { V2Steps } from '@/components/home/steps'
import { V2Pricing } from '@/components/home/pricing'

export default function HomePage() {
  return (
    <main className="bg-background text-cg-neutral-100">
      <LandingNav />

      <div className="pt-20">
        <V2Hero />
      </div>

      <div className="border-cg-bg-100 border-y">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {(
              [
                { value: '< 100ms', label: 'flag propagation' },
                { value: '1 click', label: 'to rollback' },
                { value: '0 deploys', label: 'to change flags' },
                { value: '100%', label: 'open source' }
              ] as const
            ).map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-0.5 text-center"
              >
                <span className="text-cg-neutral-100 font-mono text-xl font-bold sm:text-2xl">
                  {stat.value}
                </span>
                <span className="text-cg-neutral-500 text-xs">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <V2InteractiveTabs />

      <V2Steps />

      <V2Pricing />

      <LandingFooter />
    </main>
  )
}
