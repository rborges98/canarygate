import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { importPage } from 'nextra/pages'
import { getMDXComponents } from '@/shared/mdx'

export const dynamic = 'force-dynamic'

const DEFAULT_DOCS_KEYWORDS = [
  'CanaryGate',
  'feature flags',
  'documentation',
  'gradual rollout',
  'SSE',
  'API reference',
  'SDK'
]

type DocsFrontmatterMetadata = {
  title?: string
  description?: string
  summary?: string
  keywords?: string[] | string
  canonical?: string
  searchable?: boolean
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  robots?: Metadata['robots']
  openGraph?: Metadata['openGraph']
  twitter?: Metadata['twitter']
}

function normalizeKeywords(value: DocsFrontmatterMetadata['keywords']) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function buildDocsPath(slug?: string[]) {
  return slug?.length ? `/docs/${slug.join('/')}` : '/docs'
}

function assertCanonicalDocsSlug(slug?: string[]) {
  if (slug?.[0] === 'docs') {
    notFound()
  }
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  assertCanonicalDocsSlug(params.slug)
  const { metadata } = await importPage(params.slug)
  const docMetadata = (metadata ?? {}) as DocsFrontmatterMetadata
  const title = docMetadata.ogTitle ?? docMetadata.title ?? 'Documentation'
  const description =
    docMetadata.summary ??
    docMetadata.ogDescription ??
    docMetadata.description ??
    'CanaryGate documentation'
  const keywords = Array.from(
    new Set([
      ...DEFAULT_DOCS_KEYWORDS,
      ...normalizeKeywords(docMetadata.keywords)
    ])
  )
  const canonical = docMetadata.canonical ?? buildDocsPath(params.slug)
  const searchable = docMetadata.searchable !== false
  const socialDescription = docMetadata.ogDescription ?? description

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical
    },
    openGraph: {
      ...docMetadata.openGraph,
      type: 'article',
      title: docMetadata.ogTitle ?? title,
      description: socialDescription,
      url: canonical,
      images: docMetadata.ogImage
        ? [docMetadata.ogImage]
        : docMetadata.openGraph?.images
    },
    twitter: {
      ...docMetadata.twitter,
      card: docMetadata.ogImage ? 'summary_large_image' : 'summary',
      title: docMetadata.ogTitle ?? title,
      description: socialDescription,
      images: docMetadata.ogImage ? [docMetadata.ogImage] : undefined
    },
    robots: docMetadata.robots ?? { index: searchable, follow: searchable }
  } satisfies Metadata
}

const Wrapper = getMDXComponents({}).wrapper

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  assertCanonicalDocsSlug(params.slug)
  const result = await importPage(params.slug)
  const { default: MDXContent, ...pageProps } = result
  return (
    <Wrapper {...pageProps}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}
