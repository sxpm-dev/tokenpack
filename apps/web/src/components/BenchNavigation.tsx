import Link from 'next/link'

const links = [
  ['/server-fetch-bench', 'Server fetch'],
  ['/browser-fetch-bench', 'Browser fetch'],
  ['/apply-diff-bench', 'Apply diff'],
  ['/scenarios/diff-versioning', 'Diff matrix'],
  ['/json-playground', 'JSON paths'],
  ['/encode-decode-bench', 'Encode / decode'],
]

export function BenchNavigation() {
  return (
    <nav
      aria-label="Benchmarks and playgrounds"
      className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-3 border-b border-tp-border px-5 py-5 text-sm"
    >
      {links.map(([href, label]) => (
        <Link
          key={href}
          className="text-tp-muted hover:text-tp-fg focus-visible:outline-2 focus-visible:outline-offset-4"
          href={href}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
