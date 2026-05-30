import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Accent, CharacterInfo, MemoryNote, PersonalityTraits, UserProfile } from '@shared/types'
import { SPEAKING_STYLES, DEFAULT_PERSONALITY } from '@shared/types'
import { resolveCharacter, relationshipScore, relationshipTier, dailyMood } from '@shared/constants'
import { Card, Tabs, type TabItem } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import CharacterSection from './CharacterSection'
import CompanionMemory from './CompanionMemory'
import TTSProviderSection from './TTSProviderSection'
import VoiceSection from './VoiceSection'
import SpeakingRateSection from './SpeakingRateSection'
import AccentSection from './AccentSection'
import CompanionPreviewChat from './CompanionPreviewChat'

type WorkshopTab = 'browse' | 'persona' | 'memory' | 'voice' | 'preview'

const TABS: readonly TabItem<WorkshopTab>[] = [
  { id: 'browse', label: 'Browse' },
  { id: 'persona', label: 'Persona' },
  { id: 'memory', label: 'Memory' },
  { id: 'voice', label: 'Voice' },
  { id: 'preview', label: 'Preview chat' }
] as const

interface CompanionWorkshopProps {
  profile: UserProfile
  onPick: (characterId: string, accent: Accent) => void
  onCustomsChange: (next: CharacterInfo[]) => void
  onFavoritesChange: (next: string[]) => void
  onMemoryChange: (next: Record<string, MemoryNote[]>) => void
  onPatch: (patch: Partial<UserProfile['settings']>) => void
}

const TRAIT_LABELS: { key: keyof PersonalityTraits; low: string; high: string; label: string }[] = [
  { key: 'formality', low: 'Casual', high: 'Formal', label: 'Formality' },
  { key: 'playfulness', low: 'Serious', high: 'Playful', label: 'Playfulness' },
  { key: 'energy', low: 'Calm', high: 'High-energy', label: 'Energy' }
]

function PersonaSummary({
  character,
  profile
}: {
  character: CharacterInfo | null
  profile: UserProfile
}): JSX.Element {
  if (!character) {
    return <Card><p className="text-sm text-slate-400">No companion selected.</p></Card>
  }
  const p = character.personality ?? DEFAULT_PERSONALITY
  const style = SPEAKING_STYLES.find((s) => s.id === (character.speakingStyle ?? 'neutral'))
  const relScore = relationshipScore(profile.relationships, character.id)
  const rel = relationshipTier(relScore)
  const mood = dailyMood(character.id)
  const examples = character.exampleDialogue ?? []
  return (
    <Card>
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-semibold text-base">{character.name}'s persona</h2>
        <span className="text-[11px] text-slate-500">
          {character.isCustom ? 'Custom — edit on the Browse tab (✏️)' : 'Preset — duplicate on Browse to edit (⧉)'}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <p className="text-xs text-slate-400">{character.headline || 'No headline yet.'}</p>
        <span
          title="Mood varies a little day to day"
          className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-white/[0.06] text-slate-300 border border-white/10"
        >
          {mood.emoji} feeling {mood.label} today
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {TRAIT_LABELS.map(({ key, low, high, label }) => {
          const v = p[key]
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="font-semibold text-slate-300">{label}</span>
                <span>{low} · {v} · {high}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-grad-brand rounded-full" style={{ width: `${v}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Speaking style</p>
          <p className="text-sm text-white font-semibold">{style?.label ?? 'Neutral'}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{style?.description}</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Interests</p>
          <div className="flex flex-wrap gap-1">
            {(character.interests ?? []).length > 0 ? (
              (character.interests ?? []).map((t) => (
                <span key={t} className="text-[10px] rounded-full px-2 py-0.5 bg-white/[0.06] text-slate-300 border border-white/10">{t}</span>
              ))
            ) : (
              <span className="text-[11px] text-slate-500 italic">None set</span>
            )}
          </div>
        </div>
      </div>

      {/* Phase 8 — relationship progress (grows as you talk) */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="font-semibold text-slate-300">Relationship</span>
          <span>{rel.emoji} {rel.label} · {relScore}/100</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full bg-grad-brand rounded-full" style={{ width: `${relScore}%` }} />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Grows a little each time you chat with {character.name}.</p>
      </div>

      {/* Phase 8 — greeting + example dialogue preview */}
      {(character.greeting || examples.length > 0) && (
        <div className="mt-4 rounded-xl bg-white/[0.04] border border-white/10 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Sample dialogue</p>
          {character.greeting && (
            <p className="text-xs text-slate-200 italic">“{character.greeting}”</p>
          )}
          {examples.slice(0, 2).map((e, i) => (
            <div key={i} className="text-[11px] leading-snug">
              <p className="text-slate-400">You: {e.user}</p>
              <p className="text-brand-100">{character.name}: {e.character}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/**
 * The companion "studio": a tabbed workshop over the existing character/voice
 * sections plus a live persona summary and a text preview chat. Replaces the
 * flat stack that used to live directly in the Companion settings tab.
 */
export default function CompanionWorkshop({
  profile,
  onPick,
  onCustomsChange,
  onFavoritesChange,
  onMemoryChange,
  onPatch
}: CompanionWorkshopProps): JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<WorkshopTab>('browse')
  const s = profile.settings
  const active = resolveCharacter(profile, s.characterId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className={cn('rounded-card border border-white/10 bg-white/[0.02] p-1.5')}>
          <Tabs items={TABS} active={tab} onChange={setTab} />
        </div>
        <button
          onClick={() => navigate('/avatar-studio')}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/10 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.1] transition"
        >
          ➕ Create companion (Avatar Studio)
        </button>
      </div>

      {tab === 'browse' && (
        <CharacterSection
          profile={profile}
          onPick={onPick}
          onCustomsChange={onCustomsChange}
          onFavoritesChange={onFavoritesChange}
        />
      )}

      {tab === 'persona' && <PersonaSummary character={active} profile={profile} />}

      {tab === 'memory' && (
        <CompanionMemory profile={profile} character={active} onChange={onMemoryChange} />
      )}

      {tab === 'voice' && (
        <div className="grid grid-cols-1 gap-4">
          <TTSProviderSection tts={s.tts} onChange={(tts) => onPatch({ tts })} />
          <VoiceSection accent={s.accent} currentVoiceURI={s.voiceURI} onPick={(voiceURI) => onPatch({ voiceURI })} />
          <SpeakingRateSection current={s.ttsSpeed} onChange={(ttsSpeed) => onPatch({ ttsSpeed })} />
          <AccentSection current={s.accent} onChange={(accent) => onPatch({ accent })} />
        </div>
      )}

      {tab === 'preview' && <CompanionPreviewChat profile={profile} />}
    </div>
  )
}
