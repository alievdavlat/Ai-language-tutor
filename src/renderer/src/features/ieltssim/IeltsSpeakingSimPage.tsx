/**
 * Conversational IELTS Speaking simulator modelled on ielts.gg's UX:
 * fullscreen dark navy backdrop, a single huge particle-orb in the centre,
 * total-exam timer top-left, voice-first interface, no chat bubbles by
 * default (optional transcript toggle for accessibility).
 *
 * Flow:
 *   1. Examiner greeting + ID question
 *   2. Part 1 — 4-5 personal questions (home, work, hobbies)
 *   3. Part 2 — cue card, 1-minute prep timer, 2-minute talk, 1 follow-up
 *   4. Part 3 — abstract discussion (4-5 turns) tied to the Part 2 topic
 *   5. Result — overall band + per-criterion (Fluency / Lexical / Grammar /
 *      Pronunciation) + transcript + retry button.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACCENT_TO_LANG } from '@shared/constants'
import { AIGate, ParticleOrb, SectionHeading, type OrbState } from '../../components/ui'
import { cn } from '../../lib/classnames'
import { useActiveAI } from '../../lib/ai'
import { backend } from '../../services/backend'
import { logActivity } from '../../services/activity'
import { useAppStore } from '../../store/useAppStore'
import { useTTS } from '../../hooks/tts'
import { useSTT } from '../../hooks/stt'
import { useChatStream } from '../../hooks/useChatStream'
import { micPrefsFromSettings } from '../../lib/audio'
import { scoreIeltsSpeaking, type IeltsScoreResult } from './scoring'
import { IconChat, IconMic, IconStar, IconX } from '../../components/icons'

type Phase = 'intro' | 'part1' | 'part2-prep' | 'part2-talk' | 'part2-followup' | 'part3' | 'done'

interface Turn { who: 'examiner' | 'me'; text: string }

// ─── Question bank ─────────────────────────────────────────────────────────

const INTRO = [
  "Good morning. My name is Lily. Can you tell me your full name, please?",
  "Thank you. And what should I call you in this interview?",
  "Can I see your ID, please? … Thank you. Now, let's begin the interview."
]

const PART1: { topic: string; q: string }[] = [
  { topic: 'Hometown', q: "Let's talk about your hometown. Where is your hometown, and what's it like?" },
  { topic: 'Work / study', q: "Do you work or are you a student? Tell me about what you do." },
  { topic: 'Free time', q: "What kinds of things do you like to do in your free time?" },
  { topic: 'Technology', q: "How often do you use a smartphone, and what for?" }
]

const PART2_CARDS = [
  {
    cue: 'Describe a memorable trip you have taken.',
    bullets: ['Where you went', 'Who you went with', 'What you did there', 'And explain why it was memorable']
  },
  {
    cue: 'Describe a skill you would like to learn in the future.',
    bullets: ['What the skill is', 'Why you want to learn it', 'How you plan to learn it', 'And explain how it would help you']
  },
  {
    cue: 'Describe a person who has had a big influence on your life.',
    bullets: ['Who the person is', 'How you know them', 'What kind of person they are', 'And explain why they have influenced you']
  }
]

const PART3: { topic: string; qs: string[] }[] = [
  {
    topic: 'travel',
    qs: [
      'Why do you think travel has become so popular in recent years?',
      'How has tourism changed the places that receive a lot of visitors?',
      'Do you think people learn more from travelling than from books? Why?',
      'How might the way people travel change in the next 50 years?'
    ]
  },
  {
    topic: 'learning',
    qs: [
      'What is the most effective way for adults to learn a new skill?',
      'Do you think traditional schools prepare people well for the modern workplace?',
      'How important is it to keep learning throughout life? Why?',
      'In what ways has technology changed how we learn?'
    ]
  },
  {
    topic: 'influence',
    qs: [
      'Who do you think has more influence on young people today — parents or friends?',
      'In what ways do role models in the media affect children?',
      'Should public figures be careful about what they say or do? Why?',
      'How can a single person change a community?'
    ]
  }
]

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtTime(s: number): string {
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function CountdownTimer({ seconds, onElapsed, color = 'amber' }: { seconds: number; onElapsed: () => void; color?: 'amber' | 'brand' }): JSX.Element {
  const [left, setLeft] = useState(seconds)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    ref.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { if (ref.current) clearInterval(ref.current); onElapsed(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => { if (ref.current) clearInterval(ref.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const danger = left <= 10
  return (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums',
      danger ? 'bg-rose-500/20 text-rose-200 animate-pulse'
        : color === 'brand' ? 'bg-brand-500/15 text-brand-200'
        : 'bg-amber-500/15 text-amber-200'
    )}>
      ⏱ {fmtTime(left)}
    </div>
  )
}

// ─── Inner sim ─────────────────────────────────────────────────────────────

function InnerSim({ onRetry }: { onRetry: () => void }): JSX.Element {
  const navigate = useNavigate()
  const ai = useActiveAI()
  const profile = useAppStore((s) => s.profile)
  const settings = profile?.settings
  const accent = settings?.accent ?? 'uk'

  const { speak, cancel: cancelTTS, speaking } = useTTS({
    accent,
    rate: settings?.ttsSpeed,
    voiceURI: settings?.voiceURI
  })
  const { send } = useChatStream(settings?.llmModel ?? '')

  const [phase, setPhase] = useState<Phase>('intro')
  const [transcript, setTranscript] = useState<Turn[]>([])
  const [showTranscript, setShowTranscript] = useState(false)
  const [introIdx, setIntroIdx] = useState(0)
  const [part1Idx, setPart1Idx] = useState(0)
  const [orb, setOrb] = useState<OrbState>('speaking')
  const [part3Idx, setPart3Idx] = useState(0)
  const part3 = useMemo(() => PART3[Math.floor(Math.random() * PART3.length)], [])
  const [card] = useState(() => PART2_CARDS[Math.floor(Math.random() * PART2_CARDS.length)])
  const [recording, setRecording] = useState(false)
  const [scoring, setScoring] = useState<IeltsScoreResult | null>(null)
  const [scoringState, setScoringState] = useState<'idle' | 'loading' | 'done'>('idle')
  // Part 2 is a 2-minute monologue — speech segments accumulate here and are
  // submitted as ONE answer when the timer ends (or the candidate finishes).
  const part2BufferRef = useRef('')

  const submitRef = useRef<(t: string) => void>(() => {})
  const stt = useSTT({
    engine: settings?.sttEngine ?? 'whisper-local',
    mode: settings?.micMode ?? 'push-to-talk',
    lang: ACCENT_TO_LANG[accent],
    whisperModel: settings?.whisperModel,
    micPrefs: settings ? micPrefsFromSettings(settings) : undefined,
    onSpeechStart: () => { if (speaking) cancelTTS() },
    onFinal: (t) => submitRef.current(t)
  })

  // Total exam elapsed timer — same pattern as ielts.gg's "02:19 / 10:00".
  const TOTAL_BUDGET_SEC = 11 * 60 // 11 min budget per IELTS Speaking
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (phase === 'done') return
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  // Examiner-says vs listening: after pushing an examiner turn we keep orb red
  // for a short window then flip back to blue/listening.
  const pushExaminer = (text: string): void => {
    setTranscript((t) => [...t, { who: 'examiner', text }])
    setOrb('speaking')
    void speak(text).then(() => setOrb('listening'))
  }
  const pushMe = (text: string): void => {
    setTranscript((t) => [...t, { who: 'me', text }])
    setOrb('thinking')
    setTimeout(() => setOrb('listening'), 600)
  }

  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    pushExaminer(INTRO[0])
    setIntroIdx(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Part 3 follow-ups are generated by the LLM from the candidate's actual
  // answer, the way a real examiner probes — the scripted bank is the fallback.
  const askPart3FollowUp = async (lastAnswer: string, idx: number): Promise<void> => {
    let q = ''
    try {
      q = (
        await send([
          {
            role: 'system',
            content:
              `You are an IELTS Speaking Part 3 examiner. The discussion topic is "${part3.topic}". ` +
              'Based on the candidate\'s last answer, ask ONE natural follow-up discussion question that probes deeper. ' +
              'Output only the question itself — no preamble, no markdown.'
          },
          { role: 'user', content: lastAnswer }
        ])
      ).trim()
    } catch {
      q = ''
    }
    pushExaminer(q || part3.qs[idx])
  }

  // ── Phase transitions ────────────────────────────────────────────────────
  // Advances the structured IELTS flow using the candidate's *actual* answer.
  // Intro/Part 1 frames stay scripted (standard IELTS); Part 3 probes via LLM.
  const submitAnswer = (text: string): void => {
    const answer = text.trim()
    if (!answer) return

    // During the Part 2 monologue, speech segments accumulate silently — the
    // whole talk is submitted at once when the timer ends or the user finishes.
    if (phase === 'part2-talk') {
      part2BufferRef.current = `${part2BufferRef.current} ${answer}`.trim()
      return
    }

    if (recording) setRecording(false)
    void stt.stop()

    if (phase === 'intro') {
      pushMe(answer)
      if (introIdx < INTRO.length) {
        setTimeout(() => pushExaminer(INTRO[introIdx]), 900)
        setIntroIdx((i) => i + 1)
      } else {
        setPhase('part1')
        setTimeout(() => pushExaminer(PART1[0].q), 900)
      }
    } else if (phase === 'part1') {
      pushMe(answer)
      const next = part1Idx + 1
      if (next < PART1.length) {
        setTimeout(() => { pushExaminer(PART1[next].q); setPart1Idx(next) }, 900)
      } else {
        setPhase('part2-prep')
        setTimeout(() => pushExaminer("Now I'm going to give you a topic. You have one minute to prepare. You can make notes if you wish. Here's your topic:"), 600)
      }
    } else if (phase === 'part2-followup') {
      pushMe(answer)
      setPhase('part3')
      setTimeout(() => pushExaminer(part3.qs[0]), 900)
    } else if (phase === 'part3') {
      pushMe(answer)
      const next = part3Idx + 1
      if (next < part3.qs.length) {
        setPart3Idx(next)
        setTimeout(() => void askPart3FollowUp(answer, next), 900)
      } else {
        setTimeout(() => { pushExaminer('That brings us to the end of the speaking test. Thank you very much.'); setPhase('done') }, 1000)
      }
    }
  }

  const endPart2Prep = (): void => {
    part2BufferRef.current = ''
    setPhase('part2-talk')
    pushExaminer("Time's up. Please start speaking. You have up to two minutes.")
  }

  // End of the 2-minute slot (timer or "I'm finished") — submit the REAL talk.
  const endPart2Talk = (): void => {
    if (phase !== 'part2-talk') return
    setRecording(false)
    void stt.stop()
    const talk = part2BufferRef.current.trim()
    part2BufferRef.current = ''
    if (talk) pushMe(talk)
    setTimeout(() => { pushExaminer('Thank you. Did you find that easy to talk about?'); setPhase('part2-followup') }, 800)
  }

  submitRef.current = submitAnswer

  // Real band scoring — when the interview ends, send the transcript to the LLM.
  useEffect(() => {
    if (phase !== 'done' || scoringState !== 'idle') return
    setScoringState('loading')
    void scoreIeltsSpeaking(transcript, (messages) => send(messages))
      .then((result) => {
        setScoring(result)
        setScoringState('done')
        // #B14 — the interview no longer evaporates: log it as speaking practice
        // with the real minutes so XP / streak / daily-minutes goals move (the
        // sim previously rewarded nothing). Persisted as practice, not a full
        // mock attempt, so it doesn't pollute full-mock best scores.
        const meId = backend.currentUserId()
        if (meId) {
          void logActivity({
            userId: meId,
            kind: 'speaking_session',
            language: 'en',
            xp: 25,
            minutes: Math.max(1, Math.round(elapsed / 60)),
            meta: { progressKind: 'speaking_exchange', skill: 'speaking', topic: 'IELTS Speaking mock', band: result.overall }
          }).catch(() => {})
        }
      })
      .catch(() => setScoringState('done'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Teardown — stop the mic + any speech when leaving.
  useEffect(() => {
    return () => { void stt.stop(); cancelTTS() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Current examiner caption — bottom-right of the orb screen
  const currentExaminerText = [...transcript].reverse().find((t) => t.who === 'examiner')?.text

  // ── Render ───────────────────────────────────────────────────────────────

  if (phase === 'done') {
    if (!scoring || scoringState === 'loading') {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-5 bg-slate-950">
          <ParticleOrb state="thinking" size={220} audioLevel={0.5} />
          <p className="text-sm font-bold text-slate-200 uppercase tracking-widest">Grading your interview…</p>
          <p className="text-xs text-slate-500">The examiner is scoring your four IELTS criteria.</p>
        </div>
      )
    }
    return <ResultScreen scoring={scoring} transcript={transcript} onRetry={onRetry} />
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-[radial-gradient(900px_700px_at_50%_30%,rgba(40,55,120,0.35),transparent_60%),radial-gradient(900px_700px_at_50%_120%,rgba(244,114,182,0.18),transparent_60%),#0a0e1f]">
      {/* Total exam timer (top-left). We use our own SpeakAI brand + Speaking exam
       *  label here — never the third-party ielts.gg name — to keep clean of
       *  any trademark friction.
       */}
      <header className="absolute top-5 left-6 z-10">
        <p className="text-sm font-bold text-white tracking-wide">SpeakAI <span className="font-light text-white/60">· Speaking exam</span></p>
        <p className="text-xs text-white/60 mt-0.5 font-mono tabular-nums">{fmtTime(elapsed)} / {fmtTime(TOTAL_BUDGET_SEC)}</p>
      </header>

      {/* Top-right minimal controls */}
      <div className="absolute top-5 right-6 z-10 flex items-center gap-2">
        <button
          onClick={() => setShowTranscript((v) => !v)}
          title="Toggle transcript"
          className={cn(
            'w-9 h-9 rounded-full backdrop-blur flex items-center justify-center transition border',
            showTranscript ? 'bg-white/20 border-white/30 text-white' : 'bg-white/[0.06] border-white/10 text-white/70 hover:bg-white/[0.12]'
          )}
        >
          <IconChat className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate('/exams/ielts')}
          title="End"
          className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur text-white/70 hover:text-white flex items-center justify-center border border-white/10"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>

      {/* The orb — centerpiece */}
      <div className="absolute inset-0 flex items-center justify-center">
        <ParticleOrb state={orb} size={420} audioLevel={recording ? 0.8 : 0.3} />
      </div>

      {/* Part 2 prep card — overlays the orb when in prep phase */}
      {phase === 'part2-prep' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[min(90vw,28rem)] rounded-card border border-amber-400/30 bg-black/60 backdrop-blur-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">Part 2 · cue card</p>
            <CountdownTimer seconds={60} onElapsed={endPart2Prep} color="amber" />
          </div>
          <p className="text-lg font-bold text-white">{card.cue}</p>
          <ul className="text-sm text-slate-200 flex flex-col gap-1">
            {card.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2"><span className="text-amber-300">·</span>{b}</li>
            ))}
          </ul>
          <button onClick={endPart2Prep} className="btn-primary text-xs px-4 py-2 self-end">I'm ready — start talking</button>
        </div>
      )}

      {/* Part 2 talk timer — overlay during the 2-min slot */}
      {phase === 'part2-talk' && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <p className="text-[10px] uppercase tracking-widest text-brand-300 font-bold">Part 2 · your 2 minutes</p>
          <CountdownTimer seconds={120} onElapsed={endPart2Talk} color="brand" />
          <p className="text-sm font-bold text-white max-w-md text-center">{card.cue}</p>
          <button
            onClick={endPart2Talk}
            className="mt-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] backdrop-blur text-white/80 text-xs font-semibold px-4 py-2 border border-white/10"
          >
            I'm finished
          </button>
        </div>
      )}

      {/* Examiner caption (very subtle — matches ielts.gg's bottom-right text) */}
      {!showTranscript && currentExaminerText && phase !== 'part2-prep' && (
        <p className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 max-w-2xl px-6 text-center text-base text-white/85 leading-relaxed">
          {currentExaminerText}
        </p>
      )}

      {/* Transcript drawer (accessibility opt-in) */}
      {showTranscript && (
        <aside className="absolute top-20 right-6 bottom-28 w-80 z-10 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-4 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Transcript · {transcript.length} turns</p>
          <div className="flex flex-col gap-3">
            {transcript.map((t, i) => (
              <div key={i}>
                <p className={cn('text-[9px] uppercase tracking-widest font-bold', t.who === 'examiner' ? 'text-brand-300' : 'text-emerald-300')}>
                  {t.who === 'examiner' ? 'Examiner' : 'You'}
                </p>
                <p className="text-sm text-slate-200 leading-snug">{t.text}</p>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Footer mic — voice-first */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <button
          onClick={() => {
            if (recording) { setRecording(false); void stt.stop() }
            else { if (speaking) cancelTTS(); setRecording(true); void stt.start() }
          }}
          title={recording ? 'Stop' : 'Talk'}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition',
            recording ? 'bg-rose-500 ring-4 ring-rose-400/40 animate-pulse' : 'bg-grad-brand ring-4 ring-brand-400/30 hover:brightness-110'
          )}
        >
          <IconMic className="w-7 h-7" />
        </button>
      </footer>

      {/* Phase + provider badge — small, bottom-left */}
      <div className="absolute bottom-6 left-6 z-10 text-[10px] uppercase tracking-widest text-white/40 font-bold">
        {phase.replace('-', ' · ')} · {ai?.provider.name ?? 'AI'}
      </div>
    </div>
  )
}

// ─── Result screen (same data shape, lifted into its own component) ─────

function ResultScreen({ scoring, transcript, onRetry }: { scoring: IeltsScoreResult; transcript: Turn[]; onRetry: () => void }): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950">
      <div className="w-full px-6 py-10 flex flex-col gap-6">
        <div className="rounded-card border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-brand-500/15 p-8 text-center">
          <p className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold">Mock complete</p>
          <p className="text-6xl font-black text-white mt-2">Band {scoring.overall.toFixed(1)}</p>
          <p className="text-sm text-slate-300 mt-1">Estimated overall band score</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Fluency & coherence', v: scoring.fluency },
            { label: 'Lexical resource', v: scoring.lexical },
            { label: 'Grammar', v: scoring.grammar },
            { label: 'Pronunciation', v: scoring.pronunciation }
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{c.label}</p>
              <p className="text-2xl font-black text-brand-200 mt-1">{c.v.toFixed(1)}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <SectionHeading title="Examiner feedback" subtitle="From your responses" />
          <ul className="text-sm text-slate-200 flex flex-col gap-2">
            {scoring.feedback.map((f, i) => {
              const positive = f.trimStart().startsWith('✓')
              const body = f.replace(/^[✓!]\s*/, '')
              return (
                <li key={i} className="flex items-start gap-2">
                  <span className={positive ? 'text-emerald-300' : 'text-amber-300'}>{positive ? '✓' : '!'}</span>
                  {body}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <SectionHeading title="Full transcript" subtitle={`${transcript.length} turns`} />
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {transcript.map((t, i) => (
              <div key={i} className="text-sm">
                <span className={cn('text-[10px] uppercase tracking-widest font-bold mr-1.5', t.who === 'examiner' ? 'text-brand-300' : 'text-emerald-300')}>
                  {t.who === 'examiner' ? 'Examiner' : 'You'}:
                </span>
                <span className="text-slate-200">{t.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/exams/ielts')} className="btn-ghost text-sm px-4 py-2">Back to exams</button>
          <button onClick={onRetry} className="btn-primary flex-1 text-sm py-2 inline-flex items-center justify-center gap-1.5">
            <IconStar className="w-4 h-4" /> Try another card
          </button>
        </div>
      </div>
    </div>
  )
}

export default function IeltsSpeakingSimPage(): JSX.Element {
  // #B14 — "Try another card" resets the simulator by remounting (fresh card,
  // transcript, timer, scoring) instead of a full page reload.
  const [runId, setRunId] = useState(0)
  return (
    <AIGate
      featureName="IELTS Speaking simulator"
      description="The AI examiner needs a cloud model to conduct the live interview and grade your bands."
      fullscreen
    >
      <InnerSim key={runId} onRetry={() => setRunId((n) => n + 1)} />
    </AIGate>
  )
}
