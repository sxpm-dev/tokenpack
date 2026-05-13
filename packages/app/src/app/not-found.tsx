import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#101010] px-8 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.24em] text-white/35">Not found</p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <Link
          className="mt-8 inline-flex rounded border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-white/35 hover:text-white"
          href="/"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  )
}
