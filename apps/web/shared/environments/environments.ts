export const ENVIRONMENTS = [
  { slug: 'development', name: 'Development', isDefault: false },
  { slug: 'staging', name: 'Staging', isDefault: false },
  { slug: 'production', name: 'Production', isDefault: true }
] as const

export type Environment = (typeof ENVIRONMENTS)[number]
