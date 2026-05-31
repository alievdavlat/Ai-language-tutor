import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/classnames'
import { sanitizeRichText } from './RichText'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  /** Minimum editor height (Tailwind class). Default min-h-[120px]. */
  minHeightClassName?: string
  className?: string
}

interface ToolButton {
  cmd: string
  arg?: string
  label: ReactNode
  title: string
}

const TOOLS: ToolButton[] = [
  { cmd: 'bold', label: <span className="font-black">B</span>, title: 'Bold' },
  { cmd: 'italic', label: <span className="italic font-serif">I</span>, title: 'Italic' },
  { cmd: 'formatBlock', arg: 'H2', label: <span className="font-bold">H</span>, title: 'Heading' },
  { cmd: 'insertUnorderedList', label: '•', title: 'Bullet list' },
  { cmd: 'insertOrderedList', label: '1.', title: 'Numbered list' },
  { cmd: 'createLink', label: '🔗', title: 'Link' },
  { cmd: 'removeFormat', label: '⌫', title: 'Clear formatting' }
]

/**
 * Lightweight rich-text / blog editor — a contentEditable surface with a small
 * formatting toolbar (bold, italic, heading, lists, link). Produces sanitized
 * HTML consumed by <RichText>. Zero external deps, dark-styled. Used for lesson
 * & course material, writing-task prompts/rubrics, etc. (#A58)
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write…',
  minHeightClassName = 'min-h-[120px]',
  className
}: RichTextEditorProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  // Sync external value in only when it diverges and the editor isn't focused,
  // so typing isn't interrupted by re-renders.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const incoming = sanitizeRichText(value || '')
    if (document.activeElement !== el && el.innerHTML !== incoming) el.innerHTML = incoming
  }, [value])

  const emit = (): void => {
    if (ref.current) onChange(sanitizeRichText(ref.current.innerHTML))
  }

  const exec = (t: ToolButton): void => {
    ref.current?.focus()
    if (t.cmd === 'createLink') {
      const url = window.prompt('Link URL (https://…)')
      if (!url) return
      document.execCommand('createLink', false, url)
    } else {
      document.execCommand(t.cmd, false, t.arg)
    }
    emit()
  }

  return (
    <div className={cn('rounded-lg border border-white/10 bg-white/5 focus-within:border-brand-400 overflow-hidden', className)}>
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-white/[0.07] bg-white/[0.02]">
        {TOOLS.map((t) => (
          <button
            key={t.title}
            type="button"
            // onMouseDown (not click) keeps the editor selection alive
            onMouseDown={(e) => { e.preventDefault(); exec(t) }}
            title={t.title}
            className="w-7 h-7 rounded-md text-slate-300 hover:bg-white/10 hover:text-white text-sm flex items-center justify-center transition"
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        className={cn(
          'px-3 py-2.5 text-sm text-slate-100 outline-none leading-relaxed',
          '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-slate-500',
          '[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand-300 [&_a]:underline',
          minHeightClassName
        )}
      />
    </div>
  )
}
