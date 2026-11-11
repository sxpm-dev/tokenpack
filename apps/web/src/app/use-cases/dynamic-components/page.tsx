import { UseCasePage } from '@/components/UseCasePage/UseCasePage'

const CODE = `// Producer — pack the whole component universe.
import { encode, NodePackBuilder } from '@tokenpack/node'

const r = await encode(
  new NodePackBuilder()
    .withFile('component.js',         bundledJs)
    .withFile('component.css',        bundledCss)
    .withFile('types.d.ts',           types)
    .withFile('contracts.schema.json', contracts)
    .withFile('validation.json',      validationRules)
    .withFileSystem('./assets'),
  { algo: 'router' },
)
// → component.png

// Consumer — fetch only the slots actually used.
import { decodeRouter } from '@tokenpack/browser'

const c = await decodeRouter('https://cdn.example.com/component.png')

// Render? grab CSS + JS.
await c.materialize(['component.css', 'component.js'])

// Validate inbound data? grab the schema.
const schema = await c.json('contracts.schema.json')

// Lazy-load an icon set only when needed.
const iconBytes = await c.blob('assets/icons/sprite.svg')`

export default async function Page() {
  return (
    <UseCasePage
      audience={[
        {
          who: 'Micro-frontend platforms',
          pain: 'Shipping a component = npm publish + version pin + bundler config + asset CDN.',
        },
        {
          who: 'Design system teams',
          pain: 'Components ship JS, but consumers also want types, schemas, docs, and assets — and want them lazy.',
        },
        {
          who: 'Embeddable widget vendors',
          pain: 'iframe + postMessage + asset CDN + version negotiation is a lot of moving parts.',
        },
        {
          who: 'Dashboard composition tools',
          pain: 'Each widget brings its own bundle. Tree-shaking across boundaries is hard.',
        },
      ]}
      closingBody={
        <>
          <p>
            A component isn&apos;t just JS — it&apos;s JS + CSS + types + JSON schemas + validation
            rules + assets + docs. Today each of those lives in a different artifact: npm package,
            asset CDN, schema registry, types index, docs site. Consumers stitch them together at
            build time.
          </p>
          <p>
            A router token collapses that universe into <strong>one Image Token</strong>. The
            manifest declares the slots. Consumers pull only the parts they touch — render with
            CSS+JS, validate against the schema, lazy-load an asset on first click. The whole
            package travels through any image-friendly pipe; no bundler required.
          </p>
        </>
      }
      closingTitle={
        <>
          A component is more than JS.{' '}
          <span className="italic-display">Ship the whole universe.</span>
        </>
      }
      code={CODE}
      codeLabel="encode bundle · materialize · range-fetch"
      comparisons={[
        {
          title: 'npm + bundler + asset CDN',
          rows: [
            {
              label: 'shipping unit',
              value: 'package · CDN · types · docs separately',
              tone: 'bad',
            },
            { label: 'consumer setup', value: 'install + bundler config', tone: 'bad' },
            { label: 'lazy assets', value: 'manual code-splitting', tone: 'neutral' },
            { label: 'version pinning', value: 'semver in package.json', tone: 'neutral' },
            { label: 'cross-host', value: 'register on npm + publish', tone: 'bad' },
          ],
        },
        {
          title: 'TokenPack component artifact',
          rows: [
            {
              label: 'shipping unit',
              value: 'one router Image Token · everything inside',
              tone: 'good',
            },
            { label: 'consumer setup', value: 'one decode call · no bundler', tone: 'good' },
            { label: 'lazy assets', value: 'range-fetch by manifest path', tone: 'good' },
            { label: 'version pinning', value: 'sha256 of the token', tone: 'good' },
            { label: 'cross-host', value: 'any static CDN · MIT format', tone: 'good' },
          ],
        },
      ]}
      index="07"
      nextUseCase={{ href: '/use-cases/json-partial', label: 'Pack big JSON, fetch by path' }}
      problem={
        <>
          <p>
            A UI component these days carries baggage: minified JS, scoped CSS, type declarations,
            JSON schemas for validation, asset bundles, docs, sometimes a playground. Each piece is
            shipped through a different channel — npm, asset CDN, schema registry, types index.
          </p>
          <p>
            Consumers stitch the channels together at build time. Adding a component means: install
            the npm package, add the bundler config, register the schema, deploy the assets, link
            the types. Want to lazy-load the icon set? Write a code-split boundary. Want to
            version-pin everything? Reconcile five different version strings.
          </p>
        </>
      }
      solutionBody={
        <>
          <p>
            <strong>One token, one universe.</strong> The component&apos;s JS, CSS, types, schemas,
            validation rules, and assets all live as named entries in a router token. The consumer
            decodes once. Need to render?{' '}
            <code>{`materialize(['component.js', 'component.css'])`}</code>. Need to validate
            inbound data? <code>{`router.json('contracts.schema.json')`}</code>. Need an asset only
            on click? <code>{`router.blob('assets/icons/sprite.svg')`}</code>.
          </p>
          <p>
            <strong>Lazy by default.</strong> The manifest is small — first byte over the wire is
            cheap. Slots load on demand. The whole package travels through any image-friendly pipe —
            chat, CDN, internal storage, agent context.
          </p>
        </>
      }
      solutionSteps={[
        {
          label: 'Pack',
          detail:
            'Author bundles JS, CSS, types, schemas, validation, assets into one router token.',
        },
        { label: 'Publish', detail: 'Drop the Image Token on a static host. Pin by sha256.' },
        {
          label: 'Mount',
          detail: 'Consumer materialize()s the JS + CSS slots into the host page.',
        },
        {
          label: 'Lazy slots',
          detail: 'Schemas, types, and assets stay range-fetched on first use.',
        },
      ]}
      solutionTitle={
        <>
          The component artifact <span className="italic-display text-tp-muted">is</span> the
          universe.
        </>
      }
      tag="Dynamic component artifact"
      title={
        <>
          Ship UI components with their{' '}
          <span className="italic-display text-tp-muted">entire universe.</span>
        </>
      }
    />
  )
}
