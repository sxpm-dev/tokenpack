import Link from 'next/link'

import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle'
import { isSiteNavGroup, siteNavItems, type SiteNavLink } from '@/lib/siteNav'

interface SiteNavProps {
  contextLabel?: string
}

const navLinkClass =
  'rounded-md px-2.5 py-1.5 text-tp-muted transition-colors hover:bg-tp-elev2 hover:text-tp-fg'

export function SiteNav({ contextLabel = '· v0.1 · alpha' }: SiteNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-tp-border bg-tp-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3.5">
        <Link className="flex shrink-0 items-center gap-2.5 font-medium" href="/">
          <span className="grid h-7 w-7 place-items-center rounded-sm bg-tp-accent text-tp-accent-fg">
            <span className="text-[14px] leading-none">▣</span>
          </span>
          <span className="text-[15px] tracking-tight">TokenPack</span>
          <span className="hidden text-[10px] tracking-[0.16em] text-tp-muted uppercase sm:inline">
            {contextLabel}
          </span>
        </Link>
        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 text-[13px]">
          {siteNavItems.map(item =>
            isSiteNavGroup(item) ? (
              <details
                key={item.label}
                className="group relative [&>summary::-webkit-details-marker]:hidden"
              >
                <summary
                  className={`${navLinkClass} flex cursor-pointer list-none items-center gap-1`}
                >
                  {item.label}
                  <span aria-hidden="true" className="text-[10px] text-tp-soft">
                    ▾
                  </span>
                </summary>
                <div className="absolute right-0 z-50 mt-2 min-w-40 rounded-md border border-tp-border bg-tp-elev p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
                  {item.items.map(child => (
                    <NavLink key={child.href} className="block whitespace-nowrap" link={child} />
                  ))}
                </div>
              </details>
            ) : (
              <NavLink key={item.href} link={item} />
            ),
          )}
          <a
            className={navLinkClass}
            href="https://github.com/anthropics/codeart"
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <div className="mx-1 h-5 w-px bg-tp-border" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}

function NavLink({ className = '', link }: { className?: string; link: SiteNavLink }) {
  if (link.external) {
    return (
      <a
        className={`${navLinkClass} ${className}`}
        href={link.href}
        rel="noreferrer"
        target="_blank"
      >
        {link.label}
      </a>
    )
  }

  return (
    <Link className={`${navLinkClass} ${className}`} href={link.href}>
      {link.label}
    </Link>
  )
}
