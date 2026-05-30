import { useMemo, useState } from 'react'
import { cn } from '../../lib/classnames'
import { PageHeader, ProgressBar, SectionHeading } from '../../components/ui'
import { IconHeadphones, IconMic, IconPlay, IconStar, IconVolume } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { useTTS } from '../../hooks/tts'
import { useSpeechAttempt } from '../../hooks/useSpeechAttempt'
import { useWaveformRecorder } from '../../hooks/useWaveformRecorder'
import { scoreAttempt, type ScoredWord } from '../../lib/pronunciation'
import { ACCENT_TO_LANG } from '@shared/constants'

type Step = 'listen' | 'record' | 'compare'

const SENTENCES = [
  'Could you tell me where the nearest subway station is?',
  'I was wondering if you could help me with something.',
  'Let me know if there is anything else you need.',
  'It looks like the meeting has been moved to tomorrow.'
]

const SETS = [
  { title: 'Travel essentials', count: 12, level: 'A2', cover: 'from-emerald-500 to-teal-700' },
  { title: 'Business meetings', count: 18, level: 'B1', cover: 'from-sky-500 to-blue-700' },
  { title: 'Customer service', count: 10, level: 'A2', cover: 'from-rose-500 to-pink-700' },
  { title: 'Idioms & expressions', count: 22, level: 'B2', cover: 'from-violet-500 to-purple-700' }
]

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
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const sentence = SENTENCES[sentenceIdx]
  const words = useMemo(() => sentence.split(/\s+/), [sentence])

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
      setScored(scoreAttempt(sentence, attempt.transcript).words)
      setStep('compare')
    }, 350)
  }

  const nextSentence = (): void => {
    setScored(null)
    setSentenceIdx((i) => (i + 1) % SENTENCES.length)
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
          <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">Target sentence</p>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {SETS.map((s) => (
            <button key={s.title} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.025] hover:border-white/20 text-left">
              <div className={cn('relative h-20 bg-gradient-to-br', s.cover)}>
                <span className="absolute top-2 left-2 rounded-full bg-black/30 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">{s.level}</span>
                <IconHeadphones className="absolute bottom-2 right-2 w-5 h-5 text-white/80" />
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-white">{s.title}</p>
                <p className="text-[11px] text-slate-400 inline-flex items-center gap-1"><IconStar className="w-3 h-3 text-amber-300" /> {s.count} sentences</p>
              </div>
            </button>
          ))}
        </div>

        <ProgressBar value={42} color="brand" className="hidden" />
      </div>
    </div>
  )
}
