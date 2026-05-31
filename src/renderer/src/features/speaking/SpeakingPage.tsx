import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { useIsAIReady } from '../../lib/ai'
import { cn } from '../../lib/classnames'
import {
  IconArrowRight,
  IconChat,
  IconChevronLeft,
  IconLock,
  IconMasks,
  IconMic,
  IconPlus,
  IconUsers
} from '../../components/icons'
import { roleplays, useRoleplays, ROLEPLAY_SECTIONS, type Roleplay, type RoleplayDifficulty } from '../../services/roleplay'
import ConversationMode from './modes/ConversationMode'
import PronunciationPage from '../pronunciation/PronunciationPage'
import RoleplayEditor from './sections/RoleplayEditor'

type View = 'hub' | 'chat' | 'pronunciation'

const DIFF_BADGE: Record<RoleplayDifficulty, string> = {
  easy: 'bg-emerald-500/90 text-white',
  medium: 'bg-sky-500/90 text-white',
  hard: 'bg-orange-500/90 text-white'
}

// ─── Role-play card ──────────────────────────────────────────────────────────
function RoleplayCard({ rp, locked, onOpen }: { rp: Roleplay; locked: boolean; onOpen: () => void }): JSX.Element {
  return (
    <button
      onClick={onOpen}
      className="group relative w-64 shrink-0 text-left rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03] transition hover:-translate-y-0.5 hover:border-white/20"
    >
      <div className={cn('relative h-36 overflow-hidden bg-gradient-to-br', rp.cover, locked && 'opacity-60')}>
        {rp.thumbnailUrl
          ? <img src={rp.thumbnailUrl} alt="" loading="lazy" className="w-full h-full object-cover transition group-hover:scale-[1.03]" />
          : <div className="w-full h-full flex items-center justify-center text-5xl select-none drop-shadow-lg transition group-hover:scale-[1.08]">{rp.emoji}</div>}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition" />
        <span className={cn('absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider rounded-md px-2 py-1', DIFF_BADGE[rp.difficulty])}>
          {rp.difficulty}
        </span>
        {locked && (
          <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 backdrop-blur flex items-center justify-center text-amber-300">
            <IconLock className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{rp.title}</h3>
        <p className="text-xs text-slate-500 mt-1.5">{rp.duration}</p>
      </div>
    </button>
  )
}

// ─── A horizontal rail of role-play cards ─────────────────────────────────────
function Rail({ title, items, locked, onOpen }: { title: string; items: Roleplay[]; locked: boolean; onOpen: (r: Roleplay) => void }): JSX.Element | null {
  if (items.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {items.map((rp) => (
          <RoleplayCard key={rp.id} rp={rp} locked={locked} onOpen={() => onOpen(rp)} />
        ))}
      </div>
    </section>
  )
}

export default function SpeakingPage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const navigate = useNavigate()
  const aiReady = useIsAIReady()
  const { list, refresh } = useRoleplays()

  const [view, setView] = useState<View>('hub')
  const [topic, setTopic] = useState('')
  const [editing, setEditing] = useState(false)

  const bySection = useMemo(() => {
    const map = new Map<string, Roleplay[]>()
    for (const rp of list) {
      const arr = map.get(rp.section) ?? []
      arr.push(rp)
      map.set(rp.section, arr)
    }
    return map
  }, [list])

  // "Trending now" = the most-started scenarios on this device (real play counts).
  // Empty until there's real activity — the rail simply hides rather than faking it.
  const trending = useMemo(
    () => [...list].filter((r) => (r.playCount ?? 0) > 0).sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0)).slice(0, 8),
    [list]
  )

  // "Based on your activity" = the sections you've actually practised, most recent
  // first; brand-new users fall back to level-matched starter scenarios.
  const forYou = useMemo(() => {
    const played = list.filter((r) => r.lastPlayedAt).sort((a, b) => (b.lastPlayedAt! < a.lastPlayedAt! ? -1 : 1))
    if (played.length > 0) {
      const sections = new Set(played.map((r) => r.section))
      const more = list.filter((r) => !r.lastPlayedAt && sections.has(r.section))
      return [...played, ...more].slice(0, 6)
    }
    const lvl = profile?.level
    const matched = lvl ? list.filter((r) => r.level === lvl) : []
    return (matched.length >= 3 ? matched : list).slice(0, 6)
  }, [list, profile?.level])

  if (!profile) {
    return <div className="h-full flex items-center justify-center text-slate-400">Loading…</div>
  }

  const startScenario = (rp: Roleplay): void => {
    if (!aiReady) { navigate('/settings'); return }
    roleplays.recordPlay(rp.id, new Date().toISOString())
    refresh()
    setTopic(rp.prompt)
    setView('chat')
  }

  const startFreeTalk = (): void => {
    if (!aiReady) { navigate('/settings'); return }
    setTopic('')
    setView('chat')
  }

  const surpriseMe = (): void => {
    if (!aiReady) { navigate('/settings'); return }
    if (list.length === 0) return
    const pick = list[Math.floor(Math.random() * list.length)] ?? list[0]
    startScenario(pick)
  }

  // ── Chat / pronunciation sub-views keep a Back button to the hub. ──
  if (view === 'chat') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2 backdrop-blur-xl bg-canvas-soft/40">
          <button onClick={() => setView('hub')} className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white"><IconChevronLeft className="w-4 h-4" /> Speaking</button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationMode topic={topic} onTopicChange={setTopic} />
        </div>
      </div>
    )
  }
  if (view === 'pronunciation') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2 backdrop-blur-xl bg-canvas-soft/40">
          <button onClick={() => setView('hub')} className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-white"><IconChevronLeft className="w-4 h-4" /> Speaking</button>
        </div>
        <div className="flex-1 overflow-hidden"><PronunciationPage /></div>
      </div>
    )
  }

  // ── HUB ──
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full max-w-5xl mx-auto flex flex-col gap-7">
        {/* Freemium banner */}
        <button
          onClick={() => navigate('/account')}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-brand-500/15 via-violet-500/10 to-transparent px-5 py-3.5 flex items-center gap-3 text-left"
        >
          <span className="text-sm"><b className="text-white">0/2</b> <span className="text-slate-400">Daily free lessons used</span></span>
          <span className="ml-auto text-sm font-black bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">Upgrade Now</span>
        </button>

        {/* Hero — AI tutor + speaking partner */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI tutor */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/25 via-violet-600/15 to-slate-900/30 p-6 flex items-center gap-5 min-h-[180px]">
            <div className="flex-1">
              <h2 className="text-2xl font-black tracking-tight text-white">Talk to AI Tutor</h2>
              <p className="text-sm text-slate-300/90 mt-1">Practice anytime, anywhere.</p>
              {aiReady ? (
                <button onClick={startFreeTalk} className="mt-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-5 py-2.5 text-sm font-bold text-white transition">Start Talking</button>
              ) : (
                <button onClick={() => navigate('/settings')} className="mt-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-5 py-2.5 text-sm font-bold text-amber-200 inline-flex items-center gap-2 transition"><IconLock className="w-4 h-4" /> Add AI key to talk</button>
              )}
            </div>
            {/* mascot orb */}
            <div className="shrink-0 w-28 h-28 rounded-full bg-gradient-to-br from-cyan-400 via-brand-500 to-violet-600 shadow-[0_0_40px_-5px] shadow-brand-500/50 flex items-center justify-center text-5xl select-none">🌍</div>
          </div>

          {/* Speaking partner — always available (human, no AI key) */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-600/20 via-teal-600/10 to-slate-900/30 p-6 flex items-center gap-5 min-h-[180px]">
            <div className="flex-1">
              <h2 className="text-2xl font-black tracking-tight text-white">Speaking partner</h2>
              <p className="text-sm text-slate-300/90 mt-1">Practice live with a real person.</p>
              <button onClick={() => navigate('/meet')} className="mt-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-5 py-2.5 text-sm font-bold text-white inline-flex items-center gap-2 transition"><IconUsers className="w-4 h-4" /> Find a partner</button>
              <p className="text-[11px] text-emerald-300/80 mt-2">No AI key needed</p>
            </div>
            <div className="shrink-0 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-[0_0_40px_-5px] shadow-emerald-500/40 flex items-center justify-center text-5xl select-none">🗣️</div>
          </div>
        </div>

        {/* Role-play labs */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Role-play labs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button onClick={surpriseMe} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-fuchsia-600/20 to-indigo-700/20 p-5 text-left min-h-[120px] flex flex-col justify-between transition hover:-translate-y-0.5 hover:border-white/20">
              <span className="text-3xl">🎁</span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white">Surprise me</span>
                {!aiReady && <IconLock className="w-4 h-4 text-amber-300" />}
              </div>
            </button>
            <button onClick={() => setEditing(true)} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-violet-600/20 to-blue-700/20 p-5 text-left min-h-[120px] flex flex-col justify-between transition hover:-translate-y-0.5 hover:border-white/20">
              <span className="text-3xl">✨</span>
              <span className="text-lg font-black text-white inline-flex items-center gap-2">Create my own <IconPlus className="w-4 h-4 text-slate-300" /></span>
            </button>
            <button onClick={() => setView('pronunciation')} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-amber-600/20 to-rose-700/20 p-5 text-left min-h-[120px] flex flex-col justify-between transition hover:-translate-y-0.5 hover:border-white/20">
              <span className="text-3xl">🎤</span>
              <span className="text-lg font-black text-white inline-flex items-center gap-2">Pronunciation <IconMic className="w-4 h-4 text-slate-300" /></span>
            </button>
          </div>
        </section>

        {/* More ways to practice — companions, video AI tutor, human tutors */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">More ways to practice</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { to: '/companions', label: 'Companions', sub: 'Pick a conversation partner', Icon: IconMasks, tint: 'bg-fuchsia-500/15 text-fuchsia-300' },
              { to: '/ai-tutor', label: 'Video call tutor', sub: 'Live voice call with Lily', Icon: IconChat, tint: 'bg-indigo-500/15 text-indigo-300' },
              { to: '/tutors', label: 'Find a tutor', sub: 'Book a human teacher', Icon: IconUsers, tint: 'bg-emerald-500/15 text-emerald-300' }
            ].map((q) => (
              <button
                key={q.to}
                onClick={() => navigate(q.to)}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left hover:bg-white/[0.06] transition flex items-center gap-3"
              >
                <span className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', q.tint)}>
                  <q.Icon className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-white">{q.label}</span>
                  <span className="block text-[11px] text-slate-400 leading-tight">{q.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Role-play rails */}
        <Rail title="Based on your activity ✨" items={forYou} locked={!aiReady} onOpen={startScenario} />
        <Rail title="Trending now" items={trending} locked={!aiReady} onOpen={startScenario} />
        {ROLEPLAY_SECTIONS.filter((s) => s.id !== 'trending').map((sec) => (
          <Rail key={sec.id} title={sec.label} items={bySection.get(sec.id) ?? []} locked={!aiReady} onOpen={startScenario} />
        ))}

        {!aiReady && (
          <p className="text-center text-xs text-slate-500 inline-flex items-center justify-center gap-1.5">
            <IconLock className="w-3.5 h-3.5" /> AI role-plays are locked — <button onClick={() => navigate('/settings')} className="text-brand-300 hover:underline">add a free AI key</button> to unlock. Speaking partner stays free.
          </p>
        )}
      </div>

      {editing && (
        <RoleplayEditor
          authorId={profile.name ?? 'me'}
          onClose={() => setEditing(false)}
          onSaved={(rp) => { setEditing(false); refresh(); startScenario(rp) }}
        />
      )}
    </div>
  )
}
