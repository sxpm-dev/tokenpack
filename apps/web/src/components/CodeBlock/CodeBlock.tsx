import { type BundledLanguage, codeToHtml } from 'shiki'

interface CodeBlockProps {
  code: string
  lang?: BundledLanguage
  label?: string
  tag?: string
  className?: string
}

export async function CodeBlock({ code, lang = 'ts', label, tag, className }: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang,
    themes: {
      light: 'github-light',
      dark: 'github-dark-dimmed',
    },
    defaultColor: false, // emit dual-theme CSS vars
  })

  // Shiki produces HTML from hardcoded code strings authored in this repo —
  // never user input. Injecting is safe in this controlled use.
  const innerHtmlProp = { __html: html }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-tp-border bg-tp-elev ${className ?? ''}`}
    >
      {(label || tag) && (
        <div className="flex items-center justify-between border-b border-tp-border px-4 py-2.5">
          {label && (
            <span className="font-mono text-[10px] tracking-[0.14em] text-tp-soft uppercase">
              {label}
            </span>
          )}
          {tag && <span className="font-mono text-[10px] text-tp-soft">{tag}</span>}
        </div>
      )}
      <div dangerouslySetInnerHTML={innerHtmlProp} className="codeblock" />
    </div>
  )
}
