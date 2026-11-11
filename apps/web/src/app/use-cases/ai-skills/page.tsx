import { SkillDistributionDiagram } from '@/components/Rough/SkillDistributionDiagram'
import { UseCasePage } from '@/components/UseCasePage/UseCasePage'

const CODE = `// Author side — encode a skill folder
import { encode, NodePackBuilder } from '@tokenpack/node'

const artifacts = await encode(
  new NodePackBuilder()
    .withFile('SKILL.md', skillMarkdown)
    .withFileSystem('./references', { include: ['**/*.md'] })
    .withFileSystem('./assets', { exclude: ['*.psd'] })
    .withGlob('evals/**/*.json'),
  { algo: 'router', name: 'my-skill' },
)

// Consumer — install with one fetch (manifest only)
import { decodeRouter } from '@tokenpack/node'

const router = await decodeRouter('https://cdn.example.com/my-skill/router.png')
const files = await router.list()

// Cheap: write SKILL.md immediately, lazy-load the rest
await fs.writeFile(
  '~/.claude/skills/my-skill/SKILL.md',
  await router.text('SKILL.md'),
)

// One-liner CLI install
// $ npx tokenpack install https://cdn.example.com/my-skill/router.png`

export default async function Page() {
  return (
    <UseCasePage
      audience={[
        {
          who: 'Skill / plugin authors',
          pain: 'Distribution = "git clone the repo, copy folders, hope user did it right".',
        },
        {
          who: 'Marketplace builders',
          pain: 'Listings need preview metadata without dragging the full bundle on every page view.',
        },
        {
          who: 'Air-gapped / enterprise',
          pain: 'Mirror operations across npm + git + private registries.',
        },
        {
          who: 'End users',
          pain: 'No way to verify "this skill is exactly the one I trust" — git SHA isn\'t a hash.',
        },
      ]}
      closingBody={
        <>
          <p>
            The codebase already aims here — <strong>`tokenpack-claude-skill`</strong> is a
            workspace in this monorepo. Activation energy is low because Claude Code, Cursor, and
            MCP all accept folders today; a router-token loader is a thin shim.
          </p>
          <p>
            The demo is visceral: <strong>`npx tokenpack install &lt;url&gt;`</strong> getting you a
            complete skill in one fetch is a clear, viral story.
          </p>
        </>
      }
      closingTitle={
        <>
          The format collapses <span className="italic-display">distribution</span> of skill bundles
          into one URL.
        </>
      }
      code={CODE}
      codeLabel="encode + lazy install"
      comparisons={[
        {
          title: 'git clone + copy',
          rows: [
            { label: 'install', value: '~30 s · clone + copy', tone: 'bad' },
            { label: 'upfront fetch', value: 'whole repo (50 MB)', tone: 'bad' },
            { label: 'updates', value: 'git pull · full re-download', tone: 'bad' },
            { label: 'audit', value: 'commit SHA + branch state', tone: 'neutral' },
            { label: 'mirroring', value: 'git mirror infra', tone: 'bad' },
          ],
        },
        {
          title: 'router Image Token',
          rows: [
            { label: 'install', value: '< 1 s · single fetch', tone: 'good' },
            { label: 'upfront fetch', value: 'manifest + SKILL.md (~few KB)', tone: 'good' },
            { label: 'updates', value: 'diff tokens · ship only changes', tone: 'good' },
            { label: 'audit', value: 'content hash · one bullet', tone: 'good' },
            { label: 'mirroring', value: 'static host · S3 / R2 / Pages', tone: 'good' },
          ],
        },
      ]}
      heroDiagram={<SkillDistributionDiagram />}
      index="01"
      nextUseCase={{ href: '/use-cases/codebase-context', label: 'Send a codebase as context' }}
      problem={
        <>
          <p>
            Claude Code skills, Cursor rules, MCP server bundles, GitHub Copilot extensions —
            they&apos;re all folders of files. Distribution looks like{' '}
            <strong>
              `git clone https://github.com/x/y && cp -r y/skills/foo ~/.claude/skills/`
            </strong>
            .
          </p>
          <p>
            That&apos;s tolerable for a one-off install. It breaks when the bundle adds vendor PDFs,
            screenshots, eval fixtures, prompt libraries — a 10–50 MB folder turns{' '}
            <strong>`git clone`</strong> into the slow path. Marketplace UX demands
            click-to-install, not &ldquo;open terminal, follow README.&rdquo; And every release is a
            full re-download.
          </p>
        </>
      }
      solutionBody={
        <>
          <p>
            A router token solves all three. The manifest is one URL. The agent runtime only needs
            the entry SKILL.md until the user actually invokes something deeper. Range-fetch means a
            50 MB skill costs you the manifest + a few KB on first install. The rest arrives on
            demand.
          </p>
          <p>
            Content-addressed by hash. Updates ship as diff tokens. Marketplace listings render from
            the manifest without downloading the bundle. Mirroring is &ldquo;copy the PNGs.&rdquo;
          </p>
        </>
      }
      solutionSteps={[
        {
          label: 'Encode',
          detail: 'Author wraps the skill folder into a router token — manifest + chunks.',
        },
        {
          label: 'Publish',
          detail: 'Drop the PNGs on any static host. Hash the manifest for version pinning.',
        },
        {
          label: 'Install',
          detail:
            'Consumer fetches router.png. The manifest is the file tree; the entry MD is cheap.',
        },
        {
          label: 'Lazy load',
          detail: 'Fixtures, PDFs, evals fetch only when the agent actually invokes them.',
        },
      ]}
      solutionTitle={
        <>
          A skill becomes <span className="italic-display">one URL</span> — and the user only pays
          for the bytes they read.
        </>
      }
      tag="Skill bundles"
      title={
        <>
          Ship Claude Code, MCP, and Cursor skills as{' '}
          <span className="italic-display text-tp-muted">one Image Token.</span>
        </>
      }
    />
  )
}
