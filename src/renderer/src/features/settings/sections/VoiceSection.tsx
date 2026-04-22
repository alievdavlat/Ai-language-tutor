import { useState } from 'react'
import type { Accent } from '@shared/types'
import { ACCENT_LABELS } from '@shared/constants'
import { Button, Card } from '../../../components/ui'
import { previewSystemVoice, useSystemVoices, type SystemVoice } from '../../../hooks/useSystemVoices'
import { cn } from '../../../lib/classnames'

interface VoiceSectionProps {
  accent: Accent
  currentVoiceURI: string
  onPick: (voiceURI: string) => void
}

/**
 * Infer a friendly label ("Male voice / Female voice") from common vendor
 * naming — Microsoft Mark/David = male, Zira/Hazel = female, etc. Keeps the
 * original name as the subtitle for advanced users.
 */
function prettyVoiceLabel(v: SystemVoice): { title: string; subtitle: string } {
  const name = v.name
  const male = /\b(mark|david|george|daniel|james|liam|marco|tom|alex|ravi)\b/i
  const female = /\b(zira|emma|priya|hazel|susan|karen|kate|nina|yui|heera|female)\b/i
  let gender: 'Male voice' | 'Female voice' | 'Voice' = 'Voice'
  if (female.test(name)) gender = 'Female voice'
  else if (male.test(name)) gender = 'Male voice'

  return { title: `${gender} · ${v.lang}`, subtitle: name }
}

export default function VoiceSection({
  accent,
  currentVoiceURI,
  onPick
}: VoiceSectionProps): JSX.Element {
  const voices = useSystemVoices(accent)
  const [showAll, setShowAll] = useState(false)

  const autoActive = currentVoiceURI === ''
  const selectedVoice = voices.find((v) => v.voiceURI === currentVoiceURI)
  const visibleVoices = showAll ? voices : voices.slice(0, 3)

  return (
    <Card>
      <h2 className="font-semibold mb-1">Voice</h2>
      <p className="text-xs text-slate-500 mb-4">
        Voices installed on your computer for {ACCENT_LABELS[accent]}. <b>Auto</b> lets the
        app pick the best match — recommended for most people.
      </p>

      <button
        type="button"
        className={cn(
          'w-full rounded-xl p-3 mb-3 flex items-center gap-3 transition border text-left',
          autoActive
            ? 'border-brand-400/60 bg-brand-500/10'
            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
        )}
        onClick={() => onPick('')}
      >
        <div className="w-10 h-10 rounded-xl bg-grad-brand flex items-center justify-center text-lg shrink-0">
          ✨
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Auto (recommended)</div>
          <div className="text-xs text-slate-400 truncate">
            {selectedVoice
              ? `Currently using ${prettyVoiceLabel(selectedVoice).subtitle}`
              : 'Best system voice for this accent'}
          </div>
        </div>
        {autoActive && <span className="text-xs text-brand-300 font-semibold">● Active</span>}
      </button>

      {voices.length === 0 && (
        <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 p-3 text-xs text-amber-200">
          No voices installed for this accent. Open Windows{' '}
          <span className="font-semibold">Settings → Time &amp; Language → Speech</span> and
          add a voice for this language.
        </div>
      )}

      {voices.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Or pick a specific voice:</span>
            {voices.length > 3 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-xs text-brand-300 hover:text-brand-200 underline"
              >
                {showAll ? 'Show less' : `Show all (${voices.length})`}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {visibleVoices.map((v) => {
              const active = currentVoiceURI === v.voiceURI
              const pretty = prettyVoiceLabel(v)
              return (
                <div
                  key={v.voiceURI}
                  className={cn(
                    'rounded-xl p-3 border transition flex items-center gap-3',
                    active
                      ? 'border-brand-400/60 bg-brand-500/10'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{pretty.title}</div>
                    <div className="text-xs text-slate-500 truncate">{pretty.subtitle}</div>
                  </div>
                  <Button
                    variant="ghost"
                    className="!py-1.5 !px-3"
                    onClick={() => previewSystemVoice(v.voiceURI)}
                    title="Play sample"
                  >
                    🔊
                  </Button>
                  {active ? (
                    <span className="text-xs text-brand-300 font-semibold px-2">● Active</span>
                  ) : (
                    <Button className="!py-1.5 !px-3" onClick={() => onPick(v.voiceURI)}>
                      Use
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}
