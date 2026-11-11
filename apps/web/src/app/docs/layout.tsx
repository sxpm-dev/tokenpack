import { getPageMap } from 'nextra/page-map'
import type { ReactNode } from 'react'

import { DocsSidebar } from '@/components/DocsSidebar/DocsSidebar'
import { DocsTopbar } from '@/components/DocsTopbar/DocsTopbar'

interface DocsLayoutProps {
  children: ReactNode
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
  const pageMap = await getPageMap('/docs')

  return (
    <div className="min-h-screen bg-tp-bg text-tp-fg">
      <DocsTopbar />
      <div className="mx-auto flex max-w-6xl">
        <DocsSidebar pageMap={pageMap} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
