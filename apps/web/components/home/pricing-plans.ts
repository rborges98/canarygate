export type PricingPlan = {
  name: string
  price: string
  period: string
  tagline: string
  features: string[]
  highlighted: boolean
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    tagline: 'For solo developers. Start today.',
    features: [
      '1 project · 50 flags per project',
      '1 member (solo)',
      'Boolean flags + Rollout %',
      '3 environments',
      '7-day audit history',
      'SSE real-time updates',
      'Community support'
    ],
    highlighted: false
  },
  {
    name: 'Starter',
    price: '$45',
    period: '/month',
    tagline: 'For small teams. Ship together.',
    features: [
      '10 projects · 100 flags per project',
      'Up to 10 members',
      'Boolean flags + Rollout %',
      '3 environments',
      '6-month audit history',
      'SSE real-time updates',
      'Webhooks',
      'Priority support'
    ],
    highlighted: true
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    tagline: 'For teams that need full control.',
    features: [
      '50 projects · unlimited flags',
      'Up to 50 members',
      'Auto-rollout + Schedule',
      '3 environments',
      '1-year audit history + CSV',
      'SSE real-time updates',
      'Webhooks',
      'Priority support'
    ],
    highlighted: false
  }
]
