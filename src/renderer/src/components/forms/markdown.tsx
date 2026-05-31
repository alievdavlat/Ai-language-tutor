/**
 * Tiny, dependency-free Markdown renderer used for teacher-authored rich text
 * (lesson articles, course "about", etc.). Renders to React elements — never
 * `dangerouslySetInnerHTML` — so user content can't inject markup.
 *
 * Supported: # / ## / ### headings, **bold**, *italic* / _italic_, `code`,
 * [links](url), - / * bullet lists, 1. ordered lists, > blockquotes, ---
 * horizontal rules, and blank-line paragraph breaks.
 *
 * Part of the shared authoring form kit (foundation for task #A58).
 */
import type { ReactNode } from 'react'

let keySeq = 0
const nextKey = (): string => `md${keySeq++}`

/** Parse inline spans (bold/italic/code/link) into React nodes. */
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Order matters: links first, then code, then bold, then italic.
  const re = /(\[([^\]]+)\]\(([^)\s]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1]) {
      // link
      const href = m[3]
      const safe = /^(https?:|mailto:|\/)/i.test(href) ? href : '#'
      nodes.push(
        <a key={nextKey()} href={safe} target="_blank" rel="noreferrer" className="text-brand-300 hover:text-brand-200 underline underline-offset-2">
          {m[2]}
        </a>
      )
    } else if (m[4]) {
      nodes.push(<code key={nextKey()} className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[0.85em] font-mono text-brand-200">{m[5]}</code>)
    } else if (m[6]) {
      nodes.push(<strong key={nextKey()} className="font-bold text-white">{m[7]}</strong>)
    } else if (m[8]) {
      nodes.push(<em key={nextKey()} className="italic">{m[9]}</em>)
    } else if (m[10]) {
      nodes.push(<em key={nextKey()} className="italic">{m[11]}</em>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

type Block =
  | { t: 'h1' | 'h2' | 'h3' | 'p' | 'quote'; text: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'hr' }

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  const flushPara = (): void => {
    if (para.length) { blocks.push({ t: 'p', text: para.join(' ') }); para = [] }
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) { flushPara(); continue }
    if (/^---+$/.test(trimmed)) { flushPara(); blocks.push({ t: 'hr' }); continue }
    if (trimmed.startsWith('### ')) { flushPara(); blocks.push({ t: 'h3', text: trimmed.slice(4) }); continue }
    if (trimmed.startsWith('## ')) { flushPara(); blocks.push({ t: 'h2', text: trimmed.slice(3) }); continue }
    if (trimmed.startsWith('# ')) { flushPara(); blocks.push({ t: 'h1', text: trimmed.slice(2) }); continue }
    if (trimmed.startsWith('> ')) { flushPara(); blocks.push({ t: 'quote', text: trimmed.slice(2) }); continue }
    if (/^[-*]\s+/.test(trimmed)) {
      flushPara()
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++ }
      i--
      blocks.push({ t: 'ul', items })
      continue
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      flushPara()
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++ }
      i--
      blocks.push({ t: 'ol', items })
      continue
    }
    para.push(trimmed)
  }
  flushPara()
  return blocks
}

/** Render a markdown string to styled React elements (dark theme). */
export function RichTextView({ text, className }: { text: string; className?: string }): JSX.Element {
  const blocks = parseBlocks(text || '')
  return (
    <div className={`text-sm text-slate-200 leading-relaxed flex flex-col gap-3 ${className ?? ''}`}>
      {blocks.map((b) => {
        const k = nextKey()
        switch (b.t) {
          case 'h1': return <h2 key={k} className="text-xl font-bold text-white mt-1">{renderInline(b.text)}</h2>
          case 'h2': return <h3 key={k} className="text-lg font-bold text-white mt-1">{renderInline(b.text)}</h3>
          case 'h3': return <h4 key={k} className="text-base font-semibold text-white">{renderInline(b.text)}</h4>
          case 'quote': return <blockquote key={k} className="border-l-2 border-brand-400/50 pl-3 text-slate-300 italic">{renderInline(b.text)}</blockquote>
          case 'hr': return <hr key={k} className="border-white/10" />
          case 'ul': return <ul key={k} className="list-disc pl-5 flex flex-col gap-1">{b.items.map((it) => <li key={nextKey()}>{renderInline(it)}</li>)}</ul>
          case 'ol': return <ol key={k} className="list-decimal pl-5 flex flex-col gap-1">{b.items.map((it) => <li key={nextKey()}>{renderInline(it)}</li>)}</ol>
          default: return <p key={k}>{renderInline(b.text)}</p>
        }
      })}
    </div>
  )
}

export default RichTextView
