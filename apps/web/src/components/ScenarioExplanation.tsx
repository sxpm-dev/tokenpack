'use client'

import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

interface ScenarioExplanationProps {
  /** Markdown body (typically a scenario's `explanation` field). */
  markdown: string
}

/**
 * Renders a scenario's explanation markdown — GFM tables, fenced code blocks
 * with `rehype-highlight` syntax coloring. Used by both the generic
 * `[scenarioId]/page.tsx` template and any custom override page.
 *
 * Styles live in `scenario-explanation.css` (imported once at the layout
 * level). Tailwind doesn't ship typography plugin in this package, so we
 * style the relevant tags manually — see the css file.
 */
export function ScenarioExplanation({ markdown }: ScenarioExplanationProps) {
  return (
    <div className="scenario-explanation">
      <ReactMarkdown rehypePlugins={[rehypeHighlight]} remarkPlugins={[remarkGfm]}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
