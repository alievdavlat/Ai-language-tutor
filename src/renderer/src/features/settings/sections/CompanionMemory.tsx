import { useState } from 'react'
import type { CharacterInfo, MemoryNote, UserProfile } from '@shared/types'
import { Button, Card, Input } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { createId } from '../../../lib/ids'

interface CompanionMemoryProps {
  profile: UserProfile
  character: CharacterInfo | null
  /** Persist the full per-character memory map. */
  onChange: (next: Record<string, MemoryNote[]>) => void
}

/**
 * Phase 10 (2.10) — manage what a companion remembers about the learner.
 * Notes are injected into the system prompt (pinned first, then most recent),
 * so context survives across sessions.
 */
export default function CompanionMemory({ profile, character, onChange }: CompanionMemoryProps): JSX.Element {
  const [draft, setDraft] = useState('')

  if (!character) {
    return (
      <Card>
        <p className="text-sm text-slate-400">Pick a companion first.</p>
      </Card>
    )
  }

  const id = character.id
  const all = profile.companionMemory ?? {}
  const notes = all[id] ?? []

  const commit = (next: MemoryNote[]): void => {
    onChange({ ...all, [id]: next })
  }

  const add = (): void => {
    const text = draft.trim()
    if (!text) return
    commit([{ id: createId('mem'), text, createdAt: new Date().toISOString(), pinned: false }, ...notes])
    setDraft('')
  }

  const remove = (noteId: string): void => commit(notes.filter((n) => n.id !== noteId))
  const togglePin = (noteId: string): void =>
    commit(notes.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n)))

  const ordered = [...notes].sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1
    return b.createdAt.localeCompare(a.createdAt)
  })

  return (
    <Card>
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-semibold text-base">What {character.name} remembers</h2>
        <span className="text-[11px] text-slate-500">{notes.length} note{notes.length === 1 ? '' : 's'}</span>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Facts {character.name} keeps in mind about you — your name, job, goals, what you talked about.
        Pinned notes are always remembered; up to 6 reach the AI each chat.
      </p>

      <div className="flex gap-2 mb-4">
        <Input
          value={draft}
          placeholder="e.g. Works as a nurse · preparing for IELTS · has a dog named Rex"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" onClick={add} disabled={!draft.trim()}>
          Add
        </Button>
      </div>

      {ordered.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No memories yet. Add a few so the AI feels like it knows you.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((n) => (
            <li
              key={n.id}
              className={cn(
                'flex items-center gap-2 rounded-xl border p-3',
                n.pinned ? 'border-amber-400/30 bg-amber-400/[0.06]' : 'border-white/10 bg-white/[0.03]'
              )}
            >
              <span className="flex-1 text-sm text-slate-200">{n.text}</span>
              <button
                type="button"
                onClick={() => togglePin(n.id)}
                title={n.pinned ? 'Unpin' : 'Pin (always remembered)'}
                className={cn('text-sm px-1.5', n.pinned ? 'text-amber-300' : 'text-slate-500 hover:text-slate-300')}
              >
                {n.pinned ? '📌' : '📍'}
              </button>
              <button
                type="button"
                onClick={() => remove(n.id)}
                title="Forget this"
                className="text-xs text-red-300 hover:text-red-200 px-1"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
