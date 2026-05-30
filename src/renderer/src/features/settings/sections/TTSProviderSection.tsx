import { useEffect, useState } from 'react'
import { TTS_PROVIDERS, type TTSProvider } from '@shared/constants'
import type { TTSConfig } from '@shared/types'
import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { IconArrowRight } from '../../../components/icons'

interface TTSProviderSectionProps {
  tts: TTSConfig | undefined
  onChange: (tts: TTSConfig) => void
}

const KIND_LABEL: Record<TTSProvider['kind'], string> = {
  browser: 'Built-in',
  local: 'Offline',
  cloud: 'Cloud'
}

/** Speak a short sample with the built-in browser voice (system provider). */
function testSystemVoice(): void {
  try {
    const u = new SpeechSynthesisUtterance('Hi! This is how I sound.')
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {
    /* no speechSynthesis — ignore */
  }
}

function ProviderCard({
  p,
  cfg,
  open,
  onToggle,
  onChange
}: {
  p: TTSProvider
  cfg: TTSConfig
  open: boolean
  onToggle: () => void
  onChange: (next: TTSConfig) => void
}): JSX.Element {
  const isActive = cfg.activeProviderId === p.id
  const persisted = cfg.tokens?.[p.id] ?? ''
  const [token, setToken] = useState(persisted)
  useEffect(() => setToken(persisted), [persisted])

  const setKey = (v: string): void => {
    setToken(v)
    onChange({ ...cfg, tokens: { ...(cfg.tokens ?? {}), [p.id]: v } })
  }
  const use = (): void => onChange({ ...cfg, activeProviderId: p.id })

  return (
    <article
      className={cn(
        'rounded-card border bg-white/[0.025] overflow-hidden transition',
        isActive ? 'border-brand-400/50 ring-2 ring-brand-400/20' : 'border-white/10 hover:border-white/20'
      )}
    >
      <button onClick={onToggle} className={cn('w-full text-left bg-gradient-to-br p-4 flex items-center gap-4', p.cover)}>
        <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-xl shrink-0">{p.flag}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-black text-white">{p.name}</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 bg-white/20 text-white">{KIND_LABEL[p.kind]}</span>
            {p.hasFreeTier && <span className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 bg-emerald-500/80 text-white">Free</span>}
            {p.status === 'soon' && <span className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 bg-amber-500/80 text-white">Soon</span>}
            {isActive && <span className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5 bg-white/30 text-white">Active</span>}
          </div>
          <p className="text-xs text-white/90 mt-0.5 line-clamp-1">{p.tagline}</p>
        </div>
        <span className={cn('text-white/80 text-xs', open && 'rotate-90')} aria-hidden>→</span>
      </button>

      {open && (
        <div className="p-5 flex flex-col gap-4 bg-black/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">Strengths</p>
              <ul className="text-xs text-slate-300 mt-1.5 flex flex-col gap-1">
                {p.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">✓</span><span>{s}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-rose-300 font-bold">Watch out for</p>
              <ul className="text-xs text-slate-300 mt-1.5 flex flex-col gap-1">
                {p.weaknesses.map((s) => (
                  <li key={s} className="flex items-start gap-1.5"><span className="text-rose-400 mt-0.5">•</span><span>{s}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {p.freeTier && <p className="text-[11px] text-emerald-300">🎁 {p.freeTier}</p>}

          {p.needsKey && (
            <div>
              {p.tokenSteps && (
                <ol className="flex flex-col gap-1.5 text-sm text-slate-200 mb-2">
                  {p.tokenSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="inline-flex shrink-0 w-5 h-5 rounded-full bg-white/[0.06] text-[11px] font-bold text-slate-300 items-center justify-center mt-0.5">{i + 1}</span>
                      {step.url ? (
                        <a href={step.url} target="_blank" rel="noreferrer" className="text-brand-300 hover:text-brand-200 inline-flex items-center gap-1">
                          {step.label} <IconArrowRight className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span>{step.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{p.tokenLabel}</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Paste your key here…"
                className="input w-full font-mono text-xs mt-1.5"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={use}
              disabled={isActive}
              className={cn('btn-primary text-xs px-4 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed', isActive && '!bg-white/[0.06] !text-emerald-300 !shadow-none')}
            >
              {isActive ? '✓ Active voice' : 'Use this voice'}
            </button>
            {p.id === 'system' ? (
              <button onClick={testSystemVoice} className="rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs px-3 py-2.5 text-slate-200">
                🔊 Test voice
              </button>
            ) : (
              <span className="text-[11px] text-amber-300/90">
                {p.status === 'soon' ? '🚧 Playback wiring in progress — falls back to the system voice for now.' : ''}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500">Keys are stored on this device only · never uploaded.</p>
        </div>
      )}
    </article>
  )
}

/**
 * Pick the companion's voice engine. System voice works today; the neural
 * engines (Edge, Kokoro, ElevenLabs, …) save your selection + key and switch on
 * once their integration ships.
 */
export default function TTSProviderSection({ tts, onChange }: TTSProviderSectionProps): JSX.Element {
  const cfg: TTSConfig = tts ?? { activeProviderId: 'system', tokens: {}, voices: {} }
  const [openId, setOpenId] = useState<string | null>(cfg.activeProviderId)

  return (
    <Card>
      <h2 className="font-semibold text-base mb-1">Companion voice (TTS)</h2>
      <p className="text-xs text-slate-500 mb-4">
        Choose what your companion sounds like. <b className="text-slate-300">System voice</b> is instant &amp; offline;
        the neural engines below sound far more natural (many are free).
      </p>
      <div className="flex flex-col gap-3">
        {TTS_PROVIDERS.map((p) => (
          <ProviderCard
            key={p.id}
            p={p}
            cfg={cfg}
            open={openId === p.id}
            onToggle={() => setOpenId((cur) => (cur === p.id ? null : p.id))}
            onChange={onChange}
          />
        ))}
      </div>
    </Card>
  )
}
