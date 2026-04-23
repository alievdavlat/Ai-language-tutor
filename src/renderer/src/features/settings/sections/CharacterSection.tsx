import { useMemo, useState } from 'react'
import type { Accent, CharacterInfo, UserProfile } from '@shared/types'
import { ACCENT_LABELS, CHARACTERS, listAllCharacters } from '@shared/constants'
import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import CharacterEditor from './CharacterEditor'

interface CharacterSectionProps {
  profile: UserProfile
  onPick: (characterId: string, accent: Accent) => void
  onCustomsChange: (next: CharacterInfo[]) => void
}

function duplicatePresetAsDraft(preset: CharacterInfo, takenIds: ReadonlyArray<string>): CharacterInfo {
  // Find a fresh id like `emma-copy`, `emma-copy-2`, …
  let candidate = `${preset.id}-copy`
  let i = 2
  while (takenIds.includes(candidate)) {
    candidate = `${preset.id}-copy-${i++}`
  }
  return {
    ...preset,
    id: candidate,
    name: `${preset.name} (copy)`,
    isCustom: true
  }
}

export default function CharacterSection({
  profile,
  onPick,
  onCustomsChange
}: CharacterSectionProps): JSX.Element {
  const characters = useMemo(() => listAllCharacters(profile), [profile])
  const customs = profile.customCharacters ?? []
  const takenIds = useMemo(
    () => [...Object.keys(CHARACTERS), ...customs.map((c) => c.id)],
    [customs]
  )

  const [editing, setEditing] = useState<{ draft: CharacterInfo | null; existingId: string | null } | null>(null)

  const currentId = profile.settings.characterId
  const currentAccent = profile.settings.accent

  const startNew = (): void => {
    setEditing({ draft: null, existingId: null })
  }

  const startDuplicate = (preset: CharacterInfo): void => {
    setEditing({
      draft: duplicatePresetAsDraft(preset, takenIds),
      existingId: null
    })
  }

  const startEdit = (character: CharacterInfo): void => {
    setEditing({ draft: character, existingId: character.id })
  }

  const handleSave = (next: CharacterInfo): void => {
    const without = customs.filter((c) => c.id !== (editing?.existingId ?? next.id))
    onCustomsChange([...without, next])
    // If the user was editing the currently-selected character, keep them on it
    // (ids are preserved when editing). If they just created a new one, select it.
    if (!editing?.existingId) {
      onPick(next.id, next.accent)
    }
    setEditing(null)
  }

  const handleDelete = (): void => {
    if (!editing?.existingId) return
    onCustomsChange(customs.filter((c) => c.id !== editing.existingId))
    // If the deleted character was the active one, fall back to Emma.
    if (currentId === editing.existingId) {
      onPick('emma', CHARACTERS.emma.accent)
    }
    setEditing(null)
  }

  return (
    <>
      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="font-semibold text-base">Your companion</h2>
            <p className="text-xs text-slate-500">
              Picking a character also sets the default accent and speaking style.
              Create your own by duplicating a preset or starting fresh.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {characters.map((c) => {
            const active = currentId === c.id
            const accentMatches = currentAccent === c.accent
            const isCustom = !!c.isCustom
            return (
              <div
                key={c.id}
                className={cn(
                  'group relative rounded-card p-4 transition overflow-hidden',
                  active
                    ? 'bg-grad-brand ring-2 ring-brand-300/60 shadow-glow text-white'
                    : 'bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-200'
                )}
              >
                <button
                  onClick={() => onPick(c.id, c.accent)}
                  className="w-full text-left"
                >
                  {active && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-white/30 rounded-pill px-2 py-0.5">
                      Active
                    </span>
                  )}
                  <div className="text-4xl mb-2">{c.emoji}</div>
                  <div className="font-bold text-base truncate flex items-center gap-1.5">
                    {c.name}
                    {isCustom && (
                      <span
                        title="Custom character"
                        className={cn(
                          'text-[9px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5',
                          active ? 'bg-white/25 text-white' : 'bg-emerald-500/20 text-emerald-200'
                        )}
                      >
                        custom
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      'text-xs mb-2',
                      active ? 'text-white/80' : 'text-slate-400'
                    )}
                  >
                    {ACCENT_LABELS[c.accent]} · {c.age}
                  </div>
                  <div
                    className={cn(
                      'text-[11px] leading-snug mb-2 line-clamp-2',
                      active ? 'text-white/90' : 'text-slate-400'
                    )}
                  >
                    {c.headline || <span className="italic text-slate-500">No headline yet.</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(c.traits ?? []).map((t) => (
                      <span
                        key={t}
                        className={cn(
                          'text-[9px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5',
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-white/[0.06] text-slate-400 border border-white/10'
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  {active && !accentMatches && (
                    <p className="text-[10px] mt-2 text-white/70">
                      (Accent currently overridden — change in Accent section)
                    </p>
                  )}
                </button>

                {/* Per-card secondary action: Edit (custom) or Duplicate (preset). */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isCustom) startEdit(c)
                    else startDuplicate(c)
                  }}
                  className={cn(
                    'absolute bottom-2 right-2 text-[10px] font-semibold rounded-pill px-2 py-1 transition',
                    active
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/10'
                  )}
                >
                  {isCustom ? '✏️ Edit' : '⧉ Duplicate'}
                </button>
              </div>
            )
          })}

          {/* "+ New" card */}
          <button
            type="button"
            onClick={startNew}
            className="flex flex-col items-center justify-center text-center rounded-card p-4 min-h-[180px] bg-white/[0.02] border border-dashed border-white/15 hover:bg-white/[0.06] hover:border-brand-400/50 text-slate-400 hover:text-slate-200 transition"
          >
            <div className="text-4xl mb-2">➕</div>
            <div className="font-semibold text-sm">Create new character</div>
            <div className="text-[11px] text-slate-500 mt-1 px-2">
              Name, personality sliders, interests, speaking style.
            </div>
          </button>
        </div>
      </Card>

      {editing && (
        <CharacterEditor
          draft={editing.draft}
          takenIds={takenIds}
          editingCustomId={editing.existingId}
          onSave={handleSave}
          onDelete={editing.existingId ? handleDelete : undefined}
          onCancel={() => setEditing(null)}
        />
      )}
    </>
  )
}
