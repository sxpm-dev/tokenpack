import { VibeArtifactsDiagram } from '@/components/Rough/VibeArtifactsDiagram'
import { UseCasePage } from '@/components/UseCasePage/UseCasePage'

const CODE = `// Producer side — your AI agent emits an interactive prototype.
import { encode, NodePackBuilder } from '@tokenpack/node'

const r = await encode(
  new NodePackBuilder()
    .withFile('index.html', generatedHtml)
    .withFile('app.js',     generatedJs)
    .withFile('styles.css', generatedCss)
    .withBuffer('assets/logo.png', logoBytes),
  { algo: 'router' },
)
const url = await uploadToStaticHost(r) // any CDN, R2, S3 with public read

// Recipient side — paste the URL anywhere a browser can fetch it.
import { decodeRouter } from '@tokenpack/browser'

const router = await decodeRouter(url)
await router.materialize(['app.js', 'styles.css'])
// The prototype is now LIVE in the host page's DOM.
// No build step, no deploy, no account, no extension.`

export default async function Page() {
  return (
    <UseCasePage
      audience={[
        {
          who: 'AI app builders (v0, Lovable, Bolt, Cursor agents)',
          pain: 'Generated apps need a deploy target. Vercel + auth + git. Slow and account-bound.',
        },
        {
          who: 'LLM coding agents',
          pain: 'Output a working UI for the user — but the user has to "run" it somewhere first.',
        },
        {
          who: 'Designers + PMs prototyping with AI',
          pain: 'Sharing a prototype = paste a Codesandbox URL = vendor lock-in, account walls.',
        },
        {
          who: 'Internal tool platforms',
          pain: 'Letting employees ship generated tools without standing up a deploy pipeline.',
        },
      ]}
      closingBody={
        <>
          <p>
            <strong>Vibe coding</strong> — LLMs producing working interfaces on demand — needs a
            shipping format. Today the format is &ldquo;deploy it somewhere&rdquo;: Vercel,
            Codesandbox, GitHub Pages, a corporate intranet. Each adds an account, an auth step, and
            a vendor.
          </p>
          <p>
            A router token is <strong>the artifact itself</strong>. Encode it in the producer, paste
            the URL in the consumer, call <code>materialize()</code>. No deploy. No build server. No
            account. The same applies beyond AI-generated apps — internal dev tools, one-off
            dashboards, embeddable widgets, demo UIs.
          </p>
        </>
      }
      closingTitle={
        <>
          Generated apps as <span className="italic-display">pasteable PNGs.</span>
        </>
      }
      code={CODE}
      codeLabel="encode → share → materialize"
      comparisons={[
        {
          title: 'Vercel / Codesandbox / GH Pages',
          rows: [
            { label: 'deploy step', value: 'required · per artifact', tone: 'bad' },
            { label: 'auth', value: 'account · per platform', tone: 'bad' },
            { label: 'sharing', value: 'unique URL per deploy', tone: 'neutral' },
            { label: 'revisions', value: 'redeploy on each change', tone: 'bad' },
            { label: 'offline', value: 'no — server-bound', tone: 'bad' },
            { label: 'vendor lock', value: 'tied to platform', tone: 'bad' },
          ],
        },
        {
          title: 'TokenPack router · materialize',
          rows: [
            { label: 'deploy step', value: 'static file upload · once', tone: 'good' },
            { label: 'auth', value: 'static URL · no IAM', tone: 'good' },
            { label: 'sharing', value: 'paste the Image Token anywhere', tone: 'good' },
            { label: 'revisions', value: 'diff tokens · KB updates', tone: 'good' },
            { label: 'offline', value: 'cached bytes still run', tone: 'good' },
            { label: 'vendor lock', value: 'any static host · MIT format', tone: 'good' },
          ],
        },
      ]}
      heroDiagram={<VibeArtifactsDiagram />}
      index="06"
      nextUseCase={{ href: '/use-cases/agent-orchestration', label: 'Agent orchestration' }}
      problem={
        <>
          <p>
            LLM-generated apps, prototypes, and tools have a shipping problem. The model writes an
            HTML + JS + CSS bundle in seconds. Getting it in front of a human takes minutes — git
            push, Vercel deploy, share a URL, hope the link doesn&apos;t rot.
          </p>
          <p>
            Every existing shape is heavy: <strong>Vercel / Netlify / Pages</strong> means a deploy
            step + account + build pipeline. <strong>Codesandbox / StackBlitz</strong> means vendor
            lock-in and an account wall.
            <strong> Zip + npm install</strong> means a dev environment on the recipient&apos;s
            machine. <strong>Browser extensions / userscripts</strong> mean installation friction.
            None of them treat the prototype as just an <em>artifact you can paste</em>.
          </p>
        </>
      }
      solutionBody={
        <>
          <p>
            <strong>Pack the prototype as a router token.</strong> HTML, JS, CSS, assets all live in
            one Image Token. Upload it to any static host (or attach it to a chat). On the consumer
            side, the runtime calls <code>router.materialize()</code>: CSS injects into the
            document, JS executes in <code>&lt;body&gt;</code>, the app is live.
          </p>
          <p>
            <strong>No deploy. No build server. No account.</strong> The artifact is the deploy.
            Diff tokens ship updates as kilobytes between revisions. Mirror to any CDN. Run offline
            once the bytes are cached.
          </p>
        </>
      }
      solutionSteps={[
        {
          label: 'Generate',
          detail: 'AI agent (or human, or both) writes the HTML / JS / CSS for a prototype.',
        },
        {
          label: 'Encode',
          detail: 'Wrap the files into a router token. One Image Token, manifest-indexed.',
        },
        {
          label: 'Share',
          detail: 'Upload to a CDN / R2 / Pages. Paste the URL anywhere a browser can reach.',
        },
        {
          label: 'Materialize',
          detail: 'Recipient calls router.materialize() — DOM runs the app in place.',
        },
      ]}
      solutionTitle={
        <>
          The artifact <span className="italic-display text-tp-muted">is</span> the deploy.
        </>
      }
      tag="Vibe-coded · runnable artifacts"
      title={
        <>
          Generated apps and tools as{' '}
          <span className="italic-display text-tp-muted">pasteable PNGs.</span>
        </>
      }
    />
  )
}
