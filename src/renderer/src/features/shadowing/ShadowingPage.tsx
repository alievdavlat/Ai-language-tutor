import { useCallback, useMemo, useState } from 'react'
import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, SectionHeading } from '../../components/ui'
import { IconHeadphones, IconMic, IconPlay, IconStar, IconVolume } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { useTTS } from '../../hooks/tts'
import { useSpeechAttempt } from '../../hooks/useSpeechAttempt'
import { useWaveformRecorder } from '../../hooks/useWaveformRecorder'
import { scoreAttempt, type ScoredWord } from '../../lib/pronunciation'
import { logActivity } from '../../services/activity'
import { backend } from '../../services/backend/useBackend'
import { ACCENT_TO_LANG } from '@shared/constants'

type Step = 'listen' | 'record' | 'compare'

interface ShadowPack {
  id: string
  title: string
  level: string
  cover: string
  sentences: string[]
}

const PACKS: ShadowPack[] = [
  {
    id: 'everyday',
    title: 'Everyday conversation',
    level: 'A2',
    cover: 'from-brand-500 to-indigo-700',
    sentences: [
      'Could you tell me where the nearest subway station is?',
      'I was wondering if you could help me with something.',
      'Let me know if there is anything else you need.',
      'It looks like the meeting has been moved to tomorrow.'
    ]
  },
  {
    id: 'travel',
    title: 'Travel essentials',
    level: 'A2',
    cover: 'from-emerald-500 to-teal-700',
    sentences: [
      'I would like to check in for my flight to London, please.',
      'Could I get a window seat if one is still available?',
      'How long does it take to get to the city center from here?',
      'Is breakfast included in the price of the room?',
      'Could you recommend a good local restaurant nearby?',
      'What time does the last train leave tonight?'
    ]
  },
  {
    id: 'business',
    title: 'Business meetings',
    level: 'B1',
    cover: 'from-sky-500 to-blue-700',
    sentences: [
      'Let me walk you through the main points of the proposal.',
      'Could we schedule a follow-up call for early next week?',
      'I think we should focus on the long-term benefits first.',
      'Does anyone have any questions before we move on?',
      'We need to finalize the budget by the end of the month.',
      'Thank you all for taking the time to join the meeting today.'
    ]
  },
  {
    id: 'service',
    title: 'Customer service',
    level: 'A2',
    cover: 'from-rose-500 to-pink-700',
    sentences: [
      'I am sorry to hear that — let me see what I can do.',
      'Could you give me your order number, please?',
      'Your refund should arrive within three to five business days.',
      'Is there anything else I can help you with today?',
      'I will transfer you to the right department right away.'
    ]
  },
  {
    id: 'idioms',
    title: 'Idioms & expressions',
    level: 'B2',
    cover: 'from-violet-500 to-purple-700',
    sentences: [
      'It costs an arm and a leg, but it is worth every penny.',
      'Let us not beat around the bush and get straight to the point.',
      'I was on the fence about it, but you have convinced me.',
      'That exam was a piece of cake compared to the last one.',
      'We will cross that bridge when we come to it.',
      'He let the cat out of the bag about the surprise party.'
    ]
  }
]

// Per-pack completed-sentence progress, persisted across sessions.
const PROGRESS_KEY = 'speakai.shadowing.v1'

function loadProgress(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}') as Record<string, string[]>
  } catch {
    return {}
  }
}

function saveProgress(p: Record<string, string[]>): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
}

function wordColor(s: number): string {
  if (s >= 85) return 'text-emerald-300'
  if (s >= 65) return 'text-amber-300'
  return 'text-rose-300'
}

export default function ShadowingPage(): JSX.Element {
  const accent = useAppStore((s) => s.profile?.settings.accent) ?? 'us'
  const lang = ACCENT_TO_LANG[accent]
  const ttsNormal = useTTS({ accent, rate: 1 })
  const tts075 = useTTS({ accent, rate: 0.75 })
  const tts050 = useTTS({ accent, rate: 0.5 })
  const attempt = useSpeechAttempt(lang)
  const recorder = useWaveformRecorder()

  const [step, setStep] = useState<Step>('listen')
  const [packId, setPackId] = useState(PACKS[0].id)
  const pack = PACKS.find((p) => p.id === packId) ?? PACKS[0]
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const sentence = pack.sentences[sentenceIdx]
  const words = useMemo(() => sentence.split(/\s+/), [sentence])
  const [progress, setProgress] = useState<Record<string, string[]>>(loadProgress)

  const markDone = useCallback(
    (s: string): void => {
      setProgress((cur) => {
        const done = new Set(cur[pack.id] ?? [])
        if (done.has(s)) return cur
        done.add(s)
        const next = { ...cur, [pack.id]: [...done] }
        saveProgress(next)
        return next
      })
      const me = backend.currentUserId()
      if (me) void logActivity({ userId: me, kind: 'speaking_session', minutes: 1, meta: { feature: 'shadowing', pack: pack.id } })
    },
    [pack.id]
  )

  const openPack = (id: string): void => {
    if (id === packId) return
    attempt.stop()
    recorder.stop()
    setScored(null)
    setPackId(id)
    setSentenceIdx(0)
    setStep('listen')
  }

  const [scored, setScored] = useState<ScoredWord[] | null>(null)
  const overall = scored ? Math.round(scored.reduce((a, b) => a + b.score, 0) / scored.length) : 0
  const matched = scored ? scored.filter((w) => w.score >= 65).length : 0

  const tips = useMemo(() => {
    if (!scored) return []
    return scored
      .filter((w) => w.score < 65)
      .slice(0, 3)
      .map((w) => `Focus on “${w.text}” — it didn’t come through clearly. Listen again and slow down.`)
  }, [scored])

  const play = (rate: 1 | 0.75 | 0.5): void => {
    ttsNormal.cancel()
    tts075.cancel()
    tts050.cancel()
    const t = rate === 1 ? ttsNormal : rate === 0.75 ? tts075 : tts050
    void t.speak(sentence)
  }

  const startRecording = (): void => {
    setScored(null)
    setStep('record')
    attempt.start()
    void recorder.start()
  }

  const finishRecording = (): void => {
    attempt.stop()
    recorder.stop()
    window.setTimeout(() => {
      const result = scoreAttempt(sentence, attempt.transcript)
      setScored(result.words)
      const pct = result.words.length
        ? Math.round(result.words.reduce((a, b) => a + b.score, 0) / result.words.length)
        : 0
      if (pct >= 65) markDone(sentence)
      setStep('compare')
    }, 350)
  }

  const nextSentence = (): void => {
    setScored(null)
    setSentenceIdx((i) => (i + 1) % pack.sentences.length)
    setStep('listen')
  }

  const liveBars = recorder.levels
  const resultBars = recorder.bars

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Speaking · Shadowing"
          title="Shadow native speakers"
          subtitle="Listen, repeat, compare. Train rhythm and intonation, not just pronunciation."
          back="/speaking"
          crumbs={[{ label: 'Speaking', to: '/speaking' }, { label: 'Shadowing' }]}
        />

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {(['listen', 'record', 'compare'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                  step === s ? 'bg-grad-brand text-white' : 'bg-white/[0.05] text-slate-400'
                )}
              >
                {i + 1}
              </span>
              <span className={cn('text-xs font-semibold capitalize', step === s ? 'text-white' : 'text-slate-400')}>{s}</span>
              {i < 2 && <span className="flex-1 h-px bg-white/[0.06]" />}
            </div>
          ))}
        </div>

        {/* Stage card */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center gap-5">
          <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">
            {pack.title} · {sentenceIdx + 1}/{pack.sentences.length}
          </p>
          <p className="text-2xl font-bold text-white text-center leading-relaxed">
            {step === 'compare' && scored
              ? scored.map((w, i) => <span key={i} className={cn('mr-2', wordColor(w.score))}>{w.text}</span>)
              : sentence}
          </p>

          {step === 'listen' && (
            <div className="flex flex-col items-center gap-3">
              <button onClick={() => play(1)} className="w-20 h-20 rounded-full bg-grad-brand flex items-center justify-center shadow-2xl ring-4 ring-brand-400/30 hover:brightness-110">
                <IconPlay className="w-8 h-8 text-white ml-1" />
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <button onClick={() => play(1)} className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-1 hover:bg-white/[0.10]"><IconVolume className="w-3 h-3" /> Normal</button>
                <button onClick={() => play(0.75)} className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-1 hover:bg-white/[0.10]"><IconVolume className="w-3 h-3" /> 0.75×</button>
                <button onClick={() => play(0.5)} className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-1 hover:bg-white/[0.10]"><IconVolume className="w-3 h-3" /> 0.5×</button>
              </div>
              <p className="text-xs text-slate-500">Listen 2-3 times before recording.</p>
            </div>
          )}

          {step === 'record' && (
            <div className="flex flex-col items-center gap-3 w-full">
              <button onClick={finishRecording} className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center shadow-2xl ring-4 ring-rose-400/40 animate-pulse">
                <IconMic className="w-8 h-8 text-white" />
              </button>
              <p className="text-xs text-rose-200 font-semibold">Recording… repeat the sentence, then tap to finish</p>
              {attempt.interim && <p className="text-xs text-slate-400 italic">heard: “{attempt.interim}”</p>}
              <div className="flex items-center gap-0.5 h-12">
                {(liveBars.length ? liveBars : Array.from({ length: 24 }).map(() => 0)).map((v, i) => (
                  <span key={i} className="w-1 rounded-full bg-rose-400 transition-all" style={{ height: `${Math.max(4, v * 44)}px`, opacity: 0.5 + v * 0.5 }} />
                ))}
              </div>
              {recorder.error && <p className="text-xs text-rose-300">{recorder.error}</p>}
            </div>
          )}

          {step === 'compare' && scored && (
            <div className="w-full flex flex-col gap-4">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Overall</p>
                  <p className="text-4xl font-black text-brand-200">{overall}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Words matched</p>
                  <p className="text-4xl font-black text-emerald-300">{matched}/{words.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Length</p>
                  <p className="text-4xl font-black text-amber-300">{attempt.durationSec ? `${attempt.durationSec.toFixed(1)}s` : '—'}</p>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Your recording</p>
                  {recorder.audioUrl && (
                    <button
                      onClick={() => {
                        const a = new Audio(recorder.audioUrl as string)
                        void a.play()
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-1 text-[11px] text-slate-200 hover:bg-white/[0.1]"
                    >
                      <IconPlay className="w-3 h-3" /> Play back
                    </button>
                  )}
                </div>
                <div className="flex items-end gap-0.5 h-12">
                  {(resultBars.length ? resultBars : Array.from({ length: 48 }).map(() => 0)).map((v, i) => (
                    <span key={i} className="flex-1 rounded-t bg-brand-400/70" style={{ height: `${Math.max(6, v * 100)}%` }} />
                  ))}
                </div>
                <p className="text-[10px] text-brand-300 mt-1.5">● You — amplitude of your take</p>
                {attempt.transcript && <p className="text-[11px] text-slate-400 mt-2">We heard: “{attempt.transcript}”</p>}
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        {step === 'compare' && tips.length > 0 && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <SectionHeading title="Suggested fixes" subtitle="Try again with these in mind" />
            <ul className="flex flex-col gap-2">
              {tips.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-200 text-[11px] flex items-center justify-center shrink-0 mt-0.5">→</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step === 'compare' && scored && tips.length === 0 && (
          <p className="text-sm text-emerald-300 text-center">Excellent — every word came through clearly. 🎉</p>
        )}

        {/* Step controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 'record') {
                attempt.stop()
                recorder.stop()
              }
              setStep('listen')
            }}
            disabled={step === 'listen'}
            className="btn-ghost text-xs px-4 py-2 disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={() => {
              if (step === 'listen') startRecording()
              else if (step === 'record') finishRecording()
              else nextSentence()
            }}
            disabled={step === 'record' ? false : !attempt.supported && step === 'listen'}
            className="btn-primary text-xs px-4 py-2"
          >
            {step === 'compare' ? 'Next sentence' : step === 'record' ? 'Show feedback' : 'Start recording'} →
          </button>
        </div>

        {/* Sets */}
        <SectionHeading title="Shadowing sets" subtitle="Pick a themed pack" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {PACKS.map((p) => {
            const done = (progress[p.id] ?? []).filter((s) => p.sentences.includes(s)).length
            const pct = Math.round((done / p.sentences.length) * 100)
            return (
              <button
                key={p.id}
                onClick={() => openPack(p.id)}
                className={cn(
                  'rounded-2xl overflow-hidden border bg-white/[0.025] text-left transition',
                  p.id === packId ? 'border-brand-400/60 ring-1 ring-brand-400/40' : 'border-white/10 hover:border-white/20'
                )}
              >
                <div className={cn('relative h-20 bg-gradient-to-br', p.cover)}>
                  <span className="absolute top-2 left-2 rounded-full bg-black/30 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">{p.level}</span>
                  <IconHeadphones className="absolute bottom-2 right-2 w-5 h-5 text-white/80" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-white">{p.title}</p>
                  <p className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                    <IconStar className="w-3 h-3 text-amber-300" /> {done}/{p.sentences.length} done
                  </p>
                  <div className="mt-2"><ProgressBar value={pct} color="brand" /></div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
