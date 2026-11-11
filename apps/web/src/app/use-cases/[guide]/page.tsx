import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { sitePath } from '@/lib/site-path'

import { readWorkflowGuide, workflowGuides } from '@/lib/workflow-guides'

import { VerifyExample } from './verify-example'

export const dynamicParams = false
export function generateStaticParams() {
  return workflowGuides.map(({ slug }) => ({ guide: slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ guide: string }> }) {
  const { guide } = await params

  return { title: workflowGuides.find(item => item.slug === guide)?.title ?? 'Workflow guide' }
}

export default async function WorkflowGuide({ params }: { params: Promise<{ guide: string }> }) {
  const { guide } = await params
  const markdown = await readWorkflowGuide(guide)

  if (!markdown) notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link className="text-sm underline underline-offset-4" href="/use-cases">
        All workflow guides
      </Link>
      <article className="prose mt-8 max-w-none break-words [&_pre]:overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={sitePath(href ?? "")}>{children}</a> }}>{markdown}</ReactMarkdown>
      </article>
      <VerifyExample slug={guide} />
    </main>
  )
}
