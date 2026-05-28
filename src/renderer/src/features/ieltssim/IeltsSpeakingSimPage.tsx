/**
 * Conversational IELTS Speaking simulator modelled on ielts.gg's flow:
 *   1. Examiner greeting + ID question
 *   2. Part 1 — 4-5 personal questions (home, work, hobbies)
 *   3. Part 2 — cue card, 1-minute prep timer, 2-minute talk, 1 follow-up
 *   4. Part 3 — abstract discussion (4-5 turns) tied to the Part 2 topic
 *   5. Result — overall band + per-criterion (Fluency / Lexical / Grammar /
 *      Pronunciation) + transcript + retry button.
 *
 * The actual LLM call goes to `useActiveAI()`. While AI integration is being
 * wired this page simulates the back-and-forth from a scripted question bank
 * so the UX is fully reviewable end-to-end.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AIGate, AvatarCircle, ProgressBar, SectionHeading } from '../../components/ui'
import { cn } from '../../lib/classnames'
import { useActiveAI } from '../../lib/ai'
import { IconBolt, IconChat, IconMic, IconPlay, IconStar, IconVolume, IconX } from '../../components/icons'

type Phase = 'intro' | 'part1' | 'part2-prep' | 'part2-talk' | 'part2-followup' | 'part3' | 'done'

interface Turn {
  who: 'examiner' | 'me'
  text: string
  /** Optional inline correction surfaced under the user turn after the exam. */
  correction?: { issue: string; fix: string }
}

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

// ─── Component ─────────────────────────────────────────────────────────────

function Timer({ seconds, onElapsed }: { seconds: number; onElapsed: () => void }): JSX.Element {
  const [left, setLeft] = useState(seconds)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    ref.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          if (ref.current) clearInterval(ref.current)
          onElapsed()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => { if (ref.current) clearInterval(ref.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const danger = left <= 10
  return (
    <div className={cn(
      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums',
      danger ? 'bg-rose-500/20 text-rose-200 animate-pulse' : 'bg-white/[0.06] text-slate-200'
    )}>
      ⏱ {mm}:{ss}
    </div>
  )
}

function ExaminerTurn({ text, onContinue }: { text: string; onContinue?: () => void }): JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-violet-500 shrink-0 flex items-center justify-center text-lg">🦋</div>
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-widest text-brand-300 font-bold">Examiner</p>
        <p className="text-base text-white leading-relaxed mt-1">{text}</p>
        {onContinue && (
          <button onClick={onContinue} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold px-3 py-1.5">
            <IconVolume className="w-3.5 h-3.5" /> Hear again
          </button>
        )}
      </div>
    </div>
  )
}

function MyTurn({ text }: { text: string }): JSX.Element {
  return (
    <div className="flex items-start gap-3 ml-auto max-w-[80%] flex-row-reverse">
      <AvatarCircle name="You" size="sm" />
      <div className="rounded-2xl bg-brand-500/15 ring-1 ring-brand-400/20 text-slate-100 px-4 py-2.5 text-sm leading-relaxed">
        {text}
      </div>
    </div>
  )
}

function MockMicBar({ recording, onTap }: { recording: boolean; onTap: () => void }): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onTap}
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition',
          recording ? 'bg-rose-500 ring-4 ring-rose-400/40 animate-pulse' : 'bg-grad-brand ring-4 ring-brand-400/30 hover:brightness-110'
        )}
      >
        <IconMic className="w-7 h-7" />
      </button>
      {recording && (
        <div className="flex items-end gap-0.5 h-8">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="w-0.5 rounded-full bg-rose-400" style={{ height: `${20 + Math.abs(Math.sin(i * 0.4 + Date.now() / 200)) * 80}%`, opacity: 0.4 + Math.random() * 0.5 }} />
          ))}
        </div>
      )}
    </div>
  )
}

function InnerSim(): JSX.Element {
  const navigate = useNavigate()
  const ai = useActiveAI()
  const [phase, setPhase] = useState<Phase>('intro')
  const [transcript, setTranscript] = useState<Turn[]>([])
  const [introIdx, setIntroIdx] = useState(0)
  const [part1Idx, setPart1Idx] = useState(0)
  const [recording, setRecording] = useState(false)
  const [card] = useState(() => PART2_CARDS[Math.floor(Math.random() * PART2_CARDS.length)])
  const [part3Idx, setPart3Idx] = useState(0)

  const part3 = useMemo(() => PART3[Math.floor(Math.random() * PART3.length)], [])

  const pushExaminer = (text: string): void => setTranscript((t) => [...t, { who: 'examiner', text }])
  const pushMe = (text: string): void => setTranscript((t) => [...t, { who: 'me', text }])

  // ── Phase transitions ────────────────────────────────────────────────────

  const startInterview = (): void => {
    pushExaminer(INTRO[0])
    setIntroIdx(1)
  }

  const acceptCannedAnswer = (): void => {
    // For preview without real STT, we synthesize a plausible answer.
    if (phase === 'intro') {
      const ans = ['My name is Aziz Karimov.', "You can call me Aziz.", 'Here you are.'][introIdx - 1] ?? 'Thanks.'
      pushMe(ans)
      if (introIdx < INTRO.length) {
        pushExaminer(INTRO[introIdx])
        setIntroIdx((i) => i + 1)
      } else {
        setPhase('part1')
        setTimeout(() => pushExaminer(PART1[0].q), 200)
      }
    } else if (phase === 'part1') {
      pushMe("I'm from Tashkent. It's the capital of Uzbekistan — quite green for a Central Asian city, with very hot summers.")
      const next = part1Idx + 1
      if (next < PART1.length) {
        pushExaminer(PART1[next].q)
        setPart1Idx(next)
      } else {
        setPhase('part2-prep')
        pushExaminer("Now I'm going to give you a topic. You have one minute to prepare. You can make notes if you wish. Here's your topic:")
      }
    } else if (phase === 'part2-talk') {
      pushMe('I would like to talk about a trip I took to Samarkand last summer. I went with two of my closest friends from university...')
      pushExaminer('Thank you. Did you enjoy the trip?')
      setPhase('part2-followup')
    } else if (phase === 'part2-followup') {
      pushMe('Yes, very much — it gave me a real appreciation for the Silk-Road history.')
      setPhase('part3')
      setTimeout(() => pushExaminer(part3.qs[0]), 200)
    } else if (phase === 'part3') {
      pushMe('I think travel has become popular partly because flights are cheaper and partly because social media inspires people to see new places.')
      const next = part3Idx + 1
      if (next < part3.qs.length) {
        pushExaminer(part3.qs[next])
        setPart3Idx(next)
      } else {
        pushExaminer('That brings us to the end of the speaking test. Thank you very much.')
        setPhase('done')
      }
    }
  }

  const endPart2Prep = (): void => {
    setPhase('part2-talk')
    pushExaminer("Time's up. Please start speaking. You have up to two minutes.")
  }
  const endPart2Talk = (): void => {
    // Force-advance after 2 min even if user hasn't tapped
    if (phase === 'part2-talk') acceptCannedAnswer()
  }

  // Auto-kick the intro on mount. The ref guards against React 18 StrictMode's
  // double-invocation in dev, which would otherwise push the first question twice.
  const startedRef = useRef(false)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    startInterview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Header / progress ────────────────────────────────────────────────────

  const progressByPhase: Record<Phase, number> = {
    intro: 5,
    part1: 25,
    'part2-prep': 45,
    'part2-talk': 60,
    'part2-followup': 65,
    part3: 85,
    done: 100
  }

  // Mock scoring at the end
  const scoring = {
    overall: 7.0,
    fluency: 7.5,
    lexical: 6.5,
    grammar: 7.0,
    pronunciation: 7.0
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-5 flex flex-col gap-4">
        {/* Top status bar */}
        <header className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/90 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Exam in progress
            </span>
            <span className="text-xs text-slate-400">IELTS Speaking mock · {ai?.provider.name ?? 'AI'} ({ai?.modelId.split('/').pop() ?? 'live'})</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">
              {phase.replace('-', ' · ').toUpperCase()}
            </span>
            <button onClick={() => navigate('/exams/ielts')} title="End" className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 flex items-center justify-center">
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </header>
        <ProgressBar value={progressByPhase[phase]} color="brand" />

        {/* Conversation transcript */}
        {phase !== 'done' && (
          <div className="flex flex-col gap-4">
            {transcript.map((t, i) => t.who === 'examiner' ? <ExaminerTurn key={i} text={t.text} /> : <MyTurn key={i} text={t.text} />)}
          </div>
        )}

        {/* Phase-specific UI */}
        {phase === 'part2-prep' && (
          <div className="rounded-card border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-rose-500/10 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">Part 2 · cue card</p>
              <Timer seconds={60} onElapsed={endPart2Prep} />
            </div>
            <p className="text-lg font-bold text-white">{card.cue}</p>
            <ul className="text-sm text-slate-200 flex flex-col gap-1">
              {card.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="text-amber-300">·</span>{b}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-200/80">1 minute to prepare · jot down notes if you wish.</p>
            <button onClick={endPart2Prep} className="btn-primary self-start text-xs px-4 py-2">I'm ready · start talking</button>
          </div>
        )}

        {phase === 'part2-talk' && (
          <div className="rounded-card border border-brand-400/30 bg-brand-500/[0.08] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-brand-300 font-bold">Part 2 · your 2 minutes</p>
              <Timer seconds={120} onElapsed={endPart2Talk} />
            </div>
            <p className="text-sm text-slate-200">Speak for up to 2 minutes on:</p>
            <p className="text-base font-bold text-white">{card.cue}</p>
            <MockMicBar recording={recording} onTap={() => setRecording((v) => !v)} />
          </div>
        )}

        {phase === 'done' && (
          <div className="rounded-card border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-brand-500/15 p-6 flex flex-col gap-5">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold">Mock complete</p>
              <p className="text-5xl font-black text-white mt-2">Band {scoring.overall.toFixed(1)}</p>
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

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <SectionHeading title="Examiner feedback" subtitle="From your responses" />
              <ul className="text-sm text-slate-200 flex flex-col gap-2">
                <li className="flex items-start gap-2"><span className="text-emerald-300">✓</span> Strong topic development on the Samarkand trip — you used personal detail well.</li>
                <li className="flex items-start gap-2"><span className="text-amber-300">!</span> Watch for over-using "very" — substitute "extremely / particularly" for higher lexical band.</li>
                <li className="flex items-start gap-2"><span className="text-amber-300">!</span> A few articles missing in Part 3 — "in social media" → "on social media".</li>
                <li className="flex items-start gap-2"><span className="text-emerald-300">✓</span> Clear, confident delivery · /θ/ and /ð/ recognisably distinct.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <SectionHeading title="Full transcript" subtitle={`${transcript.length} turns`} />
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {transcript.map((t, i) => (
                  <div key={i} className="text-sm">
                    <span className={cn('text-[10px] uppercase tracking-widest font-bold', t.who === 'examiner' ? 'text-brand-300' : 'text-emerald-300')}>{t.who === 'examiner' ? 'Examiner' : 'You'}: </span>
                    <span className="text-slate-200">{t.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/exams/ielts')} className="btn-ghost text-sm px-4 py-2">Back to exams</button>
              <button onClick={() => window.location.reload()} className="btn-primary flex-1 text-sm py-2 inline-flex items-center justify-center gap-1.5">
                <IconStar className="w-4 h-4" /> Try another card
              </button>
            </div>
          </div>
        )}

        {/* Footer action — common across phases except prep / talk / done */}
        {(phase === 'intro' || phase === 'part1' || phase === 'part3' || phase === 'part2-followup') && (
          <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur pt-3 pb-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-400 flex-1">Tap the mic, speak, then submit · or tap "Answer" to simulate.</p>
              <MockMicBar recording={recording} onTap={() => setRecording((v) => !v)} />
              <button onClick={acceptCannedAnswer} className="btn-primary text-sm px-5 py-2.5 inline-flex items-center gap-1.5">
                <IconBolt className="w-4 h-4" /> Answer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function IeltsSpeakingSimPage(): JSX.Element {
  return (
    <AIGate
      featureName="IELTS Speaking simulator"
      description="The AI examiner needs a cloud model to conduct the live interview and grade your bands."
      fullscreen
    >
      <InnerSim />
    </AIGate>
  )
}
