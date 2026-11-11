import { readFile } from 'node:fs/promises'
import path from 'node:path'

import index from '../../../../docs/guides/index.json'

export const workflowGuides = index

export async function readWorkflowGuide(slug: string) {
  if (!workflowGuides.some(guide => guide.slug === slug)) return null

  return readFile(path.resolve(process.cwd(), '../../docs/guides', `${slug}.md`), 'utf8')
}
