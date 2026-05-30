import { useMemo, useState } from 'react'
import { cn } from '../../lib/classnames'
import { ProgressRing, SectionHeading, StatCard } from '../../components/ui'
import { IconMic, IconRefresh, IconVolume } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { useSpeechAttempt } from '../../hooks/useSpeechAttempt'
import { useTTS } from '../../hooks/tts'
import { scoreAttempt, type ScoredWord } from '../../lib/pronunciation'
import { ACCENT_TO_LANG } from '@shared/constants'

const SENTENCES = [
  'I would like to book a table for two people',
  'Could you tell me how to get to the station',
  'The weather is lovely this afternoon',
  'I really think we should leave a little earlier'
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
  const accent = useAppStore((s) => s.profile?.settings.accent) ?? 'us'
  const lang = ACCENT_TO_LANG[accent]
  const attempt = useSpeechAttempt(lang)
  const ttsNormal = useTTS({ accent, rate: 1 })
  const ttsSlow = useTTS({ accent, rate: 0.6 })

  const [sentenceIdx, setSentenceIdx] = useState(0)
  const sentence = SENTENCES[sentenceIdx]
  const targetWords = useMemo(() => sentence.split(/\s+/), [sentence])

  const [scored, setScored] = useState<ScoredWord[] | null>(null)
  const [overall, setOverall] = useState<number | null>(null)
  const [wpm, setWpm] = useState<number | null>(null)
  const [selected, setSelected] = useState(0)

  const finishAndScore = (): void => {
    attempt.stop()
    // Small delay so the final transcript settles, then score.
    window.setTimeout(() => {
      const result = scoreAttempt(sentence, attempt.transcript)
      setScored(result.words)
      setOverall(result.overall)
      const spokenWords = attempt.transcript.split(/\s+/).filter(Boolean).length
      const dur = attempt.durationSec || 1
      setWpm(spokenWords > 0 ? Math.round((spokenWords / dur) * 60) : 0)
      // focus the weakest word
      let weakest = 0
      result.words.forEach((w, i) => {
        if (w.score < result.words[weakest].score) weakest = i
      })
      setSelected(weakest)
    }, 350)
  }

  const toggleRecord = (): void => {
    if (attempt.recording) finishAndScore()
    else {
      setScored(null)
      setOverall(null)
      setWpm(null)
      attempt.start()
    }
  }

  const pickSentence = (i: number): void => {
    setSentenceIdx(i)
    setScored(null)
    setOverall(null)
    setWpm(null)
    setSelected(0)
  }

  const speak = (text: string, slow = false): void => {
    ttsNormal.cancel()
    ttsSlow.cancel()
    void (slow ? ttsSlow : ttsNormal).speak(text)
  }

  const displayWords = scored ?? targetWords.map((t) => ({ text: t, score: 0 }))
  const hasResult = scored !== null
  const selWord = displayWords[selected] ?? displayWords[0]

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pronunciation</h1>
          <p className="text-sm text-slate-400 mt-1">
            Read the sentence aloud — every word is scored against what a native listener would expect to hear.
          </p>
        </div>

        {/* Sentence picker */}
        <div className="flex flex-wrap gap-2">
          {SENTENCES.map((s, i) => (
            <button
              key={i}
              onClick={() => pickSentence(i)}
              className={cn(
                'rounded-pill px-3 py-1.5 text-xs font-semibold border transition',
                i === sentenceIdx
                  ? 'bg-brand-500/20 border-brand-400/50 text-brand-100'
                  : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-slate-200'
              )}
            >
              Sentence {i + 1}
            </button>
          ))}
        </div>

        {/* Score hero */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing value={overall ?? 0} size={132} stroke={11} tone={ringTone(overall ?? 0)}>
            <span className="text-3xl font-bold text-white">{overall ?? '—'}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">score</span>
          </ProgressRing>
          <div className="flex-1 w-full">
            <p className="text-2xl font-semibold leading-relaxed">
              {displayWords.map((w, i) => (
                <button
                  key={`${w.text}-${i}`}
                  onClick={() => setSelected(i)}
                  className={cn(
                    'transition mr-2',
                    hasResult && 'underline decoration-2 underline-offset-4',
                    hasResult ? wordColor(w.score) : 'text-slate-200',
                    hasResult && wordUnderline(w.score),
                    selected === i && hasResult && 'bg-white/10 rounded px-1'
                  )}
                >
                  {w.text}
                </button>
              ))}
            </p>
            {attempt.recording && attempt.interim && (
              <p className="text-sm text-slate-400 mt-2 italic">heard: “{attempt.interim}”</p>
            )}
            {attempt.error && <p className="text-sm text-rose-300 mt-2">{attempt.error}</p>}
            {!attempt.supported && (
              <p className="text-sm text-amber-300 mt-2">Speech recognition isn’t available in this environment.</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Great</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Close</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Needs work</span>
              <button
                onClick={() => speak(sentence)}
                className="ml-auto inline-flex items-center gap-1.5 rounded-pill bg-white/[0.06] hover:bg-white/10 px-3 py-1.5 font-semibold text-slate-200 transition"
              >
                <IconVolume className="w-4 h-4 text-brand-300" /> Hear it
              </button>
            </div>
          </div>
        </div>

        {/* Selected word breakdown */}
        {hasResult && (
          <div className="rounded-card border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Word focus</p>
                <p className="text-xl font-bold text-white mt-0.5">
                  {selWord.text} <span className={cn('text-sm', wordColor(selWord.score))}>{selWord.score}%</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => speak(selWord.text)} className="inline-flex items-center gap-1.5 rounded-pill bg-white/[0.06] hover:bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition">
                  <IconVolume className="w-4 h-4 text-brand-300" /> Native
                </button>
                <button onClick={() => speak(selWord.text, true)} className="inline-flex items-center gap-1.5 rounded-pill bg-white/[0.06] hover:bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition">
                  <IconRefresh className="w-4 h-4 text-brand-300" /> Slow
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              {selWord.score >= 85
                ? 'Clear and accurate — nicely done.'
                : selWord.score >= 65
                  ? 'Close. Listen to the native version and exaggerate the vowel.'
                  : 'This word didn’t come through clearly. Slow it down and try again.'}
            </p>
          </div>
        )}

        {/* Fluency stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={wpm != null ? String(wpm) : '—'} label="Words / min" tone="brand" />
          <StatCard value={overall != null ? `${overall}%` : '—'} label="Accuracy" tone="amber" />
          <StatCard
            value={overall == null ? '—' : overall >= 85 ? 'B2+' : overall >= 65 ? 'B1' : 'A2'}
            label="Fluency band"
            tone="emerald"
          />
        </div>

        {/* Record CTA */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <button
            onClick={toggleRecord}
            disabled={!attempt.supported}
            className={cn(
              'w-20 h-20 rounded-full text-white flex items-center justify-center shadow-glow transition active:scale-95 disabled:opacity-40',
              attempt.recording ? 'bg-rose-500 ring-4 ring-rose-400/40 animate-pulse' : 'bg-grad-brand hover:scale-105'
            )}
          >
            <IconMic className="w-8 h-8" />
          </button>
          <p className="text-xs text-slate-400">
            {attempt.recording ? 'Listening… tap to stop & score' : 'Tap to record · then get your score'}
          </p>
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
                  onClick={() => speak(p.word)}
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
                  <p className="text-[10px] text-slate-500 mt-2">Tap to hear the word</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Minimal pairs picker (drill detail) */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
          <SectionHeading title="Minimal pairs: /θ/ vs /s/" subtitle="Tap a word to hear it" />
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              ['think', 'sink'],
              ['thin', 'sin'],
              ['thank', 'sank'],
              ['mouth', 'mouse']
            ].map(([a, b]) => (
              <div key={a} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 flex items-center justify-between gap-2">
                <button onClick={() => speak(a)} className="flex-1 rounded-xl bg-white/[0.05] hover:bg-emerald-500/20 py-3 text-sm font-bold text-white transition">{a}</button>
                <button onClick={() => speak(b)} className="flex-1 rounded-xl bg-white/[0.05] hover:bg-emerald-500/20 py-3 text-sm font-bold text-white transition">{b}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
