import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { AvatarCircle, SectionHeading } from '../../components/ui'
import RealtimeStatus from '../../components/realtime/RealtimeStatus'
import { IconBolt, IconLive, IconStar, IconUsers, IconX } from '../../components/icons'
import { QUIZ_PACKS } from './questions'
import { useLiveQuiz } from './useLiveQuiz'
import { useT } from '../../i18n'

const OPTION_TONE = [
  { bg: 'bg-rose-500 hover:bg-rose-400', shape: '◆' },
  { bg: 'bg-emerald-500 hover:bg-emerald-400', shape: '●' },
  { bg: 'bg-amber-500 hover:bg-amber-400', shape: '▲' },
  { bg: 'bg-sky-500 hover:bg-sky-400', shape: '■' }
]

export default function LiveQuizPage(): JSX.Element {
  const t = useT()
  const navigate = useNavigate()
  const name = useAppStore((s) => s.profile?.name) ?? 'You'
  const q = useLiveQuiz(name)
  const [joinPin, setJoinPin] = useState('')
  const [pack, setPack] = useState(QUIZ_PACKS[0].id)

  const quit = (): void => {
    q.leave()
    navigate('/community')
  }

  return (
    <div className="h-full w-full bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(900px_700px_at_50%_-10%,rgba(168,85,247,0.20),transparent_60%),radial-gradient(900px_700px_at_50%_110%,rgba(37,99,235,0.20),transparent_60%)]" />

      <div className="relative h-full flex flex-col">
        <header className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1">
              <IconLive className="w-3 h-3" /> {t('lib.liveBadge')}
            </span>
            <p className="text-sm font-bold text-white">
              {q.phase === 'join' ? t('lib.liveQuiz') : QUIZ_PACKS.find((p) => p.id === pack)?.title ?? t('lib.liveQuiz')}
            </p>
          </div>
          <button onClick={quit} className="rounded-full w-9 h-9 bg-white/10 hover:bg-white/15 text-white flex items-center justify-center">
            <IconX className="w-4 h-4" />
          </button>
        </header>

        {/* ── Join / host ─────────────────────────────────────────────── */}
        {q.phase === 'join' && (
          <div className="flex-1 overflow-y-auto px-6 pb-10">
            <div className="max-w-xl mx-auto flex flex-col gap-6">
              <div className="text-center">
                <p className="text-3xl font-black text-white">{t('lib.liveQuizTitle')}</p>
                <p className="text-sm text-slate-400 mt-1.5">{t('lib.liveQuizSubtitle')}</p>
              </div>

              <RealtimeStatus />

              {/* Join with PIN */}
              <div className="rounded-card border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold mb-2">{t('lib.joinAGame')}</p>
                <div className="flex gap-2">
                  <input
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    inputMode="numeric"
                    placeholder={t('lib.gamePin')}
                    className="flex-1 rounded-pill bg-white/[0.05] border border-white/10 px-4 py-3 text-lg font-bold tracking-[0.3em] text-white text-center placeholder:tracking-normal placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
                  />
                  <button
                    onClick={() => q.join(joinPin)}
                    disabled={joinPin.length < 6}
                    className="btn-primary px-6 font-bold disabled:opacity-40"
                  >
                    {t('lib.join')}
                  </button>
                </div>
              </div>

              {/* Host a game */}
              <div className="rounded-card border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold mb-3">{t('lib.hostNewGame')}</p>
                <div className="grid sm:grid-cols-3 gap-2.5 mb-4">
                  {QUIZ_PACKS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPack(p.id)}
                      className={cn(
                        'rounded-xl border p-3 text-left transition',
                        pack === p.id ? 'border-brand-400/50 bg-brand-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                      )}
                    >
                      <p className="text-sm font-bold text-white leading-tight">{p.title.split('·').pop()?.trim()}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{p.subtitle}</p>
                      <p className="text-[10px] text-slate-500 mt-1.5">{p.questions.length} {t('lib.questions')}</p>
                    </button>
                  ))}
                </div>
                <button onClick={() => q.host(pack)} className="btn-primary w-full py-3 font-bold inline-flex items-center justify-center gap-2">
                  <IconLive className="w-4 h-4" /> {t('lib.createRoom')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Lobby ───────────────────────────────────────────────────── */}
        {q.phase === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{t('lib.gamePinLabel')}</p>
              <p className="text-5xl font-black text-white tracking-widest mt-2 tabular-nums">
                {q.pin.replace(/(\d{3})(\d{3})/, '$1 $2')}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {q.isHost ? t('lib.sharePin') : t('lib.waitingHostStart')} · {q.totalQuestions} {t('lib.questions')}
              </p>
            </div>

            <div className="w-full max-w-2xl">
              <SectionHeading
                title={`${q.leaderboard.length} ${t('lib.inTheRoom')}`}
                subtitle={q.isHost ? t('lib.startWhenJoined') : t('lib.getReady')}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {q.leaderboard.map((p) => (
                  <div
                    key={p.peerId}
                    className={cn(
                      'rounded-xl border p-3 flex flex-col items-center gap-2',
                      p.me ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.04]'
                    )}
                  >
                    <AvatarCircle name={p.name} size="sm" />
                    <span className="text-xs font-semibold text-white truncate max-w-full">
                      {p.name} {p.isHost && <span className="text-[9px] text-emerald-300">{t('lib.hostBadge')}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {q.isHost ? (
              <button onClick={q.start} className="btn-primary px-8 py-3 text-base font-bold">
                {t('lib.startGame')} →
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" /> {t('lib.connectedWaiting')}
              </span>
            )}
          </div>
        )}

        {/* ── Question ────────────────────────────────────────────────── */}
        {q.phase === 'question' && q.question && (
          <div className="flex-1 flex flex-col px-6 gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">{t('lib.question')} {q.qIndex + 1} {t('lib.of')} {q.totalQuestions}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{t('lib.time')}</span>
                <span className={cn('text-2xl font-black tabular-nums', q.remaining <= 5 ? 'text-rose-400' : 'text-amber-300')}>{q.remaining}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-300 font-bold"><IconBolt className="w-3.5 h-3.5" /> {q.myScore.toLocaleString()} {t('lib.pts')}</span>
            </div>

            <div className="rounded-card border border-white/10 bg-white/[0.04] p-8 text-center">
              <p className="text-[10px] uppercase tracking-widest text-brand-300 font-bold">{q.question.topic}</p>
              <p className="text-2xl font-bold text-white mt-3">{q.question.prompt}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {q.question.options.map((opt, i) => {
                const t = OPTION_TONE[i]
                const isSel = q.myChoice === i
                return (
                  <button
                    key={i}
                    onClick={() => q.answer(i)}
                    disabled={q.myChoice != null}
                    className={cn(
                      'rounded-2xl p-5 text-left font-bold text-white shadow-lg transition flex items-center gap-3 min-h-[88px]',
                      t.bg,
                      isSel && 'ring-4 ring-white/50 scale-[0.97]',
                      q.myChoice != null && !isSel && 'opacity-50'
                    )}
                  >
                    <span className="text-3xl">{t.shape}</span>
                    <span className="text-sm">{opt}</span>
                  </button>
                )
              })}
            </div>
            {q.myChoice != null && (
              <p className="text-center text-sm text-slate-400">{t('lib.answerLocked')}</p>
            )}
          </div>
        )}

        {/* ── Reveal / Final leaderboard ──────────────────────────────── */}
        {(q.phase === 'reveal' || q.phase === 'final') && (
          <div className="flex-1 flex flex-col items-center px-6 gap-5 overflow-y-auto pb-6">
            {q.phase === 'reveal' ? (
              <div className="text-center">
                {q.myChoice != null && q.myChoice === q.correctIndex ? (
                  <>
                    <p className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold">{t('lib.correct')}</p>
                    <p className="text-3xl font-black text-white mt-1">+ {q.lastGain} {t('lib.pts')}</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] uppercase tracking-widest text-rose-300 font-bold">
                      {q.myChoice == null ? t('lib.timeUp') : t('lib.notQuite')}
                    </p>
                    <p className="text-sm text-slate-300 mt-1">+ 0 {t('lib.pts')}</p>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-widest text-amber-300 font-bold">{t('lib.finalResults')}</p>
                <p className="text-3xl font-black text-white mt-1">🏆 {q.leaderboard.find((r) => !r.isHost)?.name ?? '—'} {t('lib.wins')}</p>
              </div>
            )}

            <div className="w-full max-w-2xl rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
              {q.leaderboard.filter((r) => !r.isHost).map((r, i) => (
                <div key={r.peerId} className={cn('flex items-center gap-3 px-4 py-3', r.me && 'bg-brand-500/10')}>
                  <span className={cn(
                    'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                    i === 0 ? 'bg-amber-500/30 text-amber-200' : i === 1 ? 'bg-slate-300/20 text-slate-200' : i === 2 ? 'bg-orange-500/30 text-orange-200' : 'bg-white/5 text-slate-300'
                  )}>{i + 1}</span>
                  <AvatarCircle name={r.name} size="sm" />
                  <span className="flex-1 text-sm font-semibold text-white">{r.name} {r.me && <span className="text-[10px] text-brand-300 ml-1">{t('lib.youBadge')}</span>}</span>
                  <span className="text-sm font-bold text-brand-200 tabular-nums">{r.score.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {q.isHost && q.phase === 'reveal' && (
              <button onClick={q.next} className="btn-primary px-6 py-2.5 text-sm">
                {q.qIndex + 1 >= q.totalQuestions ? `${t('lib.showFinal')} →` : `${t('lib.nextQuestion')} →`}
              </button>
            )}
            {q.phase === 'final' && (
              <button onClick={quit} className="btn-primary px-6 py-2.5 text-sm">{t('lib.done')}</button>
            )}
            {!q.isHost && q.phase === 'reveal' && (
              <p className="text-xs text-slate-500">{t('lib.waitingHostContinue')}</p>
            )}
          </div>
        )}

        <footer className="px-6 py-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5"><IconUsers className="w-3.5 h-3.5" /> {q.playerCount} {t('lib.players')}</span>
          <span className="inline-flex items-center gap-1.5"><IconStar className="w-3.5 h-3.5 text-amber-300" /> {t('lib.xpOnWin')}</span>
        </footer>
      </div>
    </div>
  )
}
