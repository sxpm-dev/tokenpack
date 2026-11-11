import Link from 'next/link'

interface PageMapMdxNode {
  name: string
  route: string
  frontMatter?: { title?: string }
  title?: string
}

interface PageMapFolderNode {
  name: string
  route: string
  title?: string
  children: PageMapNode[]
}

interface PageMapMetaNode {
  data: Record<string, string | { title?: string }>
}

type PageMapNode = PageMapMdxNode | PageMapFolderNode | PageMapMetaNode

const visibleDocsRoutes = new Set([
  '/docs/quickstart',
  '/docs/api',
  '/docs/api/node',
  '/docs/api/browser',
  '/docs/api/cli',
])

function isFolder(node: PageMapNode): node is PageMapFolderNode {
  return 'children' in node && Array.isArray((node as PageMapFolderNode).children)
}

function isMeta(node: PageMapNode): node is PageMapMetaNode {
  return 'data' in node
}

function isVisibleDocNode(node: PageMapMdxNode | PageMapFolderNode): boolean {
  if (visibleDocsRoutes.has(node.route)) return true
  if (!isFolder(node)) return false

  return node.children.some(child => !isMeta(child) && isVisibleDocNode(child))
}

function pickTitle(node: PageMapMdxNode | PageMapFolderNode, metaTitle?: string): string {
  if (metaTitle) return metaTitle
  if ('frontMatter' in node && node.frontMatter?.title) return node.frontMatter.title
  if (node.title) return node.title

  return node.name
}

interface DocsSidebarProps {
  pageMap: unknown[]
}

export function DocsSidebar({ pageMap }: DocsSidebarProps) {
  return (
    <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-64 shrink-0 overflow-y-auto border-r border-tp-border px-5 py-8 lg:block">
      <div className="mb-5 text-[10px] tracking-[0.18em] text-tp-soft uppercase">Documentation</div>
      <nav className="flex flex-col gap-0.5 text-[13.5px]">
        <SidebarNodes nodes={pageMap as PageMapNode[]} />
      </nav>
    </aside>
  )
}

interface SidebarNodesProps {
  nodes: PageMapNode[]
  depth?: number
}

function SidebarNodes({ nodes, depth = 0 }: SidebarNodesProps) {
  const meta = nodes.find(isMeta)?.data ?? {}
  const items = nodes
    .filter((node): node is PageMapMdxNode | PageMapFolderNode => !isMeta(node))
    .filter(isVisibleDocNode)

  return (
    <>
      {items.map(node => {
        const metaValue = meta[node.name]
        const overrideTitle = typeof metaValue === 'string' ? metaValue : metaValue?.title
        const title = pickTitle(node, overrideTitle)

        if (isFolder(node)) {
          return (
            <div key={node.route} className={depth === 0 ? 'mt-4' : 'mt-2'}>
              <div className="px-2.5 pt-1 pb-1 font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
                {title}
              </div>
              <div className="flex flex-col gap-0.5">
                <SidebarNodes depth={depth + 1} nodes={node.children} />
              </div>
            </div>
          )
        }

        return (
          <Link
            key={node.route}
            className="block truncate rounded-md px-2.5 py-1.5 text-tp-muted transition-colors hover:bg-tp-elev2 hover:text-tp-fg"
            href={node.route}
          >
            {title}
          </Link>
        )
      })}
    </>
  )
}
