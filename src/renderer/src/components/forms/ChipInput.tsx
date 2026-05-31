import { useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/classnames'
import { IconX } from '../icons'

interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

/**
 * Tag input — type a value, press Enter (or comma) to add it as a removable
 * chip. Used for target vocabulary, accepted answers, tags, … (#A58)
 */
export default function ChipInput({ value, onChange, placeholder, className }: ChipInputProps): JSX.Element {
  const [draft, setDraft] = useState('')

  const add = (): void => {
    const v = draft.trim().replace(/,$/, '').trim()
    if (!v) { setDraft(''); return }
    if (!value.includes(v)) onChange([...value, v])
    setDraft('')
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
    else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2 py-2 focus-within:border-brand-400', className)}>
      {value.map((v) => (
        <span key={v} className="inline-flex items-center gap-1 rounded-pill bg-brand-500/15 border border-brand-400/30 px-2.5 py-1 text-xs font-semibold text-white">
          {v}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} className="text-brand-200 hover:text-white">
            <IconX className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder={value.length ? '' : placeholder}
        className="flex-1 min-w-[8rem] bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none px-1"
      />
    </div>
  )
}
