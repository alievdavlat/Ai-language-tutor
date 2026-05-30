import { useRef } from 'react'
import { cn } from '../../lib/classnames'

/**
 * Renders text as individually tappable words. Click (or press-and-hold on
 * touch) a word to look it up / translate it. Punctuation is stripped from the
 * reported word but kept visually.
 */

export interface WordPick {
  word: string
  /** Where to anchor the popover. */
  rect: DOMRect
}

interface WordTextProps {
  text: string
  onPick: (pick: WordPick) => void
  /** Highlight words already saved to vocabulary. */
  isSaved?: (word: string) => boolean
  /** The currently open word (highlighted). */
  active?: string | null
  className?: string
}

function clean(w: string): string {
  return w.replace(/[^A-Za-z'-]/g, '')
}

export default function WordText({ text, onPick, isSaved, active, className }: WordTextProps): JSX.Element {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function fire(word: string, el: HTMLElement): void {
    const w = clean(word)
    if (w) onPick({ word: w, rect: el.getBoundingClientRect() })
  }

  return (
    <span className={className}>
      {text.split(/(\s+)/).map((tok, i) => {
        if (/^\s+$/.test(tok) || tok === '') return <span key={i}>{tok}</span>
        const w = clean(tok)
        const saved = !!w && isSaved?.(w)
        const isActive = !!w && active && active.toLowerCase() === w.toLowerCase()
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => fire(tok, e.currentTarget)}
            onPointerDown={(e) => {
              const el = e.currentTarget
              timer.current = setTimeout(() => fire(tok, el), 320)
            }}
            onPointerUp={() => { if (timer.current) clearTimeout(timer.current) }}
            onPointerLeave={() => { if (timer.current) clearTimeout(timer.current) }}
            className={cn(
              'rounded px-0.5 -mx-0.5 transition cursor-pointer hover:bg-brand-500/30',
              saved && 'bg-amber-500/20 text-amber-100',
              isActive && 'bg-brand-500/40 text-white'
            )}
          >
            {tok}
          </button>
        )
      })}
    </span>
  )
}
