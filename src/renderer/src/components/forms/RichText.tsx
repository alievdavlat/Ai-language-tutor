import { cn } from '../../lib/classnames'

/**
 * Strip anything dangerous from authored HTML before rendering it learner-side.
 * Content is authored locally by teachers/admins, but we still drop <script>,
 * inline event handlers and javascript: URLs as defence-in-depth. (#A58)
 */
export function sanitizeRichText(html: string): string {
  if (!html) return ''
  return html
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2')
}

interface RichTextProps {
  html?: string
  className?: string
}

/**
 * Renders authored rich-text (the HTML produced by RichTextEditor) with the
 * shared prose styling. Use this everywhere lesson/course/material copy is
 * shown to learners so authored formatting renders faithfully. (#A58)
 */
export default function RichText({ html, className }: RichTextProps): JSX.Element | null {
  if (!html || !html.trim()) return null
  return (
    <div
      className={cn('rich-text text-slate-200 leading-relaxed [&_a]:text-brand-300 [&_a]:underline [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-3 [&_h3]:font-semibold [&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-1.5 [&_b]:text-white [&_strong]:text-white', className)}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  )
}
