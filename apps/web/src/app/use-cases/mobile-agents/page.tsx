import { UseCasePage } from '@/components/UseCasePage/UseCasePage'

const CODE = `// Mobile / on-device runtime — pull a skill on demand
import { decodeRouter } from '@tokenpack/browser'

const router = await decodeRouter('https://cdn.example.com/skills/x/router.png')

// Cheap: manifest only (a few KB)
const skill = JSON.parse(await router.text('SKILL.md'))

// User activates a specific feature — load the matching reference now
await router.text(\`references/\${skill.feature}.md\`)

// Update path: ship diffs, not new builds
import { decode } from '@tokenpack/browser'

const diffPack = await decode('https://cdn.example.com/skills/x/v2-diff.png')
const v2 = await previousVersion.apply(diffPack)
// → reconstructed v2 bytes — no full re-download`

export default async function Page() {
  return (
    <UseCasePage
      audience={[
        {
          who: 'On-device LLM teams',
          pain: 'Shipping models + tools to phones/tablets with limited storage.',
        },
        {
          who: 'Edge / WASM runtimes',
          pain: 'Hot-loading agent skills without re-downloading full bundles.',
        },
        {
          who: 'Air-gapped deployments',
          pain: 'Mirroring + updating bundles without continuous internet.',
        },
        {
          who: 'OEM / hardware',
          pain: 'Pre-loading optional capability packs and activating them via manifest.',
        },
      ]}
      closingBody={
        <>
          <p>
            Mobile and edge agents will look more like phones — capabilities and skills shipped as
            separate updateable artifacts rather than baked into the binary. The format that wins
            will be the one that&apos;s small, lazy, content-addressed, and survives offline.
          </p>
          <p>
            TokenPack is all four. Static-host friendly. Diff-versioned. Manifest-driven. The
            artifact doesn&apos;t need a server, doesn&apos;t need auth infra, and doesn&apos;t need
            to know about your storage layer.
          </p>
        </>
      }
      closingTitle={
        <>
          Small footprint.{' '}
          <span className="italic-display">Partial updates. Offline-friendly.</span>
        </>
      }
      code={CODE}
      codeLabel="lazy skill load · diff update"
      comparisons={[
        {
          title: 'Traditional app bundle',
          rows: [
            { label: 'install size', value: 'full bundle every release', tone: 'bad' },
            { label: 'updates', value: 'redownload everything', tone: 'bad' },
            { label: 'capability packs', value: 'native modules · per platform', tone: 'bad' },
            { label: 'offline', value: 'cache locally · re-fetch on update', tone: 'neutral' },
            { label: 'mirroring', value: 'app store / OTA infra', tone: 'bad' },
          ],
        },
        {
          title: 'router Image Token bundle',
          rows: [
            { label: 'install size', value: 'manifest + first-use files', tone: 'good' },
            { label: 'updates', value: 'diff tokens · KB not MB', tone: 'good' },
            {
              label: 'capability packs',
              value: 'Image Token per pack · activate by manifest',
              tone: 'good',
            },
            { label: 'offline', value: 'all bytes cached are usable', tone: 'good' },
            { label: 'mirroring', value: 'any static CDN · S3 / R2 / Pages', tone: 'good' },
          ],
        },
      ]}
      index="07"
      nextUseCase={{ href: '/use-cases/ai-skills', label: 'Ship agent skills as one Image Token' }}
      problem={
        <>
          <p>
            On-device LLM runtimes — phones, tablets, embedded edge boxes, browser-side WASM — have
            hard limits on storage and bandwidth. Shipping a full bundle on every update is
            wasteful. Cold-loading every capability on startup is slow.
          </p>
          <p>
            Traditional app distribution couples the bundle to the binary. Capability packs need
            native module loading. Offline use depends on a local cache that&apos;s never quite up
            to date.
          </p>
        </>
      }
      solutionBody={
        <>
          <p>
            Treat each capability or skill as a router token, hosted statically. The runtime holds
            the manifest cheaply. Range-fetch loads only the files the user actually activates. Diff
            tokens ship KB-sized updates between releases.
          </p>
          <p>
            <strong>Offline-first by accident.</strong> Bytes you&apos;ve already cached stay
            usable. Updates touch only changed chunks. Mirror to any CDN; the artifact doesn&apos;t
            care.
          </p>
        </>
      }
      solutionSteps={[
        {
          label: 'Pack capabilities',
          detail: 'Each agent skill / capability becomes its own router token.',
        },
        {
          label: 'Manifest-first install',
          detail: 'Runtime fetches only manifests on first run; bytes arrive lazily.',
        },
        {
          label: 'Diff updates',
          detail: 'Releases ship diff tokens; consumer applies against cached version.',
        },
        {
          label: 'Offline replay',
          detail: 'Cached bytes work without network; missing bytes degrade gracefully.',
        },
      ]}
      solutionTitle={
        <>
          Each capability is a token.{' '}
          <span className="italic-display text-tp-muted">Range-fetch is your installer.</span>
        </>
      }
      tag="On-device"
      title={
        <>
          Mobile and edge agents that{' '}
          <span className="italic-display text-tp-muted">update by the kilobyte.</span>
        </>
      }
    />
  )
}
