export interface SiteNavLink {
  href: string
  label: string
  external?: boolean
}

export interface SiteNavGroup {
  label: string
  items: SiteNavLink[]
}

export type SiteNavItem = SiteNavLink | SiteNavGroup

export const siteNavItems: SiteNavItem[] = [
  {
    label: 'Tokens',
    items: [
      { href: '/linear-token', label: 'Linear Token' },
      { href: '/pixel-range-token', label: 'Pixel Range Token' },
      { href: '/router-tokens', label: 'Router Token' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { href: '/docs/quickstart', label: 'Quickstart' },
      { href: '/docs/api', label: 'API' },
      { href: '/ai-docs', label: 'AI Docs' },
      { href: '/use-cases', label: 'Workflow guides' },
    ],
  },
  {
    label: 'Try',
    items: [
      { href: '/playground', label: 'Playground' },
      { href: '/server-fetch-bench', label: 'Server fetch stats' },
      { href: '/browser-fetch-bench', label: 'Browser fetch' },
      { href: '/apply-diff-bench', label: 'Apply diff' },
      { href: '/scenarios/diff-versioning', label: 'Diff matrix' },
      { href: '/json-playground', label: 'JSON paths' },
      { href: '/playground/files', label: 'Build / explore / diff' },
      { href: '/experiments', label: 'Runtime playgrounds' },
      { href: '/encode-decode-bench', label: 'Encode / decode stats' },
      { href: '/benchmarks/app', label: 'Bench app' },
    ],
  },
]

export const footerNavGroups: SiteNavGroup[] = [
  {
    label: 'Tokens',
    items: [
      { href: '/', label: 'Home' },
      { href: '/linear-token', label: 'Linear Token' },
      { href: '/pixel-range-token', label: 'Pixel Range Token' },
      { href: '/router-tokens', label: 'Router Token' },
    ],
  },
  {
    label: 'Docs',
    items: [
      { href: '/docs/quickstart', label: 'Quickstart' },
      { href: '/docs/api', label: 'API reference' },
      { href: '/ai-docs', label: 'AI Docs' },
    ],
  },
  {
    label: 'Explore',
    items: [
      { href: '/use-cases', label: 'Workflow guides' },
      { href: '/server-fetch-bench', label: 'Server fetch stats' },
      { href: '/browser-fetch-bench', label: 'Browser fetch' },
      { href: '/apply-diff-bench', label: 'Apply diff' },
      { href: '/scenarios/diff-versioning', label: 'Diff matrix' },
      { href: '/json-playground', label: 'JSON paths' },
      { href: '/playground/files', label: 'Build / explore / diff' },
      { href: '/experiments', label: 'Runtime playgrounds' },
      { href: '/encode-decode-bench', label: 'Encode / decode stats' },
      { href: '/benchmarks/app', label: 'Bench app' },
      { href: 'https://github.com/sxpm-dev/tokenpack', label: 'GitHub', external: true },
    ],
  },
]

export function isSiteNavGroup(item: SiteNavItem): item is SiteNavGroup {
  return 'items' in item
}
