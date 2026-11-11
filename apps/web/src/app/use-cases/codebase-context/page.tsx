import { CodebaseContextDiagram } from '@/components/Rough/CodebaseContextDiagram'
import { UseCasePage } from '@/components/UseCasePage/UseCasePage'

const CODE = `// User side — encode the project
// $ yarn tokenpack pack-router ./my-app \\
//     --exclude "node_modules,.next,dist,*.lock" \\
//     --out ./my-app.png

// Drop my-app.png into the agent's chat. Or share the URL.

// Agent runtime — selective load
import { decodeRouter } from '@tokenpack/node'

// 1. Fetch the manifest (one HTTP, few KB)
const router = await decodeRouter('https://share.example.com/my-app.png')

// 2. Cheap tree exploration — agent can grep the file list
const files = await router.list()
// → ['package.json', 'next.config.ts',
//     'src/auth/session.ts', 'src/components/...', ...]

// 3. When the agent wants a file, range-fetch just that file
const session = await router.text('src/auth/session.ts')
// HTTP: GET chunk-N.png with Range: bytes=A-B`

export default async function Page() {
  return (
    <UseCasePage
      audience={[
        {
          who: 'Agent developers',
          pain: 'Per-file upload step + storage just to enable "find the bug" workflows.',
        },
        {
          who: 'Privacy-aware users',
          pain: 'Uploading whole repo to a managed context = trust + storage cost.',
        },
        {
          who: 'Editor agents',
          pain: 'Spinning up a file-tool server for every repo to enable cheap reads.',
        },
        {
          who: 'Reviewers / auditors',
          pain: "Sharing snapshots across orgs requires shared infra you don't have.",
        },
      ]}
      closingBody={
        <>
          <p>
            Codebase sharing is one of the most common things users want to do with AI agents. The
            current friction — upload churn, full-repo context bloat, hosted file servers — is real.
            A static Image Token you drop into any chat, plus a lazy-load runtime, removes most of
            that friction.
          </p>
          <p>
            For continuous development, keep MCP. For <strong>snapshots</strong> — review my repo,
            audit my commit, find the bug — a router token wins.
          </p>
        </>
      }
      closingTitle={
        <>
          A repo becomes a <span className="italic-display">file you can drop into a chat.</span>
        </>
      }
      code={CODE}
      codeLabel="encode + selective load"
      comparisons={[
        {
          title: 'Vector DB / upload',
          rows: [
            { label: 'setup', value: 'index + embed pipeline', tone: 'bad' },
            { label: 'wire cost', value: 'whole repo, every session', tone: 'bad' },
            { label: 'edits', value: 're-upload on every change', tone: 'bad' },
            { label: 'context bloat', value: 'full repo in window', tone: 'bad' },
            { label: 'auth', value: 'requires managed infra', tone: 'neutral' },
          ],
        },
        {
          title: 'router Image Token',
          rows: [
            { label: 'setup', value: 'one encode pass', tone: 'good' },
            { label: 'wire cost', value: 'manifest + bytes actually read', tone: 'good' },
            { label: 'edits', value: 'diff tokens · ship deltas', tone: 'good' },
            { label: 'context bloat', value: "agent loads what it grep'd for", tone: 'good' },
            { label: 'auth', value: 'cookies / signed URLs', tone: 'good' },
          ],
        },
      ]}
      heroDiagram={<CodebaseContextDiagram />}
      index="02"
      nextUseCase={{ href: '/use-cases/eval-suites', label: 'Reproducible eval suites' }}
      problem={
        <>
          <p>
            Users want to share a project with an AI: <em>review my repo</em>,{' '}
            <em>find the bug in this app</em>, <em>explain the auth flow</em>. Today&apos;s choices
            are:
          </p>
          <p>
            <strong>Paste files one by one.</strong> Slow, lossy, no structure.{' '}
            <strong>Upload to project context.</strong> Re-uploads on every edit; whole repo enters
            the context window even when the agent only needs three files.{' '}
            <strong>Tool-call file reads against a hosted endpoint.</strong> Requires exposing a
            server. Good for IDE agents; not for &ldquo;have my friend look at this.&rdquo;
          </p>
        </>
      }
      solutionBody={
        <>
          <p>
            Encode the repo as a router token. The manifest <strong>is</strong> the file tree.
            Range-fetch <strong>is</strong> the lazy load. Share one Image Token; the agent&apos;s
            runtime pulls only the files it actually needs.
          </p>
          <p>
            For a 5 MB codebase, an agent investigating one file pulls maybe 30 KB on the wire
            (manifest + the file&apos;s chunk range). The other 4.97 MB never leaves the host. No
            vector DB. No upload churn. No hosted file server.
          </p>
        </>
      }
      solutionSteps={[
        {
          label: 'Encode once',
          detail: 'Pack the repo into a router token. Manifest = file tree.',
        },
        { label: 'Share', detail: 'Drop the Image Token in any chat or paste a CDN URL.' },
        {
          label: 'Explore cheap',
          detail: 'Agent reads the file list from the manifest — no chunk fetched yet.',
        },
        {
          label: 'Range-fetch',
          detail: 'Agent reads one file; runtime issues a single HTTP Range request.',
        },
      ]}
      solutionTitle={
        <>
          The manifest is your file tree.{' '}
          <span className="italic-display text-tp-muted">Range-fetch is your lazy load.</span>
        </>
      }
      tag="Agent context"
      title={
        <>
          Send a whole codebase.{' '}
          <span className="italic-display text-tp-muted">
            Pay only for the files the agent reads.
          </span>
        </>
      }
    />
  )
}
