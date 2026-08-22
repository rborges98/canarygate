import { LandingNav } from '@/components/home/nav'
import { LandingFooter } from '@/components/home/footer'
import { V2Hero } from '@/components/home/hero'
import { V2InteractiveTabs } from '@/components/home/interactive-tabs'
import { V2Steps } from '@/components/home/steps'
import { V2Pricing } from '@/components/home/pricing'
import { Reveal } from '@/components/home/reveal'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const siteDescription =
  'Feature flags, gradual rollout, real-time updates and operational safety for modern teams.'

type FaqItem = {
  question: string
  answer: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is a feature flag?',
    answer:
      'A feature flag is a software toggle that lets you turn a feature on or off without deploying code. It is the standard way to release new functionality gradually and roll it back instantly if something goes wrong.'
  },
  {
    question: 'How does CanaryGate work with feature flags in production?',
    answer:
      'CanaryGate evaluates feature flags in your application through lightweight SDKs for JavaScript, Go, Python, C#, and Java. Flag changes propagate to every instance in real time over SSE, so updates take effect in milliseconds — no redeploys required.'
  },
  {
    question: 'Does CanaryGate support gradual rollouts and auto-rollout?',
    answer:
      'Yes. You can roll a feature out to a percentage of users, schedule the rollout for a specific time, and let auto-rollout increase the percentage automatically while your success criteria are met.'
  },
  {
    question: 'How much does CanaryGate cost?',
    answer:
      'CanaryGate has a Free plan for $0, a Starter plan for $45/month, and a Pro plan for $99/month, with no per-seat fees. Billing is not active yet — during beta, all features are available free of charge.'
  }
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'CanaryGate',
      url: appUrl,
      logo: `${appUrl}/icon`,
      sameAs: []
    },
    {
      '@type': 'WebSite',
      name: 'CanaryGate',
      url: appUrl
    },
    {
      '@type': 'SoftwareApplication',
      name: 'CanaryGate',
      url: appUrl,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      description: siteDescription,
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '99',
        priceCurrency: 'USD',
        offerCount: '3',
        offers: [
          {
            '@type': 'Offer',
            name: 'Free',
            price: '0',
            priceCurrency: 'USD'
          },
          {
            '@type': 'Offer',
            name: 'Starter',
            price: '45',
            priceCurrency: 'USD'
          },
          {
            '@type': 'Offer',
            name: 'Pro',
            price: '99',
            priceCurrency: 'USD'
          }
        ]
      }
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    }
  ]
}

export default function HomePage() {
  return (
    <main className="bg-background text-cg-neutral-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
        }}
      />
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
            ).map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08} y={20} blur={4}>
                <div className="flex flex-col items-center gap-0.5 text-center">
                  <span className="text-cg-neutral-100 font-mono text-xl font-bold sm:text-2xl">
                    {stat.value}
                  </span>
                  <span className="text-cg-neutral-500 text-xs">
                    {stat.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <V2InteractiveTabs />

      <V2Steps />

      <V2Pricing />

      <section className="border-cg-bg-100 border-t py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-8">
          <Reveal y={32} blur={8}>
            <h2 className="text-cg-neutral-100 mb-10 text-center text-3xl font-semibold sm:text-4xl">
              Frequently asked questions
            </h2>
          </Reveal>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <Reveal key={item.question} delay={i * 0.06} y={18} blur={4}>
                <details className="border-cg-bg-100 bg-cg-bg-100/40 group rounded-lg border">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                    <h3 className="text-cg-neutral-100 text-base font-semibold">
                      {item.question}
                    </h3>
                    <span
                      aria-hidden
                      className="text-cg-indigo-300 shrink-0 font-mono text-lg font-semibold transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-cg-neutral-300 px-5 pb-5 text-sm leading-relaxed">
                    {item.answer}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  )
}
