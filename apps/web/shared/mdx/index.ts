import type { ComponentType } from 'react'
import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'
import { Callout, Cards } from 'nextra/components'

type MDXComponentMap = Record<string, ComponentType>

const docsComponents = getDocsMDXComponents()

export function getMDXComponents(components: MDXComponentMap) {
  return {
    ...docsComponents,
    Callout,
    Cards,
    ...components
  }
}
