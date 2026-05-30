import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  DEFAULT_AVATAR_3D,
  DEFAULT_PERSONALITY,
  SPEAKING_STYLES,
  type Accent,
  type Avatar3DConfig,
  type CharacterInfo,
  type CorrectionStyle,
  type HairStyle,
  type SpeakingStyle,
  type UserProfile
} from '@shared/types'
import { ACCENTS, ACCENT_LABELS, resolveCharacter } from '@shared/constants'
import { characterAvatarUrl } from '@shared/utils/avatar'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/classnames'
import PageHeader from '../../components/layout/PageHeader'
import BackButton from '../../components/layout/BackButton'
import { Button, Input, TextArea } from '../../components/ui'
import { Avatar } from '../../components/avatar'
import AvatarStudioCanvas from './AvatarStudioCanvas'

type AvatarKind = '2d' | '3d' | 'vrm'

const DICEBEAR_STYLES = ['lorelei', 'micah', 'avataaars', 'personas', 'thumbs'] as const
const SKIN_TONES = ['#ffe0c4', '#ffd9b8', '#f1c5a0', '#d9a877', '#b07d56', '#8d5a3c', '#5c3a26']
const HAIR_COLORS = ['#1c1410', '#3a281c', '#6b4423', '#a8702d', '#d9b06a', '#9b9b9b', '#e8e8e8', '#b3402f', '#3a5fcd']
const EYE_COLORS = ['#1a2b4a', '#3b6b3b', '#6b4423', '#2f2f2f', '#5a7fa8']
const OUTFIT_COLORS = ['#3b4a66', '#2f5d50', '#7a3b5d', '#b3402f', '#26303f', '#5a4a8a']
const BACKGROUNDS = ['#0b1020', '#142033', '#1e1430', '#0f2420', '#2a1622']
const CORRECTION_STYLES: { id: CorrectionStyle; label: string; desc: string }[] = [
  { id: 'gentle', label: 'Gentle', desc: 'Corrects kindly, after the reply.' },
  { id: 'strict', label: 'Strict', desc: 'Calls out every mistake right away.' },
  { id: 'inline', label: 'Inline', desc: 'Shows fixes quietly, no spoken nag.' },
  { id: 'silent', label: 'Silent', desc: "Doesn't correct — just chats." }
]
const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'long', label: 'Long' },
  { id: 'bun', label: 'Bun' },
  { id: 'bald', label: 'Bald' }
]

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'custom'
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">{label}</p>
      {children}
      {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
    </div>
  )
}

function Swatches({ colors, value, onPick }: { colors: string[]; value: string; onPick: (c: string) => void }): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className={cn('w-8 h-8 rounded-full ring-2 transition', value.toLowerCase() === c.toLowerCase() ? 'ring-white scale-110' : 'ring-white/20 hover:ring-white/50')}
          style={{ backgroundColor: c }}
          aria-label={c}
        />
      ))}
    </div>
  )
}

function Chips({ values, placeholder, onChange }: { values: readonly string[]; placeholder: string; onChange: (n: string[]) => void }): JSX.Element {
  const [draft, setDraft] = useState('')
  const add = (): void => {
    const v = draft.trim()
    if (!v || values.includes(v)) { setDraft(''); return }
    onChange([...values, v]); setDraft('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((v) => (
          <button key={v} type="button" onClick={() => onChange(values.filter((x) => x !== v))}
            className="inline-flex items-center gap-1.5 rounded-pill bg-brand-500/15 border border-brand-400/30 text-xs px-3 py-1 text-brand-100 hover:bg-brand-500/25">
            {v}<span aria-hidden className="text-brand-200/70">×</span>
          </button>
        ))}
        {values.length === 0 && <span className="text-xs text-slate-500 italic">None yet.</span>}
      </div>
      <div className="flex gap-2">
        <Input placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <Button variant="ghost" type="button" onClick={add}>Add</Button>
      </div>
    </div>
  )
}

export default function AvatarStudioPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('id') || undefined

  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const fileRef = useRef<HTMLInputElement>(null)

  const existing = useMemo(() => resolveCharacter(profile, editId), [profile, editId])

  const [form, setForm] = useState<CharacterInfo>(() =>
    existing ?? {
      id: '', name: '', emoji: '🙂', accent: 'us', age: 25, origin: '', headline: '', traits: [],
      bio: '', personaHint: '', personality: { ...DEFAULT_PERSONALITY }, interests: [], speakingStyle: 'neutral',
      correctionStyle: 'gentle', greeting: '', avatarStyle: 'lorelei', avatarSeed: '', avatarKind: '2d', isCustom: true
    }
  )
  const [idTouched, setIdTouched] = useState(!!existing?.id)
  const [cfg, setCfg] = useState<Avatar3DConfig>(profile?.avatar3d ?? DEFAULT_AVATAR_3D)
  const [vrmUrl, setVrmUrl] = useState(existing?.vrmUrl ?? '')
  const [saving, setSaving] = useState(false)

  const kind: AvatarKind = form.avatarKind ?? '2d'
  const isEditingPreset = !!existing && !existing.isCustom
  const isEditing = !!existing

  const update = <K extends keyof CharacterInfo>(key: K, value: CharacterInfo[K]): void => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'name' && !idTouched && !isEditing) next.id = slugify(String(value))
      return next
    })
  }

  const onUploadVrm = (file: File | undefined): void => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setVrmUrl(String(reader.result))
    reader.readAsDataURL(file) // data: URL persists in the profile
  }

  const canSave = form.name.trim().length > 0

  const save = async (): Promise<void> => {
    if (!canSave || !profile) return
    setSaving(true)
    const id = form.id || slugify(form.name)
    const next: CharacterInfo = {
      ...form,
      id,
      isCustom: true,
      avatarKind: kind,
      traits: form.traits ?? [],
      interests: form.interests ?? [],
      personality: form.personality ?? { ...DEFAULT_PERSONALITY },
      greeting: form.greeting?.trim() || undefined,
      vrmUrl: kind === 'vrm' ? vrmUrl.trim() || undefined : form.vrmUrl,
      avatarSeed: kind === '2d' ? form.avatarSeed?.trim() || id : form.avatarSeed,
      appearance: kind === '3d'
        ? { skinTone: cfg.skinTone, hairColor: cfg.hairColor, hairStyle: cfg.hairStyle, eyeColor: cfg.eyeColor, outfitColor: cfg.outfitColor }
        : form.appearance
    }
    const customs = (profile.customCharacters ?? []).filter((c) => c.id !== id)
    const avatarMode = kind === '2d' ? '2d' : '3d'
    const updated: UserProfile = {
      ...profile,
      customCharacters: [...customs, next],
      avatar3d: kind === '3d' ? cfg : profile.avatar3d,
      settings: { ...profile.settings, characterId: id, accent: next.accent, avatarMode },
      updatedAt: new Date().toISOString()
    }
    await window.api.profile.save(updated)
    setProfile(updated)
    setSaving(false)
    navigate('/settings')
  }

  const del = async (): Promise<void> => {
    if (!profile || !editId) return
    const customs = (profile.customCharacters ?? []).filter((c) => c.id !== editId)
    const updated: UserProfile = { ...profile, customCharacters: customs, updatedAt: new Date().toISOString() }
    await window.api.profile.save(updated)
    setProfile(updated)
    navigate('/settings')
  }

  const previewSeed = form.avatarSeed?.trim() || form.id || form.name || 'preview'

  return (
    <div className="h-full overflow-y-auto bg-slate-950">
      <PageHeader
        left={<BackButton to="/settings" />}
        title={isEditing ? `Edit ${form.name || 'companion'}` : 'Create a companion'}
        subtitle="Pick an avatar type, upload a model or use a portrait, and set the personality."
        right={
          <div className="flex items-center gap-2">
            {isEditing && existing?.isCustom && (
              <button onClick={() => void del()} className="btn-ghost text-xs px-3 py-2 text-rose-300">Delete</button>
            )}
            <button onClick={() => void save()} disabled={!canSave || saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
              {saving ? 'Saving…' : isEditing ? 'Save companion' : 'Create companion'}
            </button>
          </div>
        }
      />

      <div className="w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Live preview */}
        <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/30 min-h-[460px] flex items-center justify-center p-4">
          {kind === '3d' ? (
            <AvatarStudioCanvas config={cfg} />
          ) : kind === 'vrm' ? (
            <Avatar mode="3d" mouthOpen={0} name={form.name || 'Preview'} vrmUrl={vrmUrl || undefined} />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-56 h-56 rounded-3xl overflow-hidden ring-1 ring-white/10" style={{ background: form.cardTint ? `#${form.cardTint}` : 'rgba(255,255,255,0.05)' }}>
                <img src={characterAvatarUrl({ ...form, avatarSeed: previewSeed }, 320)} alt="preview" className="w-full h-full p-2" referrerPolicy="no-referrer" />
              </div>
              <p className="text-sm text-slate-400">{form.name || 'New companion'}</p>
            </div>
          )}
        </div>

        {/* Builder */}
        <div className="flex flex-col gap-5">
          {/* Avatar type */}
          <Field label="Avatar type">
            <div className="grid grid-cols-3 gap-2">
              {([
                { k: '2d', label: '2D portrait', emoji: '🖼️' },
                { k: '3d', label: '3D stylized', emoji: '🧊' },
                { k: 'vrm', label: '3D realistic (VRM)', emoji: '🧑‍🎤' }
              ] as const).map((t) => (
                <button key={t.k} onClick={() => update('avatarKind', t.k)}
                  className={cn('rounded-xl border p-3 text-center transition', kind === t.k ? 'border-brand-400 bg-brand-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]')}>
                  <div className="text-2xl">{t.emoji}</div>
                  <div className="text-[11px] font-semibold mt-1">{t.label}</div>
                </button>
              ))}
            </div>
          </Field>

          {/* Source per type */}
          {kind === '2d' && (
            <>
              <Field label="Portrait style">
                <div className="flex flex-wrap gap-2">
                  {DICEBEAR_STYLES.map((st) => (
                    <button key={st} onClick={() => update('avatarStyle', st)}
                      className={cn('rounded-full px-3 py-1.5 text-xs font-bold border transition capitalize', (form.avatarStyle ?? 'lorelei') === st ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]')}>
                      {st}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Portrait seed" hint="Any text — changes the generated face. Free DiceBear art (CC0).">
                <Input value={form.avatarSeed ?? ''} placeholder="e.g. my-coach-01" onChange={(e) => update('avatarSeed', e.target.value)} />
              </Field>
            </>
          )}

          {kind === '3d' && (
            <>
              <Field label="Skin tone"><Swatches colors={SKIN_TONES} value={cfg.skinTone} onPick={(skinTone) => setCfg((c) => ({ ...c, skinTone }))} /></Field>
              <Field label="Hair style">
                <div className="flex flex-wrap gap-2">
                  {HAIR_STYLES.map((h) => (
                    <button key={h.id} onClick={() => setCfg((c) => ({ ...c, hairStyle: h.id }))}
                      className={cn('rounded-full px-4 py-1.5 text-xs font-bold border transition', cfg.hairStyle === h.id ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]')}>
                      {h.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Hair color"><Swatches colors={HAIR_COLORS} value={cfg.hairColor} onPick={(hairColor) => setCfg((c) => ({ ...c, hairColor }))} /></Field>
              <Field label="Eye color"><Swatches colors={EYE_COLORS} value={cfg.eyeColor} onPick={(eyeColor) => setCfg((c) => ({ ...c, eyeColor }))} /></Field>
              <Field label="Outfit color"><Swatches colors={OUTFIT_COLORS} value={cfg.outfitColor} onPick={(outfitColor) => setCfg((c) => ({ ...c, outfitColor }))} /></Field>
              <Field label="Background"><Swatches colors={BACKGROUNDS} value={cfg.background} onPick={(background) => setCfg((c) => ({ ...c, background }))} /></Field>
            </>
          )}

          {kind === 'vrm' && (
            <Field label="VRM model" hint="Upload a .vrm file or paste a link (free models on VRoid Hub). Lip-sync + expressions work in chat.">
              <div className="flex gap-2">
                <Input value={vrmUrl.startsWith('data:') ? '(uploaded file)' : vrmUrl} placeholder="https://…/model.vrm" onChange={(e) => setVrmUrl(e.target.value)} />
                <Button variant="ghost" type="button" onClick={() => fileRef.current?.click()}>Upload</Button>
              </div>
              <input ref={fileRef} type="file" accept=".vrm,model/gltf-binary" className="hidden"
                onChange={(e) => onUploadVrm(e.target.files?.[0])} />
            </Field>
          )}

          {/* Identity */}
          <div className="border-t border-white/10 pt-4 grid grid-cols-[64px_1fr] gap-3">
            <Field label="Emoji"><Input value={form.emoji} maxLength={4} className="text-center text-xl" onChange={(e) => update('emoji', e.target.value)} /></Field>
            <Field label="Name *"><Input value={form.name} placeholder="Aziz" onChange={(e) => update('name', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age"><Input type="number" min={14} max={120} value={form.age} onChange={(e) => update('age', parseInt(e.target.value, 10) || 0)} /></Field>
            <Field label="Origin"><Input value={form.origin} placeholder="Tashkent, Uzbekistan" onChange={(e) => update('origin', e.target.value)} /></Field>
          </div>
          <Field label="Accent">
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a: Accent) => (
                <button key={a} onClick={() => update('accent', a)}
                  className={cn('rounded-full px-3 py-1.5 text-xs font-bold border transition', form.accent === a ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]')}>
                  {ACCENT_LABELS[a]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Headline"><Input value={form.headline} placeholder="Cheerful conversation partner" onChange={(e) => update('headline', e.target.value)} /></Field>
          <Field label="Greeting" hint="First message when a chat opens.">
            <TextArea rows={2} value={form.greeting ?? ''} placeholder="Hey! Great to see you — how's your day?" onChange={(e) => update('greeting', e.target.value)} />
          </Field>
          <Field label="Custom instructions (persona)" hint="Appended to the AI's system prompt.">
            <TextArea rows={2} value={form.personaHint} placeholder="Speak warmly, use simple words, gently correct mistakes." onChange={(e) => update('personaHint', e.target.value)} />
          </Field>

          {/* Personality */}
          {(['formality', 'playfulness', 'energy'] as const).map((axis) => (
            <Field key={axis} label={`${axis} · ${form.personality?.[axis] ?? 50}`}>
              <input type="range" min={0} max={100} value={form.personality?.[axis] ?? 50} className="w-full accent-brand-500"
                onChange={(e) => update('personality', { ...(form.personality ?? DEFAULT_PERSONALITY), [axis]: parseInt(e.target.value, 10) })} />
            </Field>
          ))}
          <Field label="Speaking style">
            <div className="grid grid-cols-2 gap-2">
              {SPEAKING_STYLES.map((s) => (
                <button key={s.id} onClick={() => update('speakingStyle', s.id as SpeakingStyle)}
                  className={cn('text-left rounded-lg border p-2 transition', (form.speakingStyle ?? 'neutral') === s.id ? 'border-brand-400 bg-brand-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10')}>
                  <div className="text-xs font-semibold">{s.label}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Corrections" hint="How this companion handles your mistakes.">
            <div className="grid grid-cols-2 gap-2">
              {CORRECTION_STYLES.map((cs) => (
                <button key={cs.id} onClick={() => update('correctionStyle', cs.id)}
                  className={cn('text-left rounded-lg border p-2 transition', (form.correctionStyle ?? 'gentle') === cs.id ? 'border-brand-400 bg-brand-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10')}>
                  <div className="text-xs font-semibold">{cs.label}</div>
                  <div className="text-[10px] text-slate-400">{cs.desc}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Interests"><Chips values={form.interests ?? []} placeholder="hiking, jazz…" onChange={(n) => update('interests', n)} /></Field>
          <Field label="Card tags"><Chips values={form.traits ?? []} placeholder="Warm, Patient…" onChange={(n) => update('traits', n)} /></Field>

          {isEditingPreset && (
            <p className="text-[10px] text-amber-300/80">Editing a preset saves your own copy (same name) — the original stays available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
