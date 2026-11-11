import Link from 'next/link'
import type { ReactNode } from 'react'

// Shared layout primitives for the long-form Tokens story pages.
// Pattern: narrow prose blocks (max-w-3xl) interleaved with wider diagrams.

interface StoryPageProps {
  children: ReactNode
}

export function StoryPage({ children }: StoryPageProps) {
  return (
    <main className="border-b border-tp-border">
      <article className="mx-auto max-w-5xl px-6 py-16 lg:py-24">{children}</article>
    </main>
  )
}

interface StoryHeaderProps {
  title: string
  lede: string
}

export function StoryHeader({ title, lede }: StoryHeaderProps) {
  return (
    <header className="mx-auto mb-16 max-w-3xl">
      <h1 className="text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] font-medium tracking-[-0.025em]">
        {title}
      </h1>
      <p className="mt-6 text-[18px] leading-8 text-tp-muted">{lede}</p>
    </header>
  )
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mb-8 flex max-w-3xl flex-col gap-5 text-[16px] leading-8 text-tp-muted">
      {children}
    </div>
  )
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-8 mb-2 text-[clamp(1.4rem,2.4vw,2rem)] leading-[1.15] font-medium tracking-[-0.02em] text-tp-fg">
      {children}
    </h2>
  )
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="font-mono text-[0.95em] text-tp-fg">{children}</code>
}

export function PageLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      className="text-tp-fg underline decoration-tp-border underline-offset-4 hover:decoration-tp-accent"
      href={href}
    >
      {children}
    </Link>
  )
}

export function Diagram({ children }: { children: ReactNode }) {
  return <div className="my-12">{children}</div>
}
