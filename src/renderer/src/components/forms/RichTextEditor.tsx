/**
 * Rich-text / blog editor for teacher-authored material. Writes Markdown
 * (rendered faithfully by {@link RichTextView}). A formatting toolbar wraps the
 * current selection, and a Write / Preview toggle shows the live result.
 *
 * Dependency-free and dark-first. Part of the shared authoring form kit (#A58).
 */
import { useRef, useState } from 'react'
import { cn } from '../../lib/classnames'
import RichTextView from './markdown'

interface ToolAction {
  label: string
  title: string
  /** Wrap the selection with before/after, or prefix a line. */
  wrap?: [string, string]
  linePrefix?: string
  block?: string
}

const TOOLS: ToolAction[] = [
  { label: 'B', title: 'Bold', wrap: ['**', '**'] },
  { label: 'I', title: 'Italic', wrap: ['*', '*'] },
  { label: 'H2', title: 'Heading', linePrefix: '## ' },
  { label: 'H3', title: 'Subheading', linePrefix: '### ' },
  { label: '• List', title: 'Bullet list', linePrefix: '- ' },
  { label: '1. List', title: 'Numbered list', linePrefix: '1. ' },
  { label: '❝ Quote', title: 'Quote', linePrefix: '> ' },
  { label: '🔗 Link', title: 'Link', wrap: ['[', '](https://)'] },
  { label: '— Divider', title: 'Divider', block: '\n---\n' }
]

export interface RichTextEditorProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minRows?: number
  /** Optional small label rendered above the toolbar. */
  hint?: string
}

export default function RichTextEditor({ value, onChange, placeholder, minRows = 8, hint }: RichTextEditorProps): JSX.Element {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<'write' | 'preview'>('write')

  const apply = (tool: ToolAction): void => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const sel = value.slice(start, end)
    let next = value
    let caret = end

    if (tool.block) {
      next = value.slice(0, start) + tool.block + value.slice(end)
      caret = start + tool.block.length
    } else if (tool.wrap) {
      const [b, a] = tool.wrap
      const inner = sel || (b === '[' ? 'text' : 'text')
      next = value.slice(0, start) + b + inner + a + value.slice(end)
      caret = start + b.length + inner.length + a.length
    } else if (tool.linePrefix) {
      // Find the start of the current line.
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      next = value.slice(0, lineStart) + tool.linePrefix + value.slice(lineStart)
      caret = end + tool.linePrefix.length
    }
    onChange(next)
    // Restore focus + caret after React re-renders.
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/10 bg-white/[0.02] flex-wrap">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            onMouseDown={(e) => { e.preventDefault(); apply(t) }}
            disabled={mode === 'preview'}
            className="text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-md px-2 py-1 transition disabled:opacity-30"
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center rounded-lg bg-white/[0.04] p-0.5">
          {(['write', 'preview'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn('text-[11px] font-bold capitalize px-2.5 py-1 rounded-md transition', mode === m ? 'bg-brand-500/20 text-brand-100' : 'text-slate-400 hover:text-slate-200')}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {hint && <p className="text-[11px] text-slate-500 px-3 pt-2">{hint}</p>}
      {mode === 'write' ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'Write the lesson material… **bold**, ## headings, - lists, [links](url) all work.'}
          rows={minRows}
          className="w-full bg-transparent px-3 py-2.5 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:outline-none resize-y font-mono"
        />
      ) : (
        <div className="px-4 py-3 min-h-[160px]">
          {value.trim()
            ? <RichTextView text={value} />
            : <p className="text-sm text-slate-600 italic">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  )
}
