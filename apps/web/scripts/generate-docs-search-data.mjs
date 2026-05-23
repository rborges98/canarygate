import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const scriptPath = fileURLToPath(import.meta.url)
const scriptDir = path.dirname(scriptPath)
const appDir = path.resolve(scriptDir, '..')
const contentDir = path.join(appDir, 'content')
const outputFile = path.join(appDir, 'public', 'docs-search-data.json')

const SECTION_LABELS = {
  '': 'Documentation',
  'getting-started': 'Getting Started',
  concepts: 'Concepts',
  guides: 'Guides',
  'api-reference': 'API Reference',
  sdk: 'SDK',
  'sdk/javascript': 'SDK / JavaScript'
}

const SECTION_ORDER = {
  Documentation: 0,
  'Getting Started': 1,
  Concepts: 2,
  Guides: 3,
  'SDK / JavaScript': 4,
  SDK: 5,
  'API Reference': 6
}

async function collectMdxFiles(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directoryPath, entry.name)

      if (entry.isDirectory()) {
        if (directoryPath === contentDir && entry.name === 'docs') {
          return []
        }

        return collectMdxFiles(entryPath)
      }

      if (entry.isFile() && entry.name.endsWith('.mdx')) {
        return [entryPath]
      }

      return []
    })
  )

  return files.flat()
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeString(value) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

function normalizeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .filter((item) => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    )
  }

  if (typeof value === 'string') {
    return Array.from(
      new Set(
        value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      )
    )
  }

  return []
}

function toSlugSegments(relativeFilePath) {
  const segments = relativeFilePath
    .replace(/\\/g, '/')
    .replace(/\.mdx$/, '')
    .split('/')

  if (segments[segments.length - 1] === 'index') {
    segments.pop()
  }

  return segments.filter(Boolean)
}

function humanizeSegment(value) {
  return value
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

function deriveSectionLabel(slugSegments) {
  const pathKey = slugSegments.slice(0, 2).join('/')
  const parentKey = slugSegments[0] ?? ''

  return (
    SECTION_LABELS[pathKey] ??
    SECTION_LABELS[parentKey] ??
    humanizeSegment(parentKey || 'documentation')
  )
}

function deriveSubsectionLabel(slugSegments) {
  if (slugSegments[0] === 'sdk' && slugSegments[1]) {
    return humanizeSegment(slugSegments[1])
  }

  if (slugSegments.length > 1) {
    return humanizeSegment(slugSegments[0])
  }

  return null
}

function stripCodeBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, ' ')
}

function cleanInlineMarkdown(value) {
  return normalizeWhitespace(
    value
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~]/g, ' ')
  )
}

function extractHeadings(content) {
  const headingMatches = stripCodeBlocks(content).matchAll(/^#{1,6}\s+(.+)$/gm)

  return Array.from(
    new Set(
      Array.from(headingMatches)
        .map((match) => cleanInlineMarkdown(match[1] ?? ''))
        .filter(Boolean)
    )
  )
}

function stripMdx(content) {
  return normalizeWhitespace(
    stripCodeBlocks(content)
      .replace(/^import\s.+$/gm, ' ')
      .replace(/^export\s.+$/gm, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/^#{1,6}\s+/gm, ' ')
      .replace(/^>\s?/gm, ' ')
      .replace(/^[-*+]\s+/gm, ' ')
      .replace(/^\d+\.\s+/gm, ' ')
      .replace(/[|]/g, ' ')
      .replace(/[*_~]/g, ' ')
  )
}

function estimateReadingTime(textContent) {
  const wordCount = textContent.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(wordCount / 220))
}

function extractSummary(frontmatter, textContent) {
  const summary = normalizeString(frontmatter.summary)
  if (summary) {
    return summary
  }

  const description = normalizeString(frontmatter.description)
  if (description) {
    return description
  }

  const firstSentence = textContent.split(/(?<=[.!?])\s+/)[0] ?? textContent
  return firstSentence.slice(0, 220).trim()
}

function normalizeKeywords(frontmatter, slugSegments, sectionLabel) {
  const keywords = normalizeStringArray(frontmatter.keywords)
  const aliases = normalizeStringArray(frontmatter.aliases)
  const title = normalizeString(frontmatter.title)
  const description = normalizeString(frontmatter.description)

  return Array.from(
    new Set(
      [
        ...keywords,
        ...aliases,
        title,
        sectionLabel,
        slugSegments.join(' '),
        description
      ]
        .filter((item) => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
    )
  )
}

function sortEntries(left, right) {
  const sectionDelta =
    (SECTION_ORDER[left.section] ?? Number.MAX_SAFE_INTEGER) -
    (SECTION_ORDER[right.section] ?? Number.MAX_SAFE_INTEGER)

  if (sectionDelta !== 0) {
    return sectionDelta
  }

  const boostDelta = right.searchBoost - left.searchBoost
  if (boostDelta !== 0) {
    return boostDelta
  }

  const indexDelta = Number(right.isIndexPage) - Number(left.isIndexPage)
  if (indexDelta !== 0) {
    return indexDelta
  }

  return left.url.localeCompare(right.url)
}

async function main() {
  const files = await collectMdxFiles(contentDir)

  const entries = await Promise.all(
    files.map(async (filePath) => {
      const fileContents = await fs.readFile(filePath, 'utf8')
      const { data, content } = matter(fileContents)

      if (data.searchable === false) {
        return null
      }

      const relativeFilePath = path.relative(contentDir, filePath)
      const slug = toSlugSegments(relativeFilePath)
      const url = slug.length > 0 ? `/docs/${slug.join('/')}` : '/docs'
      const section = deriveSectionLabel(slug)
      const textContent = stripMdx(content)
      const headings = extractHeadings(content)
      const title =
        normalizeString(data.title) ??
        humanizeSegment(slug.at(-1) ?? 'documentation')
      const description =
        normalizeString(data.description) ?? extractSummary(data, textContent)
      const summary = extractSummary(data, textContent)
      const aliases = normalizeStringArray(data.aliases)
      const searchBoost =
        normalizeNumber(data.searchBoost) ?? (data.asIndexPage ? 3 : 1)

      return {
        id: slug.length > 0 ? slug.join('/') : 'index',
        slug,
        url,
        title,
        description,
        summary,
        section,
        subsection: deriveSubsectionLabel(slug),
        headings,
        keywords: normalizeKeywords(data, slug, section),
        aliases,
        content: textContent,
        readingTimeMinutes: estimateReadingTime(textContent),
        searchable: data.searchable !== false,
        isIndexPage: Boolean(data.asIndexPage),
        searchBoost,
        canonical: normalizeString(data.canonical),
        ogTitle: normalizeString(data.ogTitle),
        ogDescription: normalizeString(data.ogDescription),
        ogImage: normalizeString(data.ogImage)
      }
    })
  )

  const searchEntries = entries.filter(Boolean).sort(sortEntries)

  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await fs.writeFile(
    outputFile,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: searchEntries.length,
        entries: searchEntries
      },
      null,
      2
    )}\n`
  )

  console.log(`[docs-search] Generated ${searchEntries.length} search entries.`)
}

main().catch((error) => {
  console.error('[docs-search] Failed to generate search data.')
  console.error(error)
  process.exitCode = 1
})
