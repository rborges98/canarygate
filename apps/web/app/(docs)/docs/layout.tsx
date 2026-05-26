import Link from 'next/link'
import { Layout, Navbar } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import type { PageMapItem } from 'nextra'
import DocsSearch from '@/components/docs/docs-search'
import { Logo } from '@/components/logo'
import type { ReactNode } from 'react'
import 'nextra-theme-docs/style.css'

function filterDocsPageMap(pageMap: PageMapItem[]) {
  return pageMap.filter((item) => !('children' in item && item.name === 'docs'))
}

export default async function DocsLayout({
  children
}: {
  children: ReactNode
}) {
  const pageMap = filterDocsPageMap(await getPageMap('/docs'))

  return (
    <div className="text-cg-neutral-100 bg-background [&_aside]:bg-background! [&_nav]:text-cg-neutral-100 [&_aside]:text-cg-neutral-100 [&_aside_a]:text-cg-neutral-100! [&_aside_button]:text-cg-neutral-100! [&_aside_a:hover]:text-cg-indigo-300! [&_aside_button:hover]:text-cg-indigo-300! [&_nav_a:hover]:text-cg-indigo-300! [&_nav_button:hover]:text-cg-indigo-300! [&_article_:where(h1,h2,h3,h4,h5,h6,p,li,blockquote,strong,th,td)]:text-cg-neutral-100! [&_article_a]:text-cg-indigo-300! [&_article_a:hover]:text-cg-indigo-300! [--nextra-bg:10_10_10] [--nextra-navbar-height:60px] [--x-font-mono:var(--font-mono)] [--x-font-sans:var(--font-sans)] [&_article_a]:decoration-[color-mix(in_oklab,var(--color-cg-indigo-300)_45%,transparent)] [&_aside_a]:[transition:color_150ms_ease] [&_aside_button]:[transition:color_150ms_ease]">
      <Layout
        navbar={
          <Navbar
            logo={<Logo />}
            className="border-cg-neutral-100! mx-0! h-15! max-w-none! px-4! sm:px-8!"
          >
            <Link
              href="/login"
              className="bg-cg-indigo-400 hover:bg-cg-indigo-300 inline-flex items-center rounded-lg px-4 py-2 text-[13px] font-semibold whitespace-nowrap text-white no-underline transition-colors"
            >
              Login
            </Link>
          </Navbar>
        }
        pageMap={pageMap}
        search={<DocsSearch />}
        footer={null}
        copyPageButton={false}
        darkMode={false}
        nextThemes={{ forcedTheme: 'dark' }}
        sidebar={{
          autoCollapse: false,
          defaultMenuCollapseLevel: 1,
          defaultOpen: true,
          toggleButton: false
        }}
        editLink={null}
        docsRepositoryBase="https://github.com/canarygate/canarygate"
      >
        {children}
      </Layout>
    </div>
  )
}
