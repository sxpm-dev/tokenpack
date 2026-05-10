import { jsonNoCache } from '../../runtime-benchmark/_shared'
import { readApplyDiffManifest } from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const manifest = readApplyDiffManifest()

  if (!manifest) {
    return jsonNoCache({
      available: false,
      hint: 'Run `yarn benchmark` to generate apply-diff benchmark fixtures.',
      cases: [],
      tokenVariants: [],
    })
  }

  return jsonNoCache({ available: true, ...manifest })
}
