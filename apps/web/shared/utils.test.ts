import { cn } from './utils'

describe('cn', () => {
  it('returns single class name unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('merges multiple class names with space', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('removes falsy values (false, null, undefined)', () => {
    expect(cn('foo', false, null, undefined, 'bar')).toBe('foo bar')
  })

  it('merges tailwind classes correctly (last wins for conflicts)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional classes with objects', () => {
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500')
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })
})
