import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { ProgressRing, SectionHeading, StatCard } from '../../components/ui'
import { IconMic, IconRefresh, IconVolume } from '../../components/icons'

// Hardcoded preview data — wired to wav2vec2 phoneme scoring in Phase 29.
interface ScoredWord {
  text: string
  score: number // 0–100
}

const SENTENCE: ScoredWord[] = [
  { text: 'I', score: 96 },
  { text: 'would', score: 88 },
  { text: 'like', score: 92 },
  { text: 'to', score: 80 },
  { text: 'book', score: 58 },
  { text: 'a', score: 90 },
  { text: 'table', score: 47 },
  { text: 'for', score: 85 },
  { text: 'two', score: 94 },
  { text: 'people', score: 63 }
]

const PHONEMES = [
  { sym: 'ˈteɪ', label: 'TAY', score: 72 },
  { sym: 'bəl', label: 'buhl', score: 38 }
]

function wordColor(score: number): string {
  if (score >= 85) return 'text-emerald-300'
  if (score >= 65) return 'text-amber-300'
  return 'text-rose-300'
}

function wordUnderline(score: number): string {
  if (score >= 85) return 'decoration-emerald-400/60'
  if (score >= 65) return 'decoration-amber-400/60'
  return 'decoration-rose-400/70'
}

function ringTone(score: number): 'vocab' | 'listen' | 'grammar' {
  if (score >= 85) return 'vocab'
  if (score >= 65) return 'listen'
  return 'grammar'
}

export default function PronunciationPage(): JSX.Element {
  const [selected, setSelected] = useState(6) // "table" — the weak word
  const overall = 76

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pronunciation</h1>
          <p className="text-sm text-slate-400 mt-1">
            Read the sentence aloud — every word is scored against a native speaker.
          </p>
        </div>

        {/* Score hero */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing value={overall} size={132} stroke={11} tone={ringTone(overall)}>
            <span className="text-3xl font-bold text-white">{overall}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">score</span>
          </ProgressRing>
          <div className="flex-1 w-full">
            {/* The sentence with per-word coloring */}
            <p className="text-2xl font-semibold leading-relaxed">
              {SENTENCE.map((w, i) => (
                <button
                  key={`${w.text}-${i}`}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'underline decoration-2 underline-offset-4 transition mr-2',
                    wordColor(w.score),
                    wordUnderline(w.score),
                    selected === i && 'bg-white/10 rounded px-1'
                  )}
                >
                  {w.text}
                </button>
              ))}
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Great
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Close
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Needs work
              </span>
            </div>
          </div>
        </div>

        {/* Selected word breakdown */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Word focus</p>
              <p className="text-xl font-bold text-white mt-0.5">
                {SENTENCE[selected].text}{' '}
                <span className={cn('text-sm', wordColor(SENTENCE[selected].score))}>
                  {SENTENCE[selected].score}%
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-pill bg-white/[0.06] hover:bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition">
                <IconVolume className="w-4 h-4 text-brand-300" /> Native
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-pill bg-white/[0.06] hover:bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition">
                <IconRefresh className="w-4 h-4 text-brand-300" /> Slow
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            {PHONEMES.map((p) => (
              <div
                key={p.sym}
                className="flex-1 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3 text-center"
              >
                <div className="text-lg font-bold text-white">{p.sym}</div>
                <div className="text-[11px] text-slate-500 mb-2">{p.label}</div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      p.score >= 65 ? 'bg-emerald-400' : 'bg-rose-400'
                    )}
                    style={{ width: `${p.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fluency stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value="118" label="Words / min" tone="brand" />
          <StatCard value="3" label="Long pauses" tone="amber" />
          <StatCard value="B1+" label="Fluency band" tone="emerald" />
        </div>

        {/* Record CTA */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button className="w-20 h-20 rounded-full bg-grad-brand text-white flex items-center justify-center shadow-glow hover:scale-105 transition active:scale-95">
            <IconMic className="w-8 h-8" />
          </button>
          <p className="text-xs text-slate-400">Tap to record · then get your score</p>
        </div>

        {/* Phoneme drills */}
        <div>
          <SectionHeading title="Phoneme drills" subtitle="Train the sounds Uzbek speakers often mix up" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {([
              { ipa: '/θ/', word: 'think', against: '/s/ sink', strength: 32 },
              { ipa: '/ð/', word: 'this', against: '/z/ ziss', strength: 41 },
              { ipa: '/w/', word: 'wood', against: '/v/ vood', strength: 78 },
              { ipa: '/æ/', word: 'cat', against: '/e/ ket', strength: 64 },
              { ipa: '/ɪ/', word: 'ship', against: '/iː/ sheep', strength: 55 },
              { ipa: '/ʌ/', word: 'cup', against: '/ɑː/ cop', strength: 49 }
            ] as const).map((p) => {
              const TONE = p.strength >= 75
                ? { text: 'text-emerald-300', bar: 'bg-emerald-400' }
                : p.strength >= 50
                  ? { text: 'text-amber-300', bar: 'bg-amber-400' }
                  : { text: 'text-rose-300', bar: 'bg-rose-400' }
              return (
                <button
                  key={p.ipa}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.05] transition"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">{p.ipa}</span>
                    <span className={cn('text-[11px] font-bold uppercase tracking-wider', TONE.text)}>{p.strength}%</span>
                  </div>
                  <p className="text-sm text-slate-200 mt-2">
                    <b className="text-white">{p.word}</b> vs <span className="text-slate-400">{p.against}</span>
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className={cn('h-full rounded-full', TONE.bar)} style={{ width: `${p.strength}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">Tap to drill 5 minimal pairs</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Minimal pairs picker (drill detail) */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
          <SectionHeading title="Today's drill: /θ/ vs /s/" subtitle="Tap the word you hear" />
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              ['think', 'sink'],
              ['thin', 'sin'],
              ['thank', 'sank'],
              ['mouth', 'mouse']
            ].map(([a, b]) => (
              <div key={a} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 flex items-center justify-between gap-2">
                <button className="flex-1 rounded-xl bg-white/[0.05] hover:bg-emerald-500/20 py-3 text-sm font-bold text-white transition">{a}</button>
                <button className="flex-1 rounded-xl bg-white/[0.05] hover:bg-emerald-500/20 py-3 text-sm font-bold text-white transition">{b}</button>
                <button title="Play audio" className="w-9 h-9 rounded-full bg-brand-500/15 hover:bg-brand-500/30 text-brand-200 flex items-center justify-center shrink-0">
                  <IconVolume className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
