import { generateStaticParamsFor, importPage } from 'nextra/pages'

import { DocsTocRail } from '@/components/DocsTocRail/DocsTocRail'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

interface PageProps {
  params: Promise<{ mdxPath?: string[] }>
}

interface PageFrontMatter {
  related?: { href: string; label: string }[]
}

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)

  return metadata
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const result = await importPage(params.mdxPath)
  const { default: MDXContent, toc, metadata } = result
  const frontMatter = ('frontMatter' in metadata ? metadata.frontMatter : undefined) as
    | PageFrontMatter
    | undefined
  const mdxPath = params.mdxPath ?? []

  return (
    <div className="flex w-full">
      <article className="prose mx-auto min-w-0 max-w-3xl flex-1 px-6 py-12 lg:px-12">
        <MDXContent {...props} params={params} />
      </article>
      <DocsTocRail mdxPath={mdxPath} related={frontMatter?.related} toc={toc ?? []} />
    </div>
  )
}
