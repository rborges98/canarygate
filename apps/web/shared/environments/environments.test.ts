import { ENVIRONMENTS } from './environments'

describe('ENVIRONMENTS', () => {
  it('has exactly 3 environments', () => {
    expect(ENVIRONMENTS).toHaveLength(3)
  })

  it('has a production environment marked as default', () => {
    const production = ENVIRONMENTS.find((e) => e.slug === 'production')
    expect(production).toBeDefined()
    expect(production?.isDefault).toBe(true)
  })

  it('has no more than one default environment', () => {
    const defaults = ENVIRONMENTS.filter((e) => e.isDefault)
    expect(defaults).toHaveLength(1)
  })

  it('has unique slugs', () => {
    const slugs = ENVIRONMENTS.map((e) => e.slug)
    const unique = new Set(slugs)
    expect(unique.size).toBe(slugs.length)
  })

  it('has development and staging marked as non-default', () => {
    const development = ENVIRONMENTS.find((e) => e.slug === 'development')
    const staging = ENVIRONMENTS.find((e) => e.slug === 'staging')
    expect(development?.isDefault).toBe(false)
    expect(staging?.isDefault).toBe(false)
  })
})