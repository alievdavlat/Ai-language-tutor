import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRealtimeRoom } from '../../hooks/realtime/useRealtimeRoom'
import type { PresencePeer } from '../../services/realtime'
import { QUESTION_SECONDS, getPack, scoreAnswer, type QuizQuestion } from './questions'

export type QuizPhase = 'join' | 'lobby' | 'question' | 'reveal' | 'final'

export interface LeaderRow {
  peerId: string
  name: string
  score: number
  isHost: boolean
  me: boolean
}

interface SyncState {
  phase: Exclude<QuizPhase, 'join'>
  qIndex: number
  startedAt: number
  packId: string
}

export interface UseLiveQuiz {
  phase: QuizPhase
  isHost: boolean
  pin: string
  qIndex: number
  question: QuizQuestion | null
  totalQuestions: number
  /** Seconds remaining on the current question (0 in other phases). */
  remaining: number
  /** This player's chosen option for the current question, or null. */
  myChoice: number | null
  /** Correct index, only meaningful in 'reveal'/'final'. */
  correctIndex: number | null
  myScore: number
  lastGain: number
  leaderboard: LeaderRow[]
  playerCount: number
  // actions
  host: (packId: string) => void
  join: (pin: string) => void
  start: () => void
  answer: (choice: number) => void
  next: () => void
  leave: () => void
}

function makePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function useLiveQuiz(displayName: string): UseLiveQuiz {
  const [pin, setPin] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [packId, setPackId] = useState('past-tenses')
  const [enabled, setEnabled] = useState(false)

  const [sync, setSync] = useState<SyncState | null>(null)
  const [phase, setPhase] = useState<QuizPhase>('join')
  const [myChoice, setMyChoice] = useState<number | null>(null)
  const [answeredAt, setAnsweredAt] = useState<number | null>(null)
  const [myScore, setMyScore] = useState(0)
  const [lastGain, setLastGain] = useState(0)
  const [remaining, setRemaining] = useState(QUESTION_SECONDS)

  const roomId = enabled && pin ? `quiz:${pin}` : null
  const presence = useMemo(
    () => ({ name: displayName, role: isHost ? 'host' : 'player', score: 0 }),
    [displayName, isHost]
  )
  const { channel, peers, peerId, send, updatePresence } = useRealtimeRoom(roomId, presence, {
    enabled
  })

  const scoredRef = useRef<Set<number>>(new Set())
  const hostTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pack = getPack(sync?.packId ?? packId)
  const qIndex = sync?.qIndex ?? 0
  const question = phase === 'question' || phase === 'reveal' ? pack.questions[qIndex] ?? null : null
  const correctIndex =
    (phase === 'reveal' || phase === 'final') && pack.questions[qIndex]
      ? pack.questions[qIndex].correct
      : null

  // ── Host: broadcast a state transition ────────────────────────────────────
  const broadcast = useCallback(
    (next: SyncState) => {
      setSync(next)
      setPhase(next.phase)
      send('state', next)
    },
    [send]
  )

  // ── Wire incoming events once the channel is live ─────────────────────────
  useEffect(() => {
    if (!channel) return
    const offState = channel.on('state', (payload) => {
      const s = payload as SyncState
      setSync(s)
      setPhase(s.phase)
      if (s.phase === 'question') {
        setMyChoice(null)
        setAnsweredAt(null)
      }
    })
    // Late joiners ask the host for the current state.
    const offHello = channel.on('hello', () => {
      if (isHost && sync) send('state', sync)
    })
    // Players announce themselves so the host can sync them.
    send('hello', {})
    return () => {
      offState()
      offHello()
    }
  }, [channel, isHost, sync, send])

  // ── Self-scoring on reveal (no central authority needed) ──────────────────
  useEffect(() => {
    if (phase !== 'reveal' || !sync) return
    if (scoredRef.current.has(sync.qIndex)) return
    scoredRef.current.add(sync.qIndex)
    const q = pack.questions[sync.qIndex]
    if (!q) return
    const correct = myChoice === q.correct
    const ms = answeredAt != null ? answeredAt - sync.startedAt : QUESTION_SECONDS * 1000
    const gain = correct && myChoice != null ? scoreAnswer(true, ms) : 0
    setLastGain(gain)
    if (gain > 0) {
      setMyScore((prev) => {
        const total = prev + gain
        updatePresence({ score: total })
        return total
      })
    }
  }, [phase, sync, myChoice, answeredAt, pack, updatePresence])

  // ── Countdown for the current question ────────────────────────────────────
  useEffect(() => {
    if (phase !== 'question' || !sync) {
      setRemaining(phase === 'question' ? QUESTION_SECONDS : 0)
      return
    }
    const tick = (): void => {
      const elapsed = (Date.now() - sync.startedAt) / 1000
      setRemaining(Math.max(0, Math.ceil(QUESTION_SECONDS - elapsed)))
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [phase, sync])

  // ── Host auto-advances to reveal when the timer ends ──────────────────────
  useEffect(() => {
    if (!isHost || phase !== 'question' || !sync) return
    const elapsed = Date.now() - sync.startedAt
    const left = Math.max(0, QUESTION_SECONDS * 1000 - elapsed)
    hostTimer.current = setTimeout(() => {
      broadcast({ ...sync, phase: 'reveal' })
    }, left)
    return () => {
      if (hostTimer.current) clearTimeout(hostTimer.current)
    }
  }, [isHost, phase, sync, broadcast])

  // ── Actions ───────────────────────────────────────────────────────────────
  const host = useCallback((pid: string) => {
    setPackId(pid)
    setIsHost(true)
    setPin(makePin())
    setEnabled(true)
    setPhase('lobby')
    scoredRef.current.clear()
  }, [])

  const join = useCallback((p: string) => {
    setIsHost(false)
    setPin(p.replace(/\s/g, ''))
    setEnabled(true)
    setPhase('lobby')
    scoredRef.current.clear()
  }, [])

  const start = useCallback(() => {
    if (!isHost) return
    broadcast({ phase: 'question', qIndex: 0, startedAt: Date.now(), packId })
  }, [isHost, packId, broadcast])

  const answer = useCallback(
    (choice: number) => {
      if (phase !== 'question' || myChoice != null) return
      setMyChoice(choice)
      setAnsweredAt(Date.now())
      send('answer', { qIndex, choice })
    },
    [phase, myChoice, qIndex, send]
  )

  const next = useCallback(() => {
    if (!isHost || !sync) return
    const nextIndex = sync.qIndex + 1
    if (nextIndex >= pack.questions.length) {
      broadcast({ ...sync, phase: 'final' })
    } else {
      broadcast({ phase: 'question', qIndex: nextIndex, startedAt: Date.now(), packId: sync.packId })
    }
  }, [isHost, sync, pack, broadcast])

  const leave = useCallback(() => {
    setEnabled(false)
    setPhase('join')
    setSync(null)
    setMyScore(0)
    setMyChoice(null)
    scoredRef.current.clear()
  }, [])

  // ── Leaderboard from presence ─────────────────────────────────────────────
  const leaderboard: LeaderRow[] = useMemo(() => {
    const rows = peers.map((p: PresencePeer) => ({
      peerId: p.peerId,
      name: (p.name as string) ?? 'Guest',
      score: typeof p.score === 'number' ? p.score : 0,
      isHost: p.role === 'host',
      me: p.peerId === peerId
    }))
    return rows.sort((a, b) => b.score - a.score)
  }, [peers, peerId])

  const players = leaderboard.filter((r) => !r.isHost)

  return {
    phase,
    isHost,
    pin,
    qIndex,
    question,
    totalQuestions: pack.questions.length,
    remaining,
    myChoice,
    correctIndex,
    myScore,
    lastGain,
    leaderboard,
    playerCount: players.length,
    host,
    join,
    start,
    answer,
    next,
    leave
  }
}
