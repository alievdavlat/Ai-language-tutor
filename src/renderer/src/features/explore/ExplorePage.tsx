import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { library } from '../../services/library/store'
import { rankCourses, rankLibraryByRecency, rankByFollowers } from '../../services/ranking'
import { isImageCover } from '../../lib/cover'
import { useTargetLanguage } from '../../lib/language'
import { useT } from '../../i18n'
import type { StringKey } from '../../i18n/strings'

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
  'col-span-2 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1',
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
const coverFor = (seed: string): string => COVERS[Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0)) % COVERS.length]

interface ExploreTile {
  id: string
  kind: 'course' | 'video' | 'voice' | 'post'
  title: string
  subtitle: string
  cover: string
  go: () => void
}

function TopTileCard({ tile, shape }: { tile: ExploreTile; shape: string }): JSX.Element {
  const KIcon = tile.kind === 'voice' ? IconMic : tile.kind === 'course' ? IconBook : tile.kind === 'post' ? IconStar : IconYouTube
  const img = isImageCover(tile.cover)
  return (
    <button onClick={tile.go} className={cn('relative rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-white/30 transition group text-left', !img && `bg-gradient-to-br ${tile.cover}`, shape)}>
      {img && <img src={tile.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-black/15 group-hover:bg-black/30 transition" />
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <span className="w-7 h-7 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center">
          <KIcon className="w-3.5 h-3.5" />
        </span>
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
  const t = useT()
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col items-center text-center gap-2">
      <div className="relative">
        <AvatarCircle name={u.name} size="lg" />
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-canvas" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">{u.name}</p>
        <p className="text-[11px] text-slate-400">
          {u.country} · {t('soc.levelLabel')} {u.level ?? 'A2'}
        </p>
        {u.bio && <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{u.bio}</p>}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <button onClick={() => navigate(`/inbox?user=${u.id}&greet=1`)} className="rounded-full bg-grad-brand text-white text-xs font-bold px-3 py-1.5">{t('soc.sayHi')}</button>
        <button onClick={() => navigate(`/inbox?user=${u.id}`)} className="rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-bold px-3 py-1.5">{t('soc.message')}</button>
      </div>
    </div>
  )
}

export default function ExplorePage({ embedded }: { embedded?: boolean } = {}): JSX.Element {
  const navigate = useNavigate()
  const t = useT()
  const lang = useTargetLanguage()
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>('top')
  const [q, setQ] = useState(params.get('q') ?? '')

  const localizedTabs: TabItem<Tab>[] = TABS.map((tabItem) => ({
    ...tabItem,
    label: t(`soc.tab_${tabItem.id}` as StringKey)
  }))

  // Featured/trending creators — all teachers, ranked by real follower count.
  // Exclude yourself so your own card never shows a Follow/Message button.
  const creators = useBackendQuery(async () => {
    const meId = backend.currentUserId()
    const teachers = (await backend.listUsers({ role: 'teacher' })).filter((u) => u.id !== meId)
    const withCounts = await Promise.all(
      teachers.map(async (u) => ({ u, followers: (await backend.followCounts(u.id)).followers }))
    )
    return rankByFollowers(withCounts).map((x) => x.u).slice(0, 6)
  }, [], [])

  // Study buddies — students learning the same language.
  const buddies = useBackendQuery(async () => {
    const ids = ['u_priya', 'u_wei', 'u_yui']
    const r = await Promise.all(ids.map((id) => backend.getUser(id)))
    return r.filter((u): u is PlatformUser => u !== null && u.targetLanguage === lang.code)
  }, [lang.code], [])

  const liveStreams = useBackendQuery(() => backend.listLiveNow({ language: lang.code }), [lang.code], [])

  // Real content for the Top + Videos grids: published courses + community
  // posts that carry a resource. Search filters across everything.
  const courses = useBackendQuery(() => backend.listCourses({ language: lang.code }), [lang.code], [])
  const feed = useBackendQuery(() => backend.listFeed({ limit: 60 }), [], [])
  const libItems = useBackendQuery(() => library.list(undefined, lang.code), [lang.code], [])

  const tiles = useMemo<ExploreTile[]>(() => {
    const courseTiles: ExploreTile[] = rankCourses(courses.data).map((c) => ({
      id: `c_${c.id}`,
      kind: 'course',
      title: c.title,
      subtitle: `Course · ${c.level}${c.reviewCount > 0 ? ` · ★ ${c.rating}` : ''}`,
      cover: c.thumbnailUrl || c.cover || coverFor(c.title),
      go: () => navigate(`/course/${c.id}`)
    }))
    // Library books / videos / audio are searchable too (newest first).
    const libTiles: ExploreTile[] = rankLibraryByRecency(libItems.data).map((it) => ({
      id: `l_${it.id}`,
      kind: it.kind === 'audio' ? 'voice' : it.kind === 'video' ? 'video' : 'post',
      title: it.title,
      subtitle: `${it.kind === 'book' ? 'Book' : it.kind === 'video' ? 'Video' : 'Audio'}${it.author ? ` · ${it.author}` : ''}`,
      cover: it.thumbnailUrl || coverFor(it.id),
      go: () => navigate(it.kind === 'book' ? `/library/book/${it.id}` : '/library')
    }))
    const postTiles: ExploreTile[] = feed.data
      .filter((p) => p.resource || p.kind === 'voice')
      .map((p) => ({
        id: `p_${p.id}`,
        kind: p.kind === 'voice' ? 'voice' : p.resource?.kind === 'youtube' ? 'video' : 'post',
        title: p.resource?.title || p.text.slice(0, 50) || 'Community post',
        subtitle: p.kind === 'voice' ? 'Voice post' : p.resource?.kind === 'youtube' ? 'Video' : 'Resource',
        cover: coverFor(p.id),
        go: () => navigate('/community')
      }))
    const all = [...courseTiles, ...libTiles, ...postTiles]
    const needle = q.trim().toLowerCase()
    if (!needle) return all
    return all.filter((t) => t.title.toLowerCase().includes(needle) || t.subtitle.toLowerCase().includes(needle))
  }, [courses.data, libItems.data, feed.data, q, navigate])

  const videoTiles = useMemo(() => tiles.filter((t) => t.kind === 'video' || t.kind === 'course'), [tiles])

  const matchedPeople = useMemo(() => {
    const meId = backend.currentUserId()
    const all = [...creators.data, ...buddies.data].filter((u) => u.id !== meId)
    const needle = q.trim().toLowerCase()
    if (!needle) return all
    return all.filter((u) => u.name.toLowerCase().includes(needle) || (u.bio ?? '').toLowerCase().includes(needle))
  }, [creators.data, buddies.data, q])

  return (
    <div className={embedded ? '' : 'h-full overflow-y-auto'}>
      <div className={cn('w-full flex flex-col gap-5', !embedded && 'px-6 py-6')}>
        {/* Hero */}
        <div className="rounded-card bg-gradient-to-br from-brand-500/20 via-violet-500/15 to-pink-500/15 border border-white/10 p-6">
          <p className="text-[11px] uppercase tracking-widest text-brand-200 font-bold">{t('soc.discover')} · {lang.flag} {lang.name}</p>
          <h1 className="text-3xl font-black tracking-tight text-white mt-1">{t('soc.exploreTitle')}</h1>
          <p className="text-sm text-slate-300 mt-1">
            {t('soc.exploreSubtitle')} {lang.name}.
          </p>
          <div className="relative mt-4">
            <IconSearch className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`${t('soc.searchPrefix')} ${lang.name} ${t('soc.searchSuffix')}`}
              className="w-full rounded-2xl bg-white/[0.08] border border-white/10 pl-12 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-brand-400/60 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {['IELTS', 'Pronunciation', 'Grammar', 'Business', 'Travel', 'Conversation'].map((chip) => (
              <button key={chip} onClick={() => setQ(chip)} className="rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-semibold px-3 py-1.5">
                #{chip === 'IELTS' ? chip : t(`soc.chip_${chip.toLowerCase()}` as StringKey)}
              </button>
            ))}
            {q && (
              <button onClick={() => setQ('')} className="rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 text-xs font-semibold px-3 py-1.5">{t('soc.clear')} ✕</button>
            )}
          </div>
        </div>

        <Tabs items={localizedTabs} active={tab} onChange={setTab} className="self-start" />

        {/* Top grid — Instagram explore style, real content */}
        {tab === 'top' && (
          <>
            <SectionHeading title={q ? `${t('soc.resultsFor')} "${q}"` : t('soc.topThisWeek')} subtitle={`${tiles.length + (q ? matchedPeople.length : 0)} ${tiles.length + (q ? matchedPeople.length : 0) === 1 ? t('soc.resultOne') : t('soc.resultMany')}`} />

            {/* People matches first when searching */}
            {q && matchedPeople.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {matchedPeople.map((u) => (
                  <div key={u.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
                    <AvatarCircle name={u.name} src={(u as { avatarUrl?: string }).avatarUrl} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{u.name}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{u.bio ?? `${u.country ?? ''} · ${t('soc.levelLabel')} ${u.level ?? 'A2'}`}</p>
                    </div>
                    <button onClick={() => navigate(`/channel?id=${u.id}`)} className="text-xs font-semibold text-brand-300 hover:text-brand-200">{t('soc.view')} →</button>
                  </div>
                ))}
              </div>
            )}

            {q && tiles.length === 0 && matchedPeople.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">{t('soc.nothingMatches')} “{q}”. {t('soc.tryNameHint')}</p>
            ) : tiles.length > 0 ? (
              <div className="grid grid-cols-4 auto-rows-[110px] gap-2">
                {tiles.slice(0, 18).map((tile, i) => (
                  <TopTileCard key={tile.id} tile={tile} shape={TILE_SHAPES[i % TILE_SHAPES.length]} />
                ))}
              </div>
            ) : null}

            {!q && (
              <>
                <SectionHeading title={t('soc.featuredCreators')} subtitle={`${creators.data.length} ${t('soc.teachersWorthFollowing')}`} className="mt-2" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {creators.data.map((u) => (
                    <div key={u.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
                      <AvatarCircle name={u.name} src={(u as { avatarUrl?: string }).avatarUrl} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{u.name}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{u.bio}</p>
                      </div>
                      <button onClick={() => navigate(`/channel?id=${u.id}`)} className="text-xs font-semibold text-brand-300 hover:text-brand-200">{t('soc.view')} →</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'videos' && (
          videoTiles.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t('soc.noVideosMatch')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {videoTiles.map((tile) => (
                <TopTileCard key={tile.id} tile={tile} shape="col-span-1 row-span-2" />
              ))}
            </div>
          )
        )}

        {tab === 'people' && (
          matchedPeople.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">{t('soc.noPeopleMatch')}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {matchedPeople.map((u) => (
                <StudyBuddyCard key={u.id} u={u} />
              ))}
            </div>
          )
        )}

        {tab === 'live' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveStreams.data.length === 0 ? (
              <p className="col-span-full text-sm text-slate-400 text-center py-6">{t('soc.nobodyLivePrefix')} {lang.name} {t('soc.nobodyLiveSuffix')}</p>
            ) : liveStreams.data.map((s) => (
              <button key={s.id} onClick={() => navigate('/live/room')} className={cn('rounded-2xl ring-1 ring-white/10 hover:ring-white/30 overflow-hidden bg-gradient-to-br h-44 relative text-left transition group', s.cover)}>
                <span className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {t('soc.live')}
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
            <SectionHeading title={`${lang.name} ${t('soc.learnersAroundLevel')}`} subtitle={t('soc.buddiesSubtitle')} />
            {buddies.data.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">{t('soc.noBuddiesPrefix')} {lang.name} {t('soc.noBuddiesSuffix')}</p>
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
