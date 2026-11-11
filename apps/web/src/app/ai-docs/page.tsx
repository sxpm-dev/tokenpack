import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { CodeBlock } from '@/components/CodeBlock/CodeBlock'
import { LandingNav } from '@/components/LandingNav/LandingNav'

export const metadata: Metadata = {
  title: 'AI Docs',
  description:
    'Practical TokenPack guidance for LLM and agent workflows, including decode boundaries and handoff patterns.',
}

const AGENT_PATTERN = `// Host runtime decodes the image token first.
const router = await decodeRouter('/context/router.png')
const files = await router.text([
  'README.md',
  'src/auth.ts',
  'docs/api.md',
])

// Then pass ordinary text to the model.
await model.generate({
  prompt: buildPrompt(files),
})`

export default function AiDocsPage() {
  return (
    <div className="min-h-screen bg-tp-bg text-tp-fg">
      <LandingNav />
      <main className="border-b border-tp-border">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <header className="mb-12 max-w-4xl">
            <div className="mb-4 text-[11px] tracking-[0.18em] text-tp-muted uppercase">
              § AI Docs
            </div>
            <h1 className="text-[clamp(2.2rem,5vw,4rem)] leading-[1.02] font-medium tracking-[-0.035em]">
              Use TokenPack with agents without pretending vision decodes bytes.
            </h1>
            <p className="mt-6 max-w-3xl text-[15.5px] leading-relaxed text-tp-muted">
              TokenPack is useful for moving agent context, skill bundles, eval fixtures, and app
              artifacts through image-safe channels. The model should receive decoded text or files;
              the host runtime does the image-to-bytes work.
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
            <section className="grid gap-8">
              <InfoSection title="What AI systems can and cannot do">
                <p>
                  A multimodal model sees rendered pixels, not the raw PNG byte stream. It should
                  not be asked to recover TokenPack payload bytes from an image attachment. Decode
                  the token in Node, browser, a worker, or a tool, then provide normal text/files to
                  the model.
                </p>
              </InfoSection>
              <InfoSection title="Host-runtime decode workflow">
                <ol>
                  <li>Store or receive a token image.</li>
                  <li>
                    Decode it with <code>@tokenpack/node</code> or <code>@tokenpack/browser</code>.
                  </li>
                  <li>Select the relevant paths from the pack or router.</li>
                  <li>Feed decoded text, JSON, or file bytes into the agent workflow.</li>
                </ol>
              </InfoSection>
              <InfoSection title="Good handoff patterns">
                <ul>
                  <li>
                    Agent skills: decode <code>SKILL.md</code> first, lazy-load references later.
                  </li>
                  <li>
                    Code review: attach one router token, then fetch only files under inspection.
                  </li>
                  <li>
                    Eval suites: keep prompts, rubrics, fixtures, and expected outputs together.
                  </li>
                  <li>Generated apps: materialize selected HTML/CSS/JS without a deploy.</li>
                </ul>
              </InfoSection>
              <InfoSection title="Common traps">
                <ul>
                  <li>Do not ask an LLM to visually read encoded bytes.</li>
                  <li>Do not use one huge linear token when the agent needs random file access.</li>
                  <li>Do not hide required auth or network assumptions inside the token.</li>
                  <li>
                    Do keep source paths, metadata, and decode errors visible to the host workflow.
                  </li>
                </ul>
              </InfoSection>
            </section>

            <aside className="grid content-start gap-6">
              <CodeBlock code={AGENT_PATTERN} label="agent-decode.ts" lang="ts" />
              <FactList
                items={[
                  ['Model input', 'Decoded text, JSON, or ordinary files.'],
                  ['Decode owner', 'Host runtime, tool, browser, worker, or server.'],
                  ['Best token shape', 'Router token for large multi-file context.'],
                  ['Main rule', 'Image transport is not model-readable byte transport.'],
                ]}
              />
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}

function InfoSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section>
      <h2 className="text-[1.35rem] leading-tight font-semibold tracking-[-0.015em]">{title}</h2>
      <div className="mt-4 text-[15px] leading-8 text-tp-muted [&_code]:font-mono [&_code]:text-tp-fg [&_li+li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}

function FactList({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="divide-y divide-tp-border rounded-md border border-tp-border bg-tp-elev">
      {items.map(([term, description]) => (
        <div key={term} className="grid gap-2 px-4 py-3 text-[13.5px]">
          <dt className="font-medium text-tp-fg">{term}</dt>
          <dd className="text-tp-muted">{description}</dd>
        </div>
      ))}
    </dl>
  )
}
