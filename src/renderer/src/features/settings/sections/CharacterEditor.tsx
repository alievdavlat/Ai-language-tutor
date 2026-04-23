import { useEffect, useState } from 'react'
import type { Accent, CharacterInfo, SpeakingStyle } from '@shared/types'
import { DEFAULT_PERSONALITY, SPEAKING_STYLES } from '@shared/types'
import { ACCENTS, ACCENT_LABELS } from '@shared/constants'
import { Button, Chip, Input, TextArea } from '../../../components/ui'
import { cn } from '../../../lib/classnames'

interface CharacterEditorProps {
  /** Draft to edit. `null` means "create a new character from scratch." */
  draft: CharacterInfo | null
  /** Existing ids across presets + customs so we can flag collisions for new ones. */
  takenIds: ReadonlyArray<string>
  /** Whether we're editing an existing custom character (controls Delete button visibility). */
  editingCustomId: string | null
  onSave: (next: CharacterInfo) => void
  onDelete?: () => void
  onCancel: () => void
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

function freshDraft(): CharacterInfo {
  return {
    id: '',
    name: '',
    emoji: '🙂',
    accent: 'us',
    age: 28,
    origin: '',
    headline: '',
    traits: [],
    bio: '',
    personaHint: '',
    personality: { ...DEFAULT_PERSONALITY },
    interests: [],
    speakingStyle: 'neutral',
    isCustom: true
  }
}

interface SliderRowProps {
  label: string
  leftLabel: string
  rightLabel: string
  value: number
  onChange: (v: number) => void
}

function SliderRow({ label, leftLabel, rightLabel, value, onChange }: SliderRowProps): JSX.Element {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span className="font-semibold text-slate-200">{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}

function ChipInput({
  values,
  placeholder,
  onChange
}: {
  values: readonly string[]
  placeholder: string
  onChange: (next: string[]) => void
}): JSX.Element {
  const [draft, setDraft] = useState('')
  const add = (): void => {
    const v = draft.trim()
    if (!v) return
    if (values.includes(v)) {
      setDraft('')
      return
    }
    onChange([...values, v])
    setDraft('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="inline-flex items-center gap-1.5 rounded-pill bg-brand-500/15 border border-brand-400/30 text-xs px-3 py-1 text-brand-100 hover:bg-brand-500/25"
          >
            {v}
            <span aria-hidden className="text-brand-200/70">×</span>
          </button>
        ))}
        {values.length === 0 && (
          <span className="text-xs text-slate-500 italic">No tags yet — add a few below.</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
        />
        <Button variant="ghost" type="button" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  )
}

export default function CharacterEditor({
  draft,
  takenIds,
  editingCustomId,
  onSave,
  onDelete,
  onCancel
}: CharacterEditorProps): JSX.Element {
  const [form, setForm] = useState<CharacterInfo>(draft ?? freshDraft())
  const [idTouched, setIdTouched] = useState<boolean>(!!draft?.id)

  useEffect(() => {
    // When the caller swaps the draft (e.g. clicked Duplicate on a different preset), reset.
    setForm(draft ?? freshDraft())
    setIdTouched(!!draft?.id)
  }, [draft])

  const isEditingExisting = !!editingCustomId

  // Auto-fill id from name when user hasn't touched it.
  const update = <K extends keyof CharacterInfo>(key: K, value: CharacterInfo[K]): void => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && !idTouched && !isEditingExisting) {
        next.id = slugify(String(value)) || 'custom'
      }
      return next
    })
  }

  const idCollision =
    !isEditingExisting && form.id.length > 0 && takenIds.includes(form.id)
  const canSave = form.name.trim().length > 0 && form.id.length > 0 && !idCollision

  const handleSave = (): void => {
    if (!canSave) return
    onSave({
      ...form,
      isCustom: true,
      traits: form.traits ?? [],
      interests: form.interests ?? [],
      personality: form.personality ?? { ...DEFAULT_PERSONALITY },
      speakingStyle: form.speakingStyle ?? 'neutral'
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {isEditingExisting ? 'Edit character' : 'New character'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All fields feed the system prompt — the AI will actually behave this way.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {isEditingExisting ? 'Save' : 'Create'}
            </Button>
          </div>
        </header>

        <div className="px-6 py-5 space-y-6">
          {/* Identity */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Identity</h3>
            <div className="grid grid-cols-[72px,1fr,1fr] gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Emoji</label>
                <Input
                  value={form.emoji}
                  maxLength={4}
                  onChange={(e) => update('emoji', e.target.value)}
                  className="text-center text-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Aisha"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  ID {idCollision && <span className="text-red-300">(taken)</span>}
                </label>
                <Input
                  value={form.id}
                  disabled={isEditingExisting}
                  onChange={(e) => {
                    setIdTouched(true)
                    update('id', slugify(e.target.value))
                  }}
                  placeholder="aisha"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Age</label>
                <Input
                  type="number"
                  min={14}
                  max={120}
                  value={form.age}
                  onChange={(e) => update('age', parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Origin / location</label>
                <Input
                  value={form.origin}
                  onChange={(e) => update('origin', e.target.value)}
                  placeholder="Tashkent, Uzbekistan"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Accent</label>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a: Accent) => (
                  <Chip
                    key={a}
                    selected={form.accent === a}
                    onClick={() => update('accent', a)}
                  >
                    {ACCENT_LABELS[a]}
                  </Chip>
                ))}
              </div>
            </div>
          </section>

          {/* Bio */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Backstory</h3>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">One-line headline</label>
              <Input
                value={form.headline}
                onChange={(e) => update('headline', e.target.value)}
                placeholder="Cheerful Uzbek-speaking conversation partner"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Bio</label>
              <TextArea
                rows={3}
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="A few sentences about who they are, what they enjoy, how they talk."
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Custom system-prompt instructions
              </label>
              <TextArea
                rows={3}
                value={form.personaHint}
                onChange={(e) => update('personaHint', e.target.value)}
                placeholder='"Drop the occasional Uzbek word for flavour. Never switch fully to Uzbek."'
              />
              <p className="text-[10px] text-slate-500 mt-1">
                This text is appended verbatim to the AI's instructions. Power users only.
              </p>
            </div>
          </section>

          {/* Personality */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Personality</h3>
            <SliderRow
              label="Formality"
              leftLabel="Very casual"
              rightLabel="Very formal"
              value={form.personality?.formality ?? 50}
              onChange={(v) =>
                update('personality', {
                  ...(form.personality ?? DEFAULT_PERSONALITY),
                  formality: v
                })
              }
            />
            <SliderRow
              label="Playfulness"
              leftLabel="Serious"
              rightLabel="Playful / joke-heavy"
              value={form.personality?.playfulness ?? 50}
              onChange={(v) =>
                update('personality', {
                  ...(form.personality ?? DEFAULT_PERSONALITY),
                  playfulness: v
                })
              }
            />
            <SliderRow
              label="Energy"
              leftLabel="Calm / introvert"
              rightLabel="Bubbly / extrovert"
              value={form.personality?.energy ?? 50}
              onChange={(v) =>
                update('personality', {
                  ...(form.personality ?? DEFAULT_PERSONALITY),
                  energy: v
                })
              }
            />
          </section>

          {/* Speaking style */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Speaking style</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SPEAKING_STYLES.map((s) => {
                const active = (form.speakingStyle ?? 'neutral') === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update('speakingStyle', s.id as SpeakingStyle)}
                    className={cn(
                      'text-left rounded-lg border p-3 transition',
                      active
                        ? 'border-brand-400 bg-brand-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    )}
                  >
                    <div className="text-sm font-semibold">{s.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.description}</div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Interests */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Interests &amp; hobbies</h3>
            <p className="text-[11px] text-slate-500 -mt-1">
              These get injected into the system prompt so the AI brings them up naturally.
            </p>
            <ChipInput
              values={form.interests ?? []}
              placeholder="hiking, jazz, board games…"
              onChange={(next) => update('interests', next)}
            />
          </section>

          {/* Short display traits */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Picker tags</h3>
            <p className="text-[11px] text-slate-500 -mt-1">
              Short adjectives shown on the character card. 3 looks best.
            </p>
            <ChipInput
              values={form.traits ?? []}
              placeholder="Warm, Patient, Casual…"
              onChange={(next) => update('traits', next)}
            />
          </section>

          {isEditingExisting && onDelete && (
            <section className="pt-3 border-t border-white/10">
              <Button variant="danger" onClick={onDelete}>
                Delete this character
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
