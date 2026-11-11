import fs from 'fs'
import { type NextRequest, NextResponse } from 'next/server'

import {
  networkConditionFor,
  NO_CACHE_HEADERS,
  throttledBody,
} from '../../runtime-benchmark/_shared'
import {
  applyDiffFixturePath,
  findCase,
  findTokenFixture,
  readApplyDiffManifest,
  readParam,
} from '../_shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type TokenKind = 'base' | 'next' | 'diff'

function tokenFileFor(kind: TokenKind, fixture: NonNullable<ReturnType<typeof findTokenFixture>>) {
  if (kind === 'base') return fixture.baseFile
  if (kind === 'diff') return fixture.diffFile

  return fixture.nextFile
}

export async function GET(req: NextRequest) {
  const manifest = readApplyDiffManifest()

  if (!manifest) {
    return NextResponse.json(
      { error: 'apply-diff fixtures not found. Run `yarn benchmark`.' },
      { status: 404 },
    )
  }

  const item = findCase(manifest, readParam(req, 'case'))
  const tokenId = readParam(req, 'token')
  const kind = (readParam(req, 'kind') ?? 'next') as TokenKind
  const condition = networkConditionFor(readParam(req, 'throttle'))

  if (!item)
    return NextResponse.json({ error: 'apply-diff manifest has no cases' }, { status: 404 })
  if (kind !== 'base' && kind !== 'next' && kind !== 'diff') {
    return NextResponse.json({ error: `unsupported token kind: ${kind}` }, { status: 400 })
  }

  const fixture = findTokenFixture(item, tokenId)

  if (!fixture) {
    return NextResponse.json(
      { error: `token fixture not found: ${item.id} ${tokenId ?? '(default)'}` },
      { status: 404 },
    )
  }

  const body = fs.readFileSync(applyDiffFixturePath(tokenFileFor(kind, fixture)))

  return new NextResponse(throttledBody(body, condition), {
    headers: {
      ...NO_CACHE_HEADERS,
      'content-type': 'image/png',
      'content-length': String(body.length),
      'x-apply-diff-bench-case': item.id,
      'x-apply-diff-bench-mode': `${kind}-token`,
      'x-apply-diff-bench-token': fixture.id,
      'x-runtime-bench-throttle': condition.name,
    },
  })
}
