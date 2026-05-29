import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_AVATAR_3D, type Avatar3DConfig, type HairStyle } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/classnames'
import PageHeader from '../../components/layout/PageHeader'
import BackButton from '../../components/layout/BackButton'
import AvatarStudioCanvas from './AvatarStudioCanvas'

const SKIN_TONES = ['#ffe0c4', '#ffd9b8', '#f1c5a0', '#d9a877', '#b07d56', '#8d5a3c', '#5c3a26']
const HAIR_COLORS = ['#1c1410', '#3a281c', '#6b4423', '#a8702d', '#d9b06a', '#9b9b9b', '#e8e8e8', '#b3402f', '#3a5fcd']
const EYE_COLORS = ['#1a2b4a', '#3b6b3b', '#6b4423', '#2f2f2f', '#5a7fa8']
const OUTFIT_COLORS = ['#3b4a66', '#2f5d50', '#7a3b5d', '#b3402f', '#26303f', '#5a4a8a']
const BACKGROUNDS = ['#0b1020', '#142033', '#1e1430', '#0f2420', '#2a1622']

const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'long', label: 'Long' },
  { id: 'bun', label: 'Bun' },
  { id: 'bald', label: 'Bald' }
]

function Swatches({ colors, value, onPick }: { colors: string[]; value: string; onPick: (c: string) => void }): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          className={cn(
            'w-8 h-8 rounded-full ring-2 transition',
            value.toLowerCase() === c.toLowerCase() ? 'ring-white scale-110' : 'ring-white/20 hover:ring-white/50'
          )}
          style={{ backgroundColor: c }}
          aria-label={c}
        />
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">{label}</p>
      {children}
    </div>
  )
}

export default function AvatarStudioPage(): JSX.Element {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const [cfg, setCfg] = useState<Avatar3DConfig>(profile?.avatar3d ?? DEFAULT_AVATAR_3D)
  const [vrmUrl, setVrmUrl] = useState<string>(profile?.settings.vrmModelUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const patch = (p: Partial<Avatar3DConfig>): void => {
    setCfg((c) => ({ ...c, ...p }))
    setSaved(false)
  }

  const save = async (): Promise<void> => {
    if (!profile) return
    setSaving(true)
    const next = {
      ...profile,
      avatar3d: cfg,
      settings: { ...profile.settings, vrmModelUrl: vrmUrl.trim() || undefined },
      updatedAt: new Date().toISOString()
    }
    await window.api.profile.save(next)
    setProfile(next)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-950">
      <PageHeader
        left={<BackButton to="/settings" />}
        title="Avatar studio"
        subtitle="Design your 3D companion. Drag the head to rotate."
        right={
          <button onClick={() => void save()} disabled={saving} className="btn-primary px-4 py-2 text-sm">
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save avatar'}
          </button>
        }
      />

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Live preview */}
        <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/30 min-h-[420px]">
          <AvatarStudioCanvas config={cfg} />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-5">
          <Field label="Skin tone">
            <Swatches colors={SKIN_TONES} value={cfg.skinTone} onPick={(skinTone) => patch({ skinTone })} />
          </Field>

          <Field label="Hair style">
            <div className="flex flex-wrap gap-2">
              {HAIR_STYLES.map((h) => (
                <button
                  key={h.id}
                  onClick={() => patch({ hairStyle: h.id })}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-bold border transition',
                    cfg.hairStyle === h.id
                      ? 'bg-brand-500/20 border-brand-400/40 text-brand-100'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Hair color">
            <Swatches colors={HAIR_COLORS} value={cfg.hairColor} onPick={(hairColor) => patch({ hairColor })} />
          </Field>

          <Field label="Eye color">
            <Swatches colors={EYE_COLORS} value={cfg.eyeColor} onPick={(eyeColor) => patch({ eyeColor })} />
          </Field>

          <Field label="Outfit color">
            <Swatches colors={OUTFIT_COLORS} value={cfg.outfitColor} onPick={(outfitColor) => patch({ outfitColor })} />
          </Field>

          <Field label="Background">
            <Swatches colors={BACKGROUNDS} value={cfg.background} onPick={(background) => patch({ background })} />
          </Field>

          <Field label={`Head shape · ${cfg.headRoundness.toFixed(2)}`}>
            <input
              type="range"
              min={1}
              max={1.3}
              step={0.01}
              value={cfg.headRoundness}
              onChange={(e) => patch({ headRoundness: Number(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Round</span><span>Long</span>
            </div>
          </Field>

          <button
            onClick={() => { setCfg(DEFAULT_AVATAR_3D); setSaved(false) }}
            className="btn-ghost text-xs px-3 py-2 self-start"
          >
            Reset to default
          </button>

          <div className="pt-4 border-t border-white/10">
            <Field label="Realistic 3D model (VRM)">
              <input
                value={vrmUrl}
                onChange={(e) => { setVrmUrl(e.target.value); setSaved(false) }}
                placeholder="https://…/model.vrm  or  /vendor/avatars/me.vrm"
                className="input w-full"
              />
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Paste a free <code>.vrm</code> model link (e.g. from{' '}
                <span className="text-slate-300">VRoid Hub</span>) to use a full anime-style 3D
                avatar with lip-sync in Speaking → 3D mode. A companion's own VRM (set in the
                character editor) overrides this. Leave empty to keep the procedural avatar above.
              </p>
            </Field>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-600 text-center pb-6">
        Procedural three.js avatar is fully offline. VRM models load with lip-sync and fall back
        to the procedural avatar if a model can't be loaded.
      </p>
    </div>
  )
}
