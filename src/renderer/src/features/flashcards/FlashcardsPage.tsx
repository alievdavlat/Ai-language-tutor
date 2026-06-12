import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { VocabItem } from '@shared/types'
import { cn } from '../../lib/classnames'
import { logActivity } from '../../services/activity'
import { backend } from '../../services/backend/useBackend'
import { useTargetLanguage } from '../../lib/language'
import { useVocab } from '../../services/study/useStudy'
import { ProgressBar, SectionHeading } from '../../components/ui'
import { IconBolt, IconBook, IconChevronLeft, IconStar, IconTarget } from '../../components/icons'

type Mode = 'menu' | 'learn' | 'test' | 'match' | 'done'

/** Pairs shown in one Match round — keeps the grid playable on a small deck. */
const MATCH_SIZE = 6

const MENU = [
  { id: 'learn', title: 'Learn', desc: 'Tap to flip, mark known/unknown.', icon: IconBook, tint: 'from-brand-500 to-violet-500' },
  { id: 'test', title: 'Test', desc: 'Multiple-choice quiz on the deck.', icon: IconTarget, tint: 'from-emerald-500 to-teal-500' },
  { id: 'match', title: 'Match', desc: 'Tap pairs as fast as you can.', icon: IconBolt, tint: 'from-amber-500 to-rose-500' }
] as const

/** Fisher–Yates shuffle returning a fresh array (never mutates the input). */
function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface MatchTile {
  key: string
  cardId: string
  text: string
}

export default function FlashcardsPage(): JSX.Element {
  const navigate = useNavigate()
  const lang = useTargetLanguage()
  const { cards, loading } = useVocab(lang.code)

  const [mode, setMode] = useState<Mode>('menu')
  const [activeDeck, setActiveDeck] = useState<string | null>(null)

  // Learn / Test cursor + selection.
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  // Match game state.
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [pickedKey, setPickedKey] = useState<string | null>(null)
  const [wrongKeys, setWrongKeys] = useState<string[]>([])
  const [mismatches, setMismatches] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  // Round outcome, used for the completion screen + XP meta.
  const [results, setResults] = useState({ correct: 0, total: 0 })

  // The cards this round draws from — everything, or one saved deck.
  const roundCards = useMemo(
    () => (activeDeck ? cards.filter((c) => (c.deck ?? 'My words') === activeDeck) : cards),
    [cards, activeDeck]
  )

  // Real saved decks (grouped by `deck` label) with live counts.
  const decks = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of cards) {
      const d = c.deck ?? 'My words'
      counts.set(d, (counts.get(d) ?? 0) + 1)
    }
    return [...counts.entries()].map(([name, count]) => ({ name, count }))
  }, [cards])

  const reset = (): void => {
    setIdx(0)
    setFlipped(false)
    setSelected(null)
    setMatched(new Set())
    setPickedKey(null)
    setWrongKeys([])
    setMismatches(0)
    setElapsed(0)
    setResults({ correct: 0, total: 0 })
  }

  const start = (m: Mode): void => { reset(); setMode(m) }

  // ── Test options: the answer plus up to 3 distractors with DISTINCT
  //    translations, so no wrong option duplicates the correct meaning. ──
  const answer = roundCards[idx] as VocabItem | undefined
  const options = useMemo<VocabItem[]>(() => {
    if (!answer) return []
    const seen = new Set([answer.translation])
    const distractors: VocabItem[] = []
    for (const c of shuffle(roundCards)) {
      if (distractors.length >= 3) break
      if (c.id === answer.id || seen.has(c.translation)) continue
      seen.add(c.translation)
      distractors.push(c)
    }
    return shuffle([answer, ...distractors])
  }, [answer, roundCards])

  // ── Match: a stable set of pairs for the round, tiles shuffled once.
  //    Pick cards with a DISTINCT term AND distinct meaning so no two tiles
  //    ever show the same text (which would make a pair ambiguous). ──
  const matchPairs = useMemo(() => {
    const seenTerm = new Set<string>()
    const seenTr = new Set<string>()
    const picked: VocabItem[] = []
    for (const c of shuffle(roundCards)) {
      const t = c.term.trim().toLowerCase()
      const tr = c.translation.trim().toLowerCase()
      if (seenTerm.has(t) || seenTr.has(tr)) continue
      seenTerm.add(t)
      seenTr.add(tr)
      picked.push(c)
      if (picked.length >= MATCH_SIZE) break
    }
    return picked
  }, [roundCards, mode])
  const matchTiles = useMemo<MatchTile[]>(() => {
    const tiles = matchPairs.flatMap((c) => [
      { key: `${c.id}:t`, cardId: c.id, text: c.term },
      { key: `${c.id}:d`, cardId: c.id, text: c.translation }
    ])
    return shuffle(tiles)
  }, [matchPairs])

  const onTapTile = (tile: MatchTile): void => {
    if (wrongKeys.length > 0 || matched.has(tile.cardId)) return
    if (pickedKey === null) { setPickedKey(tile.key); return }
    if (pickedKey === tile.key) { setPickedKey(null); return }
    const first = matchTiles.find((t) => t.key === pickedKey)
    if (first && first.cardId === tile.cardId) {
      setMatched((prev) => new Set(prev).add(tile.cardId))
      setPickedKey(null)
    } else {
      setWrongKeys([pickedKey, tile.key])
      setMismatches((m) => m + 1)
      setTimeout(() => { setWrongKeys([]); setPickedKey(null) }, 650)
    }
  }

  // Match timer — runs only while the game is on screen.
  useEffect(() => {
    if (mode !== 'match') return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [mode])

  // Match win: all pairs matched → record outcome and finish.
  useEffect(() => {
    if (mode === 'match' && matchPairs.length > 0 && matched.size === matchPairs.length) {
      setResults({ correct: matchPairs.length, total: matchPairs.length + mismatches })
      setMode('done')
    }
  }, [matched, matchPairs.length, mode, mismatches])

  const accuracy = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0

  // Gamification — a finished round logs to the backend activity log AND (via
  // the mirror) the progress store, so Home stats and Progress both update (#A49).
  useEffect(() => {
    if (mode === 'done') {
      const userId = backend.currentUserId()
      if (userId) {
        void logActivity({
          userId,
          kind: 'practice_session',
          xp: 15,
          meta: {
            progressKind: 'flashcard_round',
            skill: 'vocabulary',
            accuracy,
            learned: results.correct,
            deck: activeDeck ?? 'All words'
          }
        }).catch(() => {})
      }
    }
    // Fire once per completion; results/accuracy are settled before mode flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const advance = (knewIt: boolean): void => {
    setResults((r) => ({ correct: r.correct + (knewIt ? 1 : 0), total: r.total + 1 }))
    setFlipped(false)
    if (idx < roundCards.length - 1) setIdx((i) => i + 1)
    else setMode('done')
  }

  const total = roundCards.length
  const canPlay = total > 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <div className="flex items-center gap-3">
          {mode !== 'menu' && (
            <button onClick={() => { setMode('menu'); reset() }} className="text-slate-400 hover:text-white"><IconChevronLeft className="w-5 h-5" /></button>
          )}
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">Vocabulary · Flashcards</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">{activeDeck ?? `${lang.name} vocabulary`}</h1>
            <p className="text-sm text-slate-400 mt-1">{total} {total === 1 ? 'card' : 'cards'}</p>
          </div>
        </div>

        {mode === 'menu' && (
          <>
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-10">Loading your deck…</p>
            ) : !canPlay ? (
              <div className="rounded-card border border-dashed border-white/12 bg-white/[0.02] p-10 text-center">
                <p className="text-sm text-slate-400">No words in this deck yet.</p>
                <button onClick={() => navigate('/vocabulary')} className="btn-primary px-4 py-2 text-sm mt-3">Add words</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {MENU.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => start(m.id as Mode)}
                    className={cn('rounded-card p-5 bg-gradient-to-br ring-1 ring-white/10 text-left transition hover:brightness-110', m.tint)}
                  >
                    <m.icon className="w-7 h-7 text-white" />
                    <h3 className="text-lg font-bold text-white mt-3">{m.title}</h3>
                    <p className="text-xs text-white/80 mt-1">{m.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {decks.length > 0 && (
              <>
                <SectionHeading title="Your decks" subtitle="Pick a deck to study" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveDeck(null)}
                    className={cn('rounded-2xl border p-4 text-left transition', activeDeck === null ? 'border-brand-400 bg-brand-500/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]')}
                  >
                    <p className="text-sm font-bold text-white">All words</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{cards.length} {cards.length === 1 ? 'card' : 'cards'}</p>
                  </button>
                  {decks.map((d) => (
                    <button
                      key={d.name}
                      onClick={() => setActiveDeck(d.name)}
                      className={cn('rounded-2xl border p-4 text-left transition', activeDeck === d.name ? 'border-brand-400 bg-brand-500/15' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]')}
                    >
                      <p className="text-sm font-bold text-white">{d.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{d.count} {d.count === 1 ? 'card' : 'cards'}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {mode === 'learn' && answer && (
          <div className="flex flex-col items-center gap-5">
            <ProgressBar value={((idx + 1) / total) * 100} className="w-full max-w-md" color="brand" />
            <p className="text-xs text-slate-400">{idx + 1} / {total}</p>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="w-full max-w-md aspect-[3/2] rounded-3xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.06] flex flex-col items-center justify-center p-8 text-center transition"
            >
              {!flipped ? (
                <>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{lang.name}</p>
                  <p className="text-3xl font-black text-white mt-2">{answer.term}</p>
                  <p className="text-xs text-slate-500 mt-4">Tap to reveal</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] uppercase tracking-widest text-brand-300 font-bold">Meaning</p>
                  <p className="text-2xl font-black text-brand-200 mt-2">{answer.translation}</p>
                  {answer.example && <p className="text-xs text-slate-400 italic mt-3">"{answer.example}"</p>}
                </>
              )}
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => advance(false)} className="rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 px-5 py-2.5 text-sm font-bold">Didn't know</button>
              <button onClick={() => advance(true)} className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 px-5 py-2.5 text-sm font-bold">I knew it</button>
            </div>
          </div>
        )}

        {mode === 'test' && answer && (
          <div className="flex flex-col gap-5">
            <ProgressBar value={((idx + 1) / total) * 100} color="brand" />
            <p className="text-xs text-slate-400">{idx + 1} / {total} · Multiple choice</p>
            <div className="rounded-card border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Translate:</p>
              <p className="text-3xl font-black text-white mt-2">{answer.term}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {options.map((opt) => {
                const isCorrect = opt.id === answer.id
                const isSel = selected === opt.id
                return (
                  <button
                    key={opt.id}
                    disabled={selected != null}
                    onClick={() => {
                      setSelected(opt.id)
                      setResults((r) => ({ correct: r.correct + (isCorrect ? 1 : 0), total: r.total + 1 }))
                      setTimeout(() => {
                        setSelected(null)
                        if (idx < total - 1) setIdx((j) => j + 1)
                        else setMode('done')
                      }, 700)
                    }}
                    className={cn(
                      'rounded-2xl border p-4 text-sm font-bold text-left transition',
                      selected == null && 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200',
                      isSel && isCorrect && 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200',
                      isSel && !isCorrect && 'border-rose-400/60 bg-rose-500/15 text-rose-200',
                      !isSel && selected != null && isCorrect && 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                    )}
                  >
                    {opt.translation}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {mode === 'match' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-400">Tap matching pairs · {matched.size}/{matchPairs.length} pairs · {fmtTime(elapsed)}{mismatches > 0 && ` · ${mismatches} misses`}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {matchTiles.map((tile) => {
                const isMatched = matched.has(tile.cardId)
                const isWrong = wrongKeys.includes(tile.key)
                const isPicked = pickedKey === tile.key
                return (
                  <button
                    key={tile.key}
                    disabled={isMatched || wrongKeys.length > 0}
                    onClick={() => onTapTile(tile)}
                    className={cn(
                      'rounded-xl px-3 py-3 text-xs font-bold transition border min-h-[64px]',
                      isMatched && 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100 opacity-60',
                      isWrong && 'bg-rose-500/20 border-rose-400/50 text-rose-100',
                      isPicked && !isMatched && !isWrong && 'bg-brand-500/25 border-brand-400/60 text-white',
                      !isMatched && !isWrong && !isPicked && 'bg-white/[0.04] border-white/10 text-slate-200 hover:bg-white/[0.07]'
                    )}
                  >
                    {tile.text}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {mode === 'done' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-8 text-center flex flex-col items-center gap-4">
            <span className="text-5xl">🎉</span>
            <p className="text-xl font-black text-white">Round complete!</p>
            <p className="text-sm text-slate-400">{results.total} {results.total === 1 ? 'card' : 'cards'} · {results.correct} correct · {accuracy}% accuracy</p>
            <div className="flex items-center gap-2 text-amber-200 text-sm font-bold"><IconBolt className="w-4 h-4" /> +15 XP <IconStar className="w-4 h-4 ml-2" /> Streak +1</div>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => { reset(); setMode('menu') }} className="btn-ghost text-sm px-4 py-2">Back</button>
              <button onClick={() => start('learn')} className="btn-primary text-sm px-4 py-2">Again</button>
              <button onClick={() => navigate('/vocabulary')} className="btn-ghost text-sm px-4 py-2">My vocab</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
