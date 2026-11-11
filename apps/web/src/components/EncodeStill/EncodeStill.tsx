import type { BundledLanguage } from 'shiki'

import { CodeBlock } from '@/components/CodeBlock/CodeBlock'

interface EncodeStillProps {
  code: string
  lang?: BundledLanguage
  visual: React.ReactNode
  /** Optional small caption rendered under the visual (e.g. "token.png · 12 B in"). */
  caption?: React.ReactNode
  /** Tiny grey line under the whole still — e.g. "Same API in @tokenpack/node and @tokenpack/browser." */
  footnote?: React.ReactNode
}

export async function EncodeStill({
  code,
  lang = 'ts',
  visual,
  caption,
  footnote,
}: EncodeStillProps) {
  return (
    <div className="flex flex-col items-stretch gap-6">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0">
          <CodeBlock code={code} lang={lang} />
        </div>

        <div className="flex items-center justify-center text-tp-soft">
          <span className="font-mono text-[40px] leading-none text-tp-accent lg:text-[56px]">
            →
          </span>
        </div>

        <div className="flex min-w-0 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            {visual}
            {caption && (
              <div className="text-center font-mono text-[11px] text-tp-soft">{caption}</div>
            )}
          </div>
        </div>
      </div>

      {footnote && <p className="text-center font-mono text-[11px] text-tp-soft">{footnote}</p>}
    </div>
  )
}
