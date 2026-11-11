import { UseCasePage } from '@/components/UseCasePage/UseCasePage'

const CODE = `// Author — pack the eval suite
import { encode, NodePackBuilder } from '@tokenpack/node'

const artifacts = await encode(
  new NodePackBuilder()
    .withFileSystem('./cases',    { include: ['**/*.json'] })   // 500 cases
    .withFileSystem('./fixtures', { include: ['**/*'] })         // reference data
    .withFile('rubric.md', rubricMarkdown)
    .withFile('metadata.json', JSON.stringify({
      name: 'agent-tool-use-eval',
      version: '0.4.2',
      cases: 500,
      shards: 8,
    })),
  { algo: 'router', name: 'agent-tool-use-eval' },
)

// Eval runner — fetch only shard 3 of 8
import { decodeRouter } from '@tokenpack/node'

const router = await decodeRouter(
  'https://evals.example.com/agent-tool-use@0.4.2/router.png',
)

const meta = JSON.parse(await router.text('metadata.json'))
const myShard = 3
const myCases = (await router.list())
  .filter(p => p.startsWith('cases/'))
  .filter((_, i) => i % meta.shards === myShard)

for (const path of myCases) {
  const caseData = await router.json(path)
  const result = await runAgent(caseData.prompt)
  reportToHarness(caseData.expected, result)
}`

export default async function Page() {
  return (
    <UseCasePage
      audience={[
        {
          who: 'Research labs',
          pain: 'Publishing eval suites alongside papers + supplementary materials.',
        },
        {
          who: 'Model vendors',
          pain: 'Distributing evaluation harnesses that customers reproduce.',
        },
        {
          who: 'AI infra teams',
          pain: 'Versioning fixtures, ensuring reruns match the published numbers.',
        },
        { who: 'Eval marketplaces', pain: 'Listing + pinning + auditing benchmark datasets.' },
      ]}
      closingBody={
        <>
          <p>
            Router tokens can bundle versioned datasets for AI evals — inputs, expected outputs,
            grading rubrics, and fixtures in one shareable artifact.
          </p>
          <p>
            If you&apos;re publishing an eval suite alongside a paper or model release, this format
            is a strict upgrade over{' '}
            <em>&ldquo;git repo + Hugging Face dataset + remember to run gen.sh.&rdquo;</em>
          </p>
        </>
      }
      closingTitle={
        <>
          One hash. One artifact.{' '}
          <span className="italic-display">Run it the same way, every time.</span>
        </>
      }
      code={CODE}
      codeLabel="encode suite + run one shard"
      comparisons={[
        {
          title: 'git repo + Hugging Face',
          rows: [
            { label: 'pinning', value: 'commit SHA + branch + regen step', tone: 'bad' },
            { label: 'distribution', value: 'clone or download .zip', tone: 'neutral' },
            { label: 'sharding', value: 'pull all shards anyway', tone: 'bad' },
            { label: 'audit', value: 'reproduce via README', tone: 'bad' },
            { label: 'mirroring', value: 'set up dataset hosting', tone: 'neutral' },
          ],
        },
        {
          title: 'router Image Token (content-addressed)',
          rows: [
            { label: 'pinning', value: 'sha256 of router.png', tone: 'good' },
            { label: 'distribution', value: 'one URL · any static host', tone: 'good' },
            { label: 'sharding', value: 'fetch only the shard you run', tone: 'good' },
            { label: 'audit', value: 'hash = bit-exact contents', tone: 'good' },
            { label: 'mirroring', value: 'copy the PNGs', tone: 'good' },
          ],
        },
      ]}
      index="03"
      nextUseCase={{ href: '/use-cases/agent-handoff', label: 'Agent-to-agent handoff' }}
      problem={
        <>
          <p>
            Evals are folders. You have inputs (prompts, datasets, fixtures), expected outputs,
            grading rubrics, sometimes vendor reference images or PDFs. The suite is usually a git
            repo and a README.
          </p>
          <p>
            Three things go wrong. <strong>Reproducibility:</strong> &ldquo;we ran this against
            commit `8a3f12`&rdquo; — was the fixture file regenerated since? Did someone re-run
            gen.sh? <strong>Distribution:</strong> public datasets get mirrored to HF / S3 / paper
            supplementary; private ones get shared as zips with a million Slack permissions.{' '}
            <strong>Partial loading:</strong> harness runs shard 3 of 8, but `git clone` pulls all 8
            GB anyway.
          </p>
        </>
      }
      solutionBody={
        <>
          <p>
            <strong>One hash, one artifact.</strong> The router Image Token&apos;s bytes are
            content-addressed. Pin the hash; the suite is bit-exactly reproducible.{' '}
            <strong>Static-host friendly.</strong> Hugging Face, S3, R2, GitHub Releases — anywhere
            that serves files works. <strong>Range-fetch by shard.</strong> Pull only the cases for
            the current shard.
          </p>
          <p>
            Wire bytes for shard 3 of an 8-shard 500-case suite: manifest + ~62 cases&apos; worth of
            chunk ranges + the fixtures those cases reference. Not the whole 50 MB.
          </p>
        </>
      }
      solutionSteps={[
        {
          label: 'Pack the suite',
          detail: 'cases + fixtures + rubric.md + metadata.json into one router token.',
        },
        {
          label: 'Hash & publish',
          detail: 'sha256 of router.png pins the version. Drop it on a CDN.',
        },
        {
          label: 'Run a shard',
          detail: 'Runner fetches manifest, filters cases for its shard, range-fetches the bytes.',
        },
        {
          label: 'Report',
          detail: 'Same artifact, same hash, anywhere — reproducible across runs.',
        },
      ]}
      solutionTitle={
        <>
          Pin a <span className="italic-display text-tp-muted">hash,</span> not a git SHA.
        </>
      }
      tag="Reproducibility"
      title={
        <>
          Eval suites that <span className="italic-display text-tp-muted">pin a hash,</span> not a
          git SHA.
        </>
      }
    />
  )
}
