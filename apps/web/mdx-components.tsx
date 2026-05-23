import type { ComponentType } from 'react'
import { getMDXComponents } from '@/shared/mdx'

type MDXComponentMap = Record<string, ComponentType>

export function useMDXComponents(components: MDXComponentMap) {
  return getMDXComponents(components)
}
