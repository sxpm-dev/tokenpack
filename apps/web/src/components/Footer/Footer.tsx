import Link from 'next/link'

import { footerNavGroups, type SiteNavLink } from '@/lib/siteNav'

export function Footer() {
  return (
    <footer className="bg-tp-bg">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link className="flex items-center gap-2.5 font-medium" href="/">
            <span className="grid h-7 w-7 place-items-center rounded-sm bg-tp-accent text-tp-accent-fg">
              <span className="text-[14px] leading-none">▣</span>
            </span>
            <span className="tracking-tight">TokenPack</span>
          </Link>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-tp-muted">
            <span className="italic-display">Files, encoded into images.</span> Decoded back,
            anywhere. A container format for the places ordinary archives can&apos;t go.
          </p>
          <p className="mt-6 font-mono text-[11px] tracking-[0.08em] text-tp-soft uppercase">
            MIT licensed · codeart monorepo
          </p>
        </div>
        {footerNavGroups.map(group => (
          <FooterColumn key={group.label} links={group.items} title={group.label} />
        ))}
      </div>
      <div className="border-t border-tp-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-[11px] text-tp-muted">
          <span className="font-mono">tokenpack@workspace:*</span>
          <span>
            Built with <span className="italic-display">deliberate</span> aesthetics.
          </span>
        </div>
      </div>
    </footer>
  )
}

interface FooterColumnProps {
  title: string
  links: SiteNavLink[]
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3 className="mb-3 font-mono text-[11px] tracking-[0.12em] text-tp-soft uppercase">
        {title}
      </h3>
      <ul className="space-y-2 text-[13px]">
        {links.map(link => (
          <li key={link.href}>
            {link.external ? (
              <a
                className="text-tp-muted hover:text-tp-fg"
                href={link.href}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ) : (
              <Link className="text-tp-muted hover:text-tp-fg" href={link.href}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
