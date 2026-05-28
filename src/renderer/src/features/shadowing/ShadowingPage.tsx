import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { ProgressBar, SectionHeading } from '../../components/ui'
import { IconHeadphones, IconMic, IconPlay, IconStar, IconVolume } from '../../components/icons'

type Step = 'listen' | 'record' | 'compare'

const SENTENCE = "Could you tell me where the nearest subway station is?"
const WORDS = SENTENCE.split(/\s+/)

// Mock per-word accuracy scores after compare step
const SCORES = [92, 88, 71, 95, 84, 60, 90, 88, 95]

const TIPS = [
  'Match the falling intonation on "is".',
  'The "t" in "station" is often a soft "d" in American English.',
  'Practice the stress on "nearest" — two syllables, first stressed.'
]

const SETS = [
  { title: 'Travel essentials', count: 12, level: 'A2', cover: 'from-emerald-500 to-teal-700' },
  { title: 'Business meetings', count: 18, level: 'B1', cover: 'from-sky-500 to-blue-700' },
  { title: 'Customer service', count: 10, level: 'A2', cover: 'from-rose-500 to-pink-700' },
  { title: 'Idioms & expressions', count: 22, level: 'B2', cover: 'from-violet-500 to-purple-700' }
]

function wordColor(s: number): string {
  if (s >= 90) return 'text-emerald-300'
  if (s >= 75) return 'text-amber-300'
  return 'text-rose-300'
}

export default function ShadowingPage(): JSX.Element {
  const [step, setStep] = useState<Step>('listen')
  const overall = Math.round(SCORES.reduce((a, b) => a + b, 0) / SCORES.length)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">Speaking · Shadowing</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Shadow native speakers</h1>
          <p className="text-sm text-slate-400 mt-1">Listen, repeat, compare. Train rhythm and intonation, not just pronunciation.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {(['listen', 'record', 'compare'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                  step === s ? 'bg-grad-brand text-white' : step === 'compare' || (step === 'record' && s === 'listen') ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/[0.05] text-slate-400'
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
            {step === 'compare'
              ? WORDS.map((w, i) => <span key={i} className={cn('mr-2', wordColor(SCORES[i] ?? 80))}>{w}</span>)
              : SENTENCE}
          </p>

          {step === 'listen' && (
            <div className="flex flex-col items-center gap-3">
              <button className="w-20 h-20 rounded-full bg-grad-brand flex items-center justify-center shadow-2xl ring-4 ring-brand-400/30 hover:brightness-110">
                <IconPlay className="w-8 h-8 text-white ml-1" />
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <button className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-1 hover:bg-white/[0.10]"><IconVolume className="w-3 h-3" /> Normal</button>
                <button className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-1 hover:bg-white/[0.10]"><IconVolume className="w-3 h-3" /> 0.75×</button>
                <button className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-3 py-1 hover:bg-white/[0.10]"><IconVolume className="w-3 h-3" /> 0.5×</button>
              </div>
              <p className="text-xs text-slate-500">Listen 2-3 times before recording.</p>
            </div>
          )}

          {step === 'record' && (
            <div className="flex flex-col items-center gap-3">
              <button className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center shadow-2xl ring-4 ring-rose-400/40 animate-pulse">
                <IconMic className="w-8 h-8 text-white" />
              </button>
              <p className="text-xs text-rose-200 font-semibold">Recording… repeat the sentence</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span key={i} className="w-1 rounded-full bg-rose-400" style={{ height: `${10 + Math.abs(Math.sin(i)) * 16}px`, opacity: 0.4 + Math.random() * 0.6 }} />
                ))}
              </div>
            </div>
          )}

          {step === 'compare' && (
            <div className="w-full flex flex-col gap-4">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Overall</p>
                  <p className="text-4xl font-black text-brand-200">{overall}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Rhythm</p>
                  <p className="text-4xl font-black text-emerald-300">88%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Intonation</p>
                  <p className="text-4xl font-black text-amber-300">72%</p>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Waveform vs. native</p>
                <div className="flex items-end gap-0.5 h-12">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <span key={i} className="flex-1 rounded-t bg-brand-400/60" style={{ height: `${20 + Math.abs(Math.sin(i * 0.6)) * 70}%` }} />
                  ))}
                </div>
                <div className="flex items-end gap-0.5 h-12 mt-1">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <span key={i} className="flex-1 rounded-t bg-emerald-400/60" style={{ height: `${20 + Math.abs(Math.cos(i * 0.55)) * 70}%` }} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] mt-1.5">
                  <span className="text-brand-300">●  You</span>
                  <span className="text-emerald-300">●  Native</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        {step === 'compare' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <SectionHeading title="Suggested fixes" subtitle="Try again with these in mind" />
            <ul className="flex flex-col gap-2">
              {TIPS.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-slate-200">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-200 text-[11px] flex items-center justify-center shrink-0 mt-0.5">→</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Step controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const order: Step[] = ['listen', 'record', 'compare']
              const i = order.indexOf(step)
              if (i > 0) setStep(order[i - 1])
            }}
            disabled={step === 'listen'}
            className="btn-ghost text-xs px-4 py-2 disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={() => {
              const order: Step[] = ['listen', 'record', 'compare']
              const i = order.indexOf(step)
              if (i < order.length - 1) setStep(order[i + 1])
              else setStep('listen')
            }}
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
