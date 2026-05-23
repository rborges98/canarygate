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
    <div className="docs-theme-shell">
      <Layout
        navbar={
          <Navbar logo={<Logo />}>
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
