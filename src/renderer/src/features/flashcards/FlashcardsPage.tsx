import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressBar, SectionHeading } from '../../components/ui'
import { IconBolt, IconBook, IconChevronLeft, IconStar, IconTarget } from '../../components/icons'

type Mode = 'menu' | 'learn' | 'test' | 'match' | 'done'

interface Card {
  front: string
  back: string
  example?: string
}

const DECK: Card[] = [
  { front: 'persistent', back: 'qat\'iyatli, tinmas', example: 'She is persistent in pursuing her goals.' },
  { front: 'allocate', back: 'ajratmoq, taqsimlamoq', example: 'The manager will allocate tasks tomorrow.' },
  { front: 'consensus', back: 'umumiy kelishuv', example: 'They reached a consensus after long debate.' },
  { front: 'mitigate', back: 'yumshatmoq, kamaytirmoq', example: 'We need to mitigate the risks.' },
  { front: 'cognitive', back: 'bilim/aql bilan bog\'liq', example: 'Cognitive skills develop with age.' },
  { front: 'leverage', back: 'foydalanmoq, ishga solmoq', example: 'Leverage your strengths in interviews.' }
]

const MENU = [
  { id: 'learn', title: 'Learn', desc: 'Tap to flip, mark known/unknown.', icon: IconBook, tint: 'from-brand-500 to-violet-500' },
  { id: 'test', title: 'Test', desc: 'Multiple-choice quiz on the deck.', icon: IconTarget, tint: 'from-emerald-500 to-teal-500' },
  { id: 'match', title: 'Match', desc: 'Tap pairs as fast as you can.', icon: IconBolt, tint: 'from-amber-500 to-rose-500' }
] as const

export default function FlashcardsPage(): JSX.Element {
  const [mode, setMode] = useState<Mode>('menu')
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const navigate = useNavigate()

  // Match game state
  const [matchPicks, setMatchPicks] = useState<string[]>([])
  const matched = matchPicks.length

  const reset = (): void => { setIdx(0); setFlipped(false); setSelected(null); setMatchPicks([]) }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-3xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center gap-3">
          {mode !== 'menu' && (
            <button onClick={() => { setMode('menu'); reset() }} className="text-slate-400 hover:text-white"><IconChevronLeft className="w-5 h-5" /></button>
          )}
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">Vocabulary · Flashcards</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Business English deck</h1>
            <p className="text-sm text-slate-400 mt-1">{DECK.length} cards · last reviewed today</p>
          </div>
        </div>

        {mode === 'menu' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MENU.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as Mode)}
                  className={cn('rounded-card p-5 bg-gradient-to-br ring-1 ring-white/10 text-left transition hover:brightness-110', m.tint)}
                >
                  <m.icon className="w-7 h-7 text-white" />
                  <h3 className="text-lg font-bold text-white mt-3">{m.title}</h3>
                  <p className="text-xs text-white/80 mt-1">{m.desc}</p>
                </button>
              ))}
            </div>

            <SectionHeading title="More decks" subtitle="From your library" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['IELTS Speaking', 'Phrasal verbs', 'Common idioms', 'Travel basics', 'A2 essentials', '500 frequent words'].map((d) => (
                <button key={d} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:bg-white/[0.06]">
                  <p className="text-sm font-bold text-white">{d}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">42 cards</p>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'learn' && (
          <div className="flex flex-col items-center gap-5">
            <ProgressBar value={((idx + 1) / DECK.length) * 100} className="w-full max-w-md" color="brand" />
            <p className="text-xs text-slate-400">{idx + 1} / {DECK.length}</p>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="w-full max-w-md aspect-[3/2] rounded-3xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.06] flex flex-col items-center justify-center p-8 text-center transition"
            >
              {!flipped ? (
                <>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">English</p>
                  <p className="text-3xl font-black text-white mt-2">{DECK[idx].front}</p>
                  <p className="text-xs text-slate-500 mt-4">Tap to reveal</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] uppercase tracking-widest text-brand-300 font-bold">Uzbek</p>
                  <p className="text-2xl font-black text-brand-200 mt-2">{DECK[idx].back}</p>
                  {DECK[idx].example && <p className="text-xs text-slate-400 italic mt-3">"{DECK[idx].example}"</p>}
                </>
              )}
            </button>
            <div className="flex items-center gap-3">
              <button onClick={() => { setFlipped(false); if (idx < DECK.length - 1) setIdx((i) => i + 1); else setMode('done') }} className="rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 px-5 py-2.5 text-sm font-bold">Didn't know</button>
              <button onClick={() => { setFlipped(false); if (idx < DECK.length - 1) setIdx((i) => i + 1); else setMode('done') }} className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 px-5 py-2.5 text-sm font-bold">I knew it</button>
            </div>
          </div>
        )}

        {mode === 'test' && (
          <div className="flex flex-col gap-5">
            <ProgressBar value={((idx + 1) / DECK.length) * 100} color="brand" />
            <p className="text-xs text-slate-400">{idx + 1} / {DECK.length} · Multiple choice</p>
            <div className="rounded-card border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Translate:</p>
              <p className="text-3xl font-black text-white mt-2">{DECK[idx].front}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(() => {
                // Use a deck-index-stable identity so duplicate translations
                // don't collide. The truth is `deckIdx`, the visible text is
                // `back`. We dedupe by deckIdx, then sort by `back` for layout.
                const optionIndices = [idx, (idx + 1) % DECK.length, (idx + 2) % DECK.length, (idx + 3) % DECK.length]
                const options = Array.from(new Set(optionIndices))
                  .map((di) => ({ deckIdx: di, back: DECK[di].back }))
                  .sort((a, b) => a.back.localeCompare(b.back))
                return options.map((opt, i) => {
                  const isCorrect = opt.deckIdx === idx
                  const isSel = selected === i
                  return (
                    <button
                      key={opt.deckIdx}
                      disabled={selected != null}
                      onClick={() => {
                        setSelected(i)
                        setTimeout(() => {
                          setSelected(null)
                          if (idx < DECK.length - 1) setIdx((j) => j + 1)
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
                      {opt.back}
                    </button>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {mode === 'match' && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-400">Tap matching pairs · {matched}/{DECK.length * 2} matched · timer 1:24</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {[...DECK.map((c) => c.front), ...DECK.map((c) => c.back)].sort().map((token, i) => {
                const isPicked = matchPicks.includes(token)
                return (
                  <button
                    key={i}
                    onClick={() => setMatchPicks((arr) => arr.includes(token) ? arr : [...arr, token])}
                    className={cn(
                      'rounded-xl px-3 py-3 text-xs font-bold transition border min-h-[64px]',
                      isPicked ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100' : 'bg-white/[0.04] border-white/10 text-slate-200 hover:bg-white/[0.07]'
                    )}
                  >
                    {token}
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
            <p className="text-sm text-slate-400">{DECK.length} cards · 4 new mastered · 92% accuracy</p>
            <div className="flex items-center gap-2 text-amber-200 text-sm font-bold"><IconBolt className="w-4 h-4" /> +60 XP <IconStar className="w-4 h-4 ml-2" /> Streak +1</div>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => { reset(); setMode('menu') }} className="btn-ghost text-sm px-4 py-2">Back</button>
              <button onClick={() => { reset(); setMode('learn') }} className="btn-primary text-sm px-4 py-2">Again</button>
              <button onClick={() => navigate('/vocabulary')} className="btn-ghost text-sm px-4 py-2">My vocab</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
