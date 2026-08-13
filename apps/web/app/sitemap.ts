import type { MetadataRoute } from 'next'
import { readdir } from 'node:fs/promises'
import path from 'node:path'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const CONTENT_DIR = path.join(process.cwd(), 'content')

async function collectDocSlugs(dir: string, prefix: string[]): Promise<string[]> {
  const slugs: string[] = []
  let entries

  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    console.error(`[sitemap] failed to read content directory: ${dir}`, error)
    return slugs
  }

  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      slugs.push(...(await collectDocSlugs(fullPath, [...prefix, entry.name])))
      continue
    }

    if (!/\.(mdx|md)$/.test(entry.name)) continue

    const segments = [...prefix, entry.name.replace(/\.(mdx|md)$/, '')]
    if (segments[0] === 'docs') continue
    const normalized =
      segments[segments.length - 1] === 'index'
        ? segments.slice(0, -1)
        : segments
    slugs.push(
      normalized.length ? `/docs/${normalized.join('/')}` : '/docs'
    )
  }

  return slugs
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docSlugs = await collectDocSlugs(CONTENT_DIR, [])
  const publicPaths = ['/', '/terms', '/privacy', ...docSlugs.sort()]

  return publicPaths.map((publicPath) => ({
    url: `${appUrl}${publicPath}`
  }))
}
