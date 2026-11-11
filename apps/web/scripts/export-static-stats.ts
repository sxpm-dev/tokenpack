import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { GET } from '../src/app/api/benchmark/extended/route'

// Reuse the dashboard calculation with its expected directory layout and pinned inputs.
const [baseline, output] = process.argv.slice(2)
if (!baseline || !output) throw new Error('Expected baseline directory and output file')
const cwd = process.cwd()
const workspace = await mkdtemp(path.join(tmpdir(), 'tokenpack-static-stats-'))
try {
  await symlink(baseline, path.join(workspace, 'benchmark-results'), 'dir')
  process.chdir(workspace)
  const response = await GET()
  if (!response.ok) throw new Error(await response.text())
  await writeFile(output, await response.text())
} finally {
  process.chdir(cwd)
  await rm(workspace, { recursive: true, force: true })
}
