'use client'

import Link from 'next/link'
import MiniSearch from 'minisearch'
import { usePathname } from 'next/navigation'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '@/components/ui/modal'
import { SearchInput } from '@/components/ui/search-input'
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut'
import { cn } from '@/shared/utils'

type DocsSearchEntry = {
  id: string
  slug: string[]
  url: string
  title: string
  description: string
  summary: string
  section: string
  subsection: string | null
  headings: string[]
  keywords: string[]
  aliases: string[]
  content: string
  readingTimeMinutes: number
  searchable: boolean
  isIndexPage: boolean
  searchBoost: number
  canonical: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
}

type DocsSearchPayload = {
  generatedAt: string
  total: number
  entries: DocsSearchEntry[]
}

type DocsSearchIndexDocument = DocsSearchEntry & {
  keywordsText: string
  headingsText: string
  aliasesText: string
}

type DocsSearchResult = Pick<
  DocsSearchEntry,
  | 'id'
  | 'url'
  | 'title'
  | 'description'
  | 'summary'
  | 'section'
  | 'subsection'
  | 'headings'
  | 'keywords'
  | 'readingTimeMinutes'
  | 'isIndexPage'
  | 'searchBoost'
> & {
  score: number
}

const SEARCH_DATA_URL = '/docs-search-data.json'
const SEARCH_FIELDS = [
  'title',
  'summary',
  'description',
  'keywordsText',
  'aliasesText',
  'headingsText',
  'content'
] as const

let cachedPayload: DocsSearchPayload | null = null
let cachedIndex: MiniSearch<DocsSearchIndexDocument> | null = null

function createSearchIndex(entries: DocsSearchEntry[]) {
  const index = new MiniSearch<DocsSearchIndexDocument>({
    fields: [...SEARCH_FIELDS],
    storeFields: [
      'id',
      'url',
      'title',
      'description',
      'summary',
      'section',
      'subsection',
      'headings',
      'keywords',
      'readingTimeMinutes',
      'isIndexPage',
      'searchBoost'
    ],
    searchOptions: {
      boost: {
        title: 8,
        keywordsText: 6,
        aliasesText: 6,
        headingsText: 5,
        summary: 4,
        description: 3,
        content: 1.5
      },
      prefix: true
    }
  })

  index.addAll(
    entries.map((entry) => ({
      ...entry,
      keywordsText: entry.keywords.join(' '),
      headingsText: entry.headings.join(' '),
      aliasesText: entry.aliases.join(' ')
    }))
  )

  return index
}

async function loadDocsSearch() {
  if (cachedPayload && cachedIndex) {
    return { payload: cachedPayload, index: cachedIndex }
  }

  // Single fetch (no-store) to always get fresh data; log errors for debugging.
  let response: Response

  try {
    response = await fetch(SEARCH_DATA_URL, {
      method: 'GET',
      cache: 'no-store'
    })
  } catch (err) {
    console.error('[docs-search] fetch failed', err)
    throw new Error(
      'Falha ao buscar o indice de busca: ' +
        (err instanceof Error ? err.message : String(err))
    )
  }

  if (!response.ok) {
    const status = `${response.status} ${response.statusText}`
    const bodyText = await response
      .clone()
      .text()
      .catch(() => '')
    console.error('[docs-search] bad response', { status, bodyText })
    throw new Error(`Falha ao carregar o indice de busca (${status})`)
  }

  const payload = (await response.json()) as DocsSearchPayload
  const index = createSearchIndex(payload.entries)

  cachedPayload = payload
  cachedIndex = index

  return { payload, index }
}

function buildDefaultResults(entries: DocsSearchEntry[]) {
  return [...entries]
    .sort((left, right) => {
      const boostDelta = right.searchBoost - left.searchBoost
      if (boostDelta !== 0) {
        return boostDelta
      }

      const indexDelta = Number(right.isIndexPage) - Number(left.isIndexPage)
      if (indexDelta !== 0) {
        return indexDelta
      }

      return left.url.localeCompare(right.url)
    })
    .slice(0, 8)
    .map((entry) => ({
      id: entry.id,
      url: entry.url,
      title: entry.title,
      description: entry.description,
      summary: entry.summary,
      section: entry.section,
      subsection: entry.subsection,
      headings: entry.headings,
      keywords: entry.keywords,
      readingTimeMinutes: entry.readingTimeMinutes,
      isIndexPage: entry.isIndexPage,
      searchBoost: entry.searchBoost,
      score: entry.searchBoost
    }))
}

function searchDocs(
  index: MiniSearch<DocsSearchIndexDocument>,
  query: string
): DocsSearchResult[] {
  return index
    .search(query, {
      prefix: true,
      fuzzy: query.length > 4 ? 0.2 : false,
      boost: {
        title: 8,
        keywordsText: 6,
        aliasesText: 6,
        headingsText: 5,
        summary: 4,
        description: 3,
        content: 1.5
      }
    })
    .slice(0, 10)
    .map((result) => ({
      id: result.id,
      url: result.url,
      title: result.title,
      description: result.description,
      summary: result.summary,
      section: result.section,
      subsection: result.subsection,
      headings: result.headings,
      keywords: result.keywords,
      readingTimeMinutes: result.readingTimeMinutes,
      isIndexPage: result.isIndexPage,
      searchBoost: result.searchBoost,
      score: result.score
    }))
}

function formatSearchLabel(query: string) {
  return query.trim().length > 0 ? 'Resultados' : 'Sugestoes'
}

export default function DocsSearch() {
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [payload, setPayload] = useState<DocsSearchPayload | null>(
    cachedPayload
  )
  const [index, setIndex] =
    useState<MiniSearch<DocsSearchIndexDocument> | null>(cachedIndex)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deferredQuery = useDeferredValue(query)

  useKeyboardShortcut({
    key: 'k',
    metaOrCtrl: true,
    preventDefault: true,
    ignoreWhenTyping: true,
    handler: () => {
      setOpen((current) => !current)
    }
  })

  useKeyboardShortcut({
    key: 'Escape',
    handler: () => {
      setOpen(false)
    }
  })

  useEffect(() => {
    setOpen(false)
    setQuery('')
  }, [pathname])

  useEffect(() => {
    if (!open || (payload && index)) {
      return
    }

    let cancelled = false

    void loadDocsSearch()
      .then(({ payload: nextPayload, index: nextIndex }) => {
        if (cancelled) {
          return
        }

        setPayload(nextPayload)
        setIndex(nextIndex)
        setErrorMessage(null)
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        console.error('[docs-search] loadDocsSearch error', error)

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar a busca da documentacao.'
        )
      })

    return () => {
      cancelled = true
    }
  }, [index, open, payload])

  useEffect(() => {
    if (!open) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [open])

  // Clear query and any previous error when the modal is closed so
  // reopening starts with a clean state.
  useEffect(() => {
    if (!open) {
      setQuery('')
      setErrorMessage(null)
    }
  }, [open])

  const results = useMemo(() => {
    const entries = payload?.entries ?? []
    if (entries.length === 0) {
      return []
    }

    const normalizedQuery = deferredQuery.trim()

    if (normalizedQuery.length === 0) {
      return buildDefaultResults(entries)
    }

    if (!index) {
      return []
    }

    return searchDocs(index, normalizedQuery)
  }, [deferredQuery, index, payload])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-cg-bg-100 bg-cg-bg-300/80 hover:bg-cg-bg-200 hidden min-w-55 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition md:flex"
        aria-label="Abrir busca da documentacao"
      >
        <span className="flex items-center gap-2">
          <svg
            className="text-cg-neutral-400 h-3.5 w-3.5 shrink-0"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6.5" cy="6.5" r="4" />
            <path d="M10 10l3 3" />
          </svg>
          <span className="text-cg-neutral-300 font-sans text-[12px]">
            Search docs, APIs, rollout...
          </span>
        </span>
        <kbd className="border-cg-bg-100 bg-cg-bg-200 text-cg-neutral-500 rounded-md border px-1.5 py-0.5 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-cg-bg-100 bg-cg-bg-300/80 hover:bg-cg-bg-200 flex h-10 w-10 items-center justify-center rounded-xl border transition md:hidden"
        aria-label="Abrir busca da documentacao"
      >
        <svg
          className="text-cg-neutral-300 h-4 w-4"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6.5" cy="6.5" r="4" />
          <path d="M10 10l3 3" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} className="max-w-190">
        <div className="border-cg-bg-100 border-b px-4 py-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search docs, SDK methods, environments, rollout..."
            inputRef={inputRef}
            className="bg-cg-bg-200 w-full"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-cg-neutral-500 font-sans text-[12px]">
              Search across concepts, guides, SDK and API reference.
            </p>
            <span className="text-cg-neutral-600 font-mono text-[10px] tracking-[0.18em] uppercase">
              Ctrl K
            </span>
          </div>
        </div>

        <div className="bg-cg-bg-300 max-h-[65vh] min-h-55 overflow-y-auto p-2">
          {errorMessage ? (
            <div className="flex min-h-50 items-center justify-center px-6 text-center">
              <div>
                <p className="text-cg-neutral-100 font-sans text-[14px] font-semibold">
                  Busca indisponivel
                </p>
                <p className="text-cg-neutral-500 mt-2 font-sans text-[12px] leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
          ) : !payload || !index ? (
            <div className="flex min-h-50 items-center justify-center px-6 text-center">
              <div>
                <p className="text-cg-neutral-100 font-sans text-[14px] font-semibold">
                  Preparando indice da documentacao
                </p>
                <p className="text-cg-neutral-500 mt-2 font-sans text-[12px] leading-relaxed">
                  Carregando os termos e sinônimos extraídos do conteúdo.
                </p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex min-h-50 items-center justify-center px-6 text-center">
              <div>
                <p className="text-cg-neutral-100 font-sans text-[14px] font-semibold">
                  Nenhum resultado encontrado
                </p>
                <p className="text-cg-neutral-500 mt-2 font-sans text-[12px] leading-relaxed">
                  Tente termos mais amplos como{' '}
                  <span className="font-mono">rollout</span>,{' '}
                  <span className="font-mono">environment</span> ou{' '}
                  <span className="font-mono">webhooks</span>.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between px-2 pb-2">
                <p className="text-cg-neutral-500 font-sans text-[11px] tracking-[0.14em] uppercase">
                  {formatSearchLabel(deferredQuery)}
                </p>
                <p className="text-cg-neutral-600 font-sans text-[11px]">
                  {results.length} item{results.length === 1 ? '' : 's'}
                </p>
              </div>

              <ul className="space-y-2">
                {results.map((result) => (
                  <li key={result.id}>
                    <Link
                      href={result.url}
                      onClick={() => setOpen(false)}
                      className="border-cg-bg-300 hover:border-cg-bg-100 hover:bg-cg-bg-200/80 block rounded-2xl border px-4 py-3 transition"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-cg-indigo-300 font-sans text-[11px] font-semibold tracking-[0.14em] uppercase">
                          {result.section}
                        </span>
                        {result.subsection ? (
                          <span className="text-cg-neutral-600 font-sans text-[11px]">
                            {result.subsection}
                          </span>
                        ) : null}
                        <span className="text-cg-neutral-600 font-sans text-[11px]">
                          {result.readingTimeMinutes} min read
                        </span>
                      </div>

                      <div className="text-cg-neutral-100 font-sans text-[14px] font-semibold">
                        {result.title}
                      </div>

                      <p className="text-cg-neutral-400 mt-1 font-sans text-[12px] leading-relaxed">
                        {result.summary || result.description}
                      </p>

                      {result.headings.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {result.headings.slice(0, 3).map((heading) => (
                            <span
                              key={heading}
                              className={cn(
                                'border-cg-bg-100 bg-cg-bg-300 text-cg-neutral-500 rounded-full border px-2.5 py-1 font-sans text-[11px]'
                              )}
                            >
                              {heading}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
