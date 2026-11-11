import { UseCasePage } from '@/components/UseCasePage/UseCasePage'

const CODE = `// Orchestrator — produce the handoff artifact
import { encode, NodePackBuilder } from '@tokenpack/node'

async function produceHandoff(runOutput: RunOutput): Promise<Buffer> {
  const artifacts = await encode(
    new NodePackBuilder()
      .withFile('plan.md',           runOutput.plan)
      .withFile('metadata.json',     JSON.stringify(runOutput.metadata))
      .withBuffer('code/app.tsx',    runOutput.codeFiles.app)
      .withBuffer('code/api.ts',     runOutput.codeFiles.api)
      .withBuffer('screenshots/desktop.png', runOutput.screenshots.desktop)
      .withBuffer('screenshots/mobile.png',  runOutput.screenshots.mobile)
      .withBuffer('traces/run.jsonl', runOutput.traces),
    { algo: 'router', name: \`run-\${runOutput.id}\` },
  )
  return Buffer.from(await artifacts[0].blob.arrayBuffer())
}

// Reviewer agent — only cares about plan + code
async function reviewerAgent(handoffUrl: string) {
  const router = await decodeRouter(handoffUrl)
  const plan    = await router.text('plan.md')
  const appCode = await router.text('code/app.tsx')
  const apiCode = await router.text('code/api.ts')
  return runReviewModel({ plan, appCode, apiCode })
}

// QA agent — only cares about visuals + traces
async function qaAgent(handoffUrl: string) {
  const router  = await decodeRouter(handoffUrl)
  const desktop = await router.blob('screenshots/desktop.png')
  const mobile  = await router.blob('screenshots/mobile.png')
  const traces  = await router.text('traces/run.jsonl')
  return runQaModel({ screenshots: [desktop, mobile], traces })
}`

export default async function Page() {
  return (
    <UseCasePage
      audience={[
        {
          who: 'Agent orchestrators',
          pain: 'Each downstream agent needs different slices of the same output.',
        },
        {
          who: 'Multi-host workflows',
          pain: 'Crossing org boundaries — Slack to GitHub to internal infra to public CDN.',
        },
        {
          who: 'CI / CD agents',
          pain: 'Passing structured + binary outputs without setting up a blob store per pipeline.',
        },
        {
          who: 'Research workflows',
          pain: 'Reviewer A reads X, reviewer B reads Y — but they share the same source bundle.',
        },
      ]}
      closingBody={
        <>
          <p>
            Multi-agent orchestration is real now, and it has a real handoff problem. The current
            shape — JSON in the message + ad-hoc S3 paths — is fine for toy demos and brittle in
            production.
          </p>
          <p>
            A self-describing portable artifact is a genuine simplification. The manifest declares
            the shape; downstream agents pull only the keys they care about; the artifact travels
            through any pipe that carries an image.
          </p>
        </>
      }
      closingTitle={
        <>
          Pass <span className="italic-display">structured blobs,</span> not JSON + a bucket.
        </>
      }
      code={CODE}
      codeLabel="orchestrator → reviewer / QA"
      comparisons={[
        {
          title: 'JSON + S3 + signed URLs',
          rows: [
            { label: 'setup', value: 'IAM per agent · per pipeline', tone: 'bad' },
            { label: 'binary attachments', value: 'inflates the message', tone: 'bad' },
            { label: 'selective reads', value: 'separate URLs per asset', tone: 'neutral' },
            { label: 'cross-host', value: 'shared credentials needed', tone: 'bad' },
            { label: 'discoverability', value: 'undocumented bucket layout', tone: 'bad' },
          ],
        },
        {
          title: 'router Image Token handoff',
          rows: [
            { label: 'setup', value: 'static host · no IAM', tone: 'good' },
            { label: 'binary attachments', value: 'inside the artifact', tone: 'good' },
            { label: 'selective reads', value: 'one fetch per key', tone: 'good' },
            { label: 'cross-host', value: 'any pipe that carries an image', tone: 'good' },
            { label: 'discoverability', value: 'manifest IS the schema', tone: 'good' },
          ],
        },
      ]}
      index="04"
      nextUseCase={{ href: '/use-cases/ai-skills', label: 'Ship agent skills as one Image Token' }}
      problem={
        <>
          <p>
            Multi-agent workflows — orchestrator → worker → reviewer; planner → coder → tester;
            researcher → writer → editor — need a way to pass artifacts between steps. Today that
            looks like:
          </p>
          <p>
            <strong>Pre-signed S3 URLs.</strong> Works, but each agent needs S3 credentials and a
            shared bucket. New project, new IAM setup. <strong>JSON blobs in messages.</strong> Fine
            for small things; falls over when an upstream agent produces screenshots, traces, code
            samples. <strong>Files in a shared workspace.</strong> Couples agents to a runtime;
            doesn&apos;t cross host boundaries.
          </p>
        </>
      }
      solutionBody={
        <>
          <p>
            A router token is a <strong>structured blob with self-describing schema</strong>. The
            manifest declares what&apos;s inside; each agent fetches only the parts relevant to its
            role.
          </p>
          <p>
            The orchestrator attaches one Image Token to multiple downstream agents. The reviewer
            pulls plan.md + code/. The QA pulls screenshots/ + traces/. The auditor pulls
            metadata.json. No agent pays the full bundle cost; each pays only for the keys it
            inspects.
          </p>
        </>
      }
      solutionSteps={[
        {
          label: 'Produce',
          detail:
            'Orchestrator wraps run output — code, screenshots, traces, metadata — into a router token.',
        },
        { label: 'Attach', detail: 'Pass the URL (or inline Image Token) to N downstream agents.' },
        {
          label: 'Read selectively',
          detail: 'Each agent reads only the manifest keys it cares about. Pay per key.',
        },
        {
          label: 'Audit',
          detail: 'Hash the artifact for provenance. Replay later from the same hash.',
        },
      ]}
      solutionTitle={
        <>
          One artifact, declared by manifest.{' '}
          <span className="italic-display text-tp-muted">N agents pay per key.</span>
        </>
      }
      tag="Multi-agent"
      title={
        <>
          Agent-to-agent handoff as{' '}
          <span className="italic-display text-tp-muted">one self-describing blob.</span>
        </>
      }
    />
  )
}
