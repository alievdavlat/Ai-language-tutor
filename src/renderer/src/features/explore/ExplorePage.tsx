import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PlatformUser } from '@shared/types'
import { cn } from '../../lib/classnames'
import { AvatarCircle, SectionHeading, Tabs, type TabItem } from '../../components/ui'
import {
  IconBook,
  IconLive,
  IconMic,
  IconPlay,
  IconSearch,
  IconStar,
  IconUsers,
  IconYouTube
} from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { useTargetLanguage } from '../../lib/language'

type Tab = 'top' | 'videos' | 'people' | 'live' | 'buddies'
const TABS: TabItem<Tab>[] = [
  { id: 'top', label: 'Top' },
  { id: 'videos', label: 'Videos' },
  { id: 'people', label: 'People' },
  { id: 'live', label: 'Live now' },
  { id: 'buddies', label: 'Study buddies' }
]

// Asymmetric Instagram-style tile sizes for the Top grid
const TILE_SHAPES = [
  'col-span-2 row-span-2', // big
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1', // wide
  'col-span-1 row-span-1',
  'col-span-1 row-span-1'
]

const COVERS = [
  'from-rose-500 to-pink-700',
  'from-sky-500 to-blue-700',
  'from-violet-500 to-purple-700',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-700',
  'from-fuchsia-500 to-pink-700',
  'from-cyan-500 to-blue-700',
  'from-rose-500 to-orange-700',
  'from-indigo-500 to-violet-700'
]

const VIDEO_TITLES = [
  'Master the present perfect',
  'Sound natural: linking words',
  'IELTS Speaking Part 2 tips',
  'Phrasal verbs in 10 min',
  'Past tenses: a 5-min recap',
  'Pronunciation: the schwa',
  'Common Uzbek-English false friends',
  'How to introduce yourself',
  'Small talk that works'
]

interface TopTile {
  kind: 'video' | 'live' | 'voice' | 'achievement'
  title: string
  subtitle: string
  cover: string
  badge?: string
}

const TOP_TILES: TopTile[] = VIDEO_TITLES.map((t, i) => ({
  kind: i % 4 === 0 ? 'live' : i % 5 === 1 ? 'voice' : i % 7 === 2 ? 'achievement' : 'video',
  title: t,
  subtitle: i % 4 === 0 ? `${300 + i * 47} watching` : `${(i + 1) * 1200} views`,
  cover: COVERS[i % COVERS.length],
  badge: i % 4 === 0 ? 'LIVE' : undefined
}))

function TopTileCard({ tile, shape }: { tile: TopTile; shape: string }): JSX.Element {
  const kindIcon = tile.kind === 'live' ? IconLive
    : tile.kind === 'voice' ? IconMic
    : tile.kind === 'achievement' ? IconStar
    : IconYouTube
  const KIcon = kindIcon
  return (
    <button className={cn('relative rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-white/30 transition group bg-gradient-to-br', tile.cover, shape)}>
      <div className="absolute inset-0 bg-black/15 group-hover:bg-black/30 transition" />
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        {tile.badge ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {tile.badge}
          </span>
        ) : (
          <span className="w-7 h-7 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center">
            <KIcon className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-sm font-bold text-white line-clamp-2">{tile.title}</p>
        <p className="text-[10px] text-white/70">{tile.subtitle}</p>
      </div>
      <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/15 backdrop-blur ring-2 ring-white/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
        <IconPlay className="w-5 h-5 text-white ml-0.5" />
      </div>
    </button>
  )
}

function StudyBuddyCard({ u }: { u: PlatformUser }): JSX.Element {
  const navigate = useNavigate()
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col items-center text-center gap-2">
      <div className="relative">
        <AvatarCircle name={u.name} size="lg" />
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-canvas" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">{u.name}</p>
        <p className="text-[11px] text-slate-400">
          {u.country} · Level {u.level ?? 'A2'}
        </p>
        {u.bio && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{u.bio}</p>}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button onClick={() => navigate('/meet')} className="rounded-full bg-grad-brand text-white text-xs font-bold px-3 py-1.5">Say hi</button>
        <button onClick={() => navigate('/inbox')} className="rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-bold px-3 py-1.5">Message</button>
      </div>
    </div>
  )
}

export default function ExplorePage(): JSX.Element {
  const navigate = useNavigate()
  const lang = useTargetLanguage()
  const [tab, setTab] = useState<Tab>('top')
  const [q, setQ] = useState('')

  // Featured creators — teachers in seed.
  const creators = useBackendQuery(async () => {
    const ids = ['u_emma', 'u_james', 'u_marco']
    const r = await Promise.all(ids.map((id) => backend.getUser(id)))
    return r.filter((u): u is PlatformUser => u !== null)
  }, [], [])

  // Study buddies — students learning the same language.
  const buddies = useBackendQuery(async () => {
    const ids = ['u_priya', 'u_wei', 'u_yui']
    const r = await Promise.all(ids.map((id) => backend.getUser(id)))
    return r.filter((u): u is PlatformUser => u !== null && u.targetLanguage === lang.code)
  }, [lang.code], [])

  const liveStreams = useBackendQuery(() => backend.listLiveNow({ language: lang.code }), [lang.code], [])

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-6xl mx-auto w-full flex flex-col gap-5">
        {/* Hero */}
        <div className="rounded-card bg-gradient-to-br from-brand-500/20 via-violet-500/15 to-pink-500/15 border border-white/10 p-6">
          <p className="text-[11px] uppercase tracking-widest text-brand-200 font-bold">Discover · {lang.flag} {lang.name}</p>
          <h1 className="text-3xl font-black tracking-tight text-white mt-1">Explore the platform</h1>
          <p className="text-sm text-slate-300 mt-1">
            Top videos, trending creators, live streams and study buddies — all learners and teachers learning {lang.name}.
          </p>
          <div className="relative mt-4">
            <IconSearch className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${lang.name} videos, people, lessons, posts…`}
              className="w-full rounded-2xl bg-white/[0.08] border border-white/10 pl-12 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-brand-400/60 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {['IELTS', 'Pronunciation', 'Slang', 'Travel', 'Business', 'Grammar', 'Daily talk'].map((t) => (
              <button key={t} onClick={() => setQ(t)} className="rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-semibold px-3 py-1.5">
                #{t}
              </button>
            ))}
          </div>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {/* Top grid — Instagram explore style */}
        {tab === 'top' && (
          <>
            <SectionHeading title="Top this week" subtitle="Most-watched, most-discussed, most-loved" />
            <div className="grid grid-cols-4 auto-rows-[110px] gap-2">
              {TOP_TILES.map((tile, i) => (
                <TopTileCard key={tile.title} tile={tile} shape={TILE_SHAPES[i % TILE_SHAPES.length]} />
              ))}
            </div>

            <SectionHeading title="Featured creators" subtitle={`${creators.data.length} teachers worth following`} className="mt-2" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {creators.data.map((u) => (
                <div key={u.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
                  <AvatarCircle name={u.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{u.name}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{u.bio}</p>
                  </div>
                  <button onClick={() => navigate('/channel')} className="text-xs font-semibold text-brand-300 hover:text-brand-200">View →</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'videos' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {TOP_TILES.map((tile) => (
              <TopTileCard key={tile.title} tile={tile} shape="col-span-1 row-span-2" />
            ))}
          </div>
        )}

        {tab === 'people' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...creators.data, ...buddies.data].map((u) => (
              <StudyBuddyCard key={u.id} u={u} />
            ))}
          </div>
        )}

        {tab === 'live' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveStreams.data.length === 0 ? (
              <p className="col-span-full text-sm text-slate-400 text-center py-6">Nobody is live in {lang.name} right now.</p>
            ) : liveStreams.data.map((s) => (
              <button key={s.id} onClick={() => navigate('/live/room')} className={cn('rounded-2xl ring-1 ring-white/10 hover:ring-white/30 overflow-hidden bg-gradient-to-br h-44 relative text-left transition group', s.cover)}>
                <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                </span>
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5">
                  <IconUsers className="w-3 h-3" /> {s.viewerCount}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-sm font-bold text-white">{s.title}</p>
                  <p className="text-[11px] text-white/80">{s.category}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'buddies' && (
          <>
            <SectionHeading title={`${lang.name} learners around your level`} subtitle="Match with someone for shadowing, 1:1 practice, or just to chat" />
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {['Any level', 'A1-A2', 'B1', 'B2', 'C1+'].map((l) => (
                <button key={l} className={cn(
                  'rounded-full text-[11px] font-bold px-3 py-1 transition border',
                  l === 'B1' ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                )}>{l}</button>
              ))}
              <span className="text-[11px] text-slate-500 ml-2">{buddies.data.length} match{buddies.data.length === 1 ? '' : 'es'}</span>
            </div>
            {buddies.data.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No buddies for {lang.name} yet — try another language in Settings → Language.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {buddies.data.map((u) => <StudyBuddyCard key={u.id} u={u} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
