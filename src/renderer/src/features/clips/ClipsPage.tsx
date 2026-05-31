import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading, ProgressRing } from '../../components/ui'
import { IconHeadphones, IconPlay, IconFlame, IconBookmark, IconSearch, IconPlus, IconLock } from '../../components/icons'
import { CEFR_ORDER, type CEFRLevel } from '@shared/types'
import { useAppStore } from '../../store/useAppStore'
import { backend } from '../../services/backend/useBackend'
import { useStats } from '../../services/activity'
import { useTargetLanguage } from '../../lib/language'
import {
  useClips,
  usePlaylists,
  featuredClips,
  recentClips,
  hotClips,
  searchClips,
  clipsByGenre,
  clipsByIds,
  genreTiles,
  playlistUnlocked
} from '../../services/clips/store'
import { userClipStats } from './leaderboard'
import { KIND_LABEL, type Clip, type ClipKind, type Playlist } from './data'
import ClipEditor from './ClipEditor'

const KIND_TABS: { id: ClipKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'song', label: 'Music' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV' },
  { id: 'talk', label: 'Talks' }
]

function ClipCover({ clip, className }: { clip: Clip; className?: string }): JSX.Element {
  if (clip.thumbnailUrl) {
    return <img src={clip.thumbnailUrl} alt="" className={cn('absolute inset-0 w-full h-full object-cover', className)} />
  }
  return <div className={cn('absolute inset-0 bg-gradient-to-br', clip.cover, className)} />
}

function ClipCard({ clip, onOpen }: { clip: Clip; onOpen: () => void }): JSX.Element {
  return (
    <button onClick={onOpen} className="group w-56 shrink-0 text-left">
      <div className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-white/10">
        <ClipCover clip={clip} />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition" />
        <span className="absolute top-2 left-2 rounded-md bg-black/45 backdrop-blur text-white text-[10px] font-bold px-1.5 py-0.5">
          {KIND_LABEL[clip.kind]}
        </span>
        <span className="absolute top-2 right-2 text-sm drop-shadow">{clip.accent}</span>
        <span className="absolute bottom-2 right-2 rounded bg-black/55 text-white text-[10px] font-semibold px-1 py-0.5">
          {clip.duration}
        </span>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <span className="w-12 h-12 rounded-full bg-white/20 backdrop-blur ring-2 ring-white/40 flex items-center justify-center">
            <IconPlay className="w-5 h-5 text-white ml-0.5" />
          </span>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-sm font-semibold text-white truncate group-hover:text-brand-200 transition">{clip.title}</p>
        <p className="text-xs text-slate-400 truncate">{clip.artist}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {clip.playCount ? `${clip.playCount} plays` : clip.plays + ' plays'}
          <span className="ml-2 inline-flex items-center rounded bg-white/[0.06] text-slate-300 px-1.5 py-0.5 text-[10px] font-bold">{clip.level}</span>
        </p>
      </div>
    </button>
  )
}

function Rail({ children }: { children: ReactNode }): JSX.Element {
  return <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:thin]">{children}</div>
}

export default function ClipsPage(): JSX.Element {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const role = useAppStore((s) => s.role)
  const profile = useAppStore((s) => s.profile)
  const canAuthor = role === 'teacher' || role === 'admin'
  const lang = useTargetLanguage()
  const { stats } = useStats()
  const userName = profile?.name || 'You'

  const { list, refresh } = useClips()
  const { list: playlists } = usePlaylists()
  const [kind, setKind] = useState<ClipKind | 'all'>('all')
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [editing, setEditing] = useState(canAuthor && params.get('create') === '1')

  const open = (clip: Clip): void => navigate(`/clips/setup?id=${clip.id}`)
  const visible = (arr: Clip[]): Clip[] => (kind === 'all' ? arr : arr.filter((c) => c.kind === kind))

  // Real hero stats — CEFR ladder position + clip activity, no hardcoded numbers.
  const level = (profile?.level ?? 'A1') as CEFRLevel
  const levelIdx = Math.max(0, CEFR_ORDER.indexOf(level))
  const ringPct = Math.round((levelIdx / (CEFR_ORDER.length - 1)) * 100)
  const nextLevel = CEFR_ORDER[Math.min(CEFR_ORDER.length - 1, levelIdx + 1)]
  const clipStats = useMemo(() => userClipStats(userName), [userName, list])

  // Genres derived from the catalog.
  const genres = useMemo(() => genreTiles(), [list])

  // Filtered "results" view (search and/or genre); else the rails.
  const filtering = query.trim().length > 0 || genre !== null
  const results = useMemo(() => {
    let arr = query.trim() ? searchClips(query) : genre ? clipsByGenre(genre) : []
    if (genre && query.trim()) arr = arr.filter((c) => (c.genre ?? '').toLowerCase() === genre.toLowerCase())
    return visible(arr)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, genre, kind, list])

  const featured = useMemo(() => visible(featuredClips()), [list, kind])
  const recent = useMemo(() => visible(recentClips()), [list, kind])
  const hot = useMemo(() => visible(hotClips()), [list, kind])

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Listen & fill the gaps"
          title="Clips"
          subtitle="Learn English from music, movies & talks — fill in the missing words as you listen."
          back="/home"
          action={
            <div className="flex items-center gap-2">
              {canAuthor && (
                <button onClick={() => setEditing(true)} className="btn-primary px-3.5 py-2 text-sm inline-flex items-center gap-1.5">
                  <IconPlus className="w-4 h-4" /> Create clip
                </button>
              )}
              <button
                onClick={() => setShowSearch((s) => !s)}
                className="inline-flex items-center gap-2 rounded-pill bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.09] px-3.5 py-2 text-sm font-medium transition"
              >
                <IconSearch className="w-4 h-4" /> Search clips
              </button>
            </div>
          }
        />

        {/* Search */}
        {showSearch && (
          <div className="relative">
            <IconSearch className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, artist or genre…"
              className="w-full rounded-2xl bg-white/[0.04] border border-white/10 pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-brand-400/60"
            />
          </div>
        )}

        {/* Language / progress hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-grad-brand p-6">
          <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <ProgressRing value={ringPct} size={104} stroke={9} tone="brand">
                <span className="text-[10px] uppercase tracking-widest text-white/70">Level</span>
                <span className="text-3xl font-extrabold text-white leading-none">{level}</span>
              </ProgressRing>
              <div>
                <p className="text-sm text-white/80 font-medium">{lang.flag} Learning {lang.name}</p>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Keep the streak alive</h2>
                <p className="text-sm text-white/70 mt-0.5">
                  {level === 'C2' ? 'Top level reached' : `On the way to ${nextLevel}`} · play a clip today
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HeroStat icon={<IconBookmark className="w-4 h-4" />} value={String(clipStats.wordsFilled)} label="Words" />
              <HeroStat icon={<IconHeadphones className="w-4 h-4" />} value={String(clipStats.clipsPlayed)} label="Clips" />
              <HeroStat icon={<IconFlame className="w-4 h-4" />} value={String(stats?.streak ?? 0)} label="Day streak" />
            </div>
          </div>
        </div>

        {/* Kind filter */}
        <div className="flex flex-wrap items-center gap-2">
          {KIND_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setKind(t.id)}
              className={cn(
                'px-4 py-1.5 rounded-pill text-sm font-medium transition border',
                kind === t.id
                  ? 'bg-brand-500/15 text-brand-100 border-brand-400/30'
                  : 'bg-white/[0.03] text-slate-400 border-white/10 hover:text-slate-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtering ? (
          /* ── Filtered results (search and/or genre) ── */
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <SectionHeading
                title={query.trim() ? `Results for “${query.trim()}”` : `Genre · ${genre}`}
                subtitle={`${results.length} clip${results.length === 1 ? '' : 's'}`}
              />
              {genre && (
                <button onClick={() => setGenre(null)} className="text-xs font-semibold text-brand-300 hover:text-brand-200">Clear genre ✕</button>
              )}
              {query.trim() && (
                <button onClick={() => setQuery('')} className="text-xs font-semibold text-brand-300 hover:text-brand-200">Clear search ✕</button>
              )}
            </div>
            {results.length === 0 ? (
              <div className="rounded-card border border-white/10 bg-white/[0.025] p-8 text-center text-sm text-slate-400">
                No clips match. {canAuthor && 'Create one to fill the gap.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((c) => <ClipCard key={c.id} clip={c} onOpen={() => open(c)} />)}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Featured */}
            <section>
              <SectionHeading title="Featured clips" subtitle="Fresh picks for your level" />
              <Rail>{featured.map((c) => <ClipCard key={c.id} clip={c} onOpen={() => open(c)} />)}</Rail>
            </section>

            {/* Playlists (level-gated) */}
            <section>
              <SectionHeading title="Playlists" subtitle="Level-by-level mini courses" />
              <Rail>
                {playlists.map((p) => (
                  <PlaylistCard
                    key={p.id}
                    playlist={p}
                    unlocked={playlistUnlocked(p, level)}
                    onOpen={() => {
                      const first = clipsByIds(p.clipIds)[0]
                      if (first) open(first)
                    }}
                  />
                ))}
              </Rail>
            </section>

            {/* Genres */}
            {genres.length > 0 && (
              <section>
                <SectionHeading title="Genres" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {genres.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => { setGenre(g.label); setShowSearch(false) }}
                      className={cn('relative h-20 rounded-2xl overflow-hidden bg-gradient-to-br ring-1 ring-white/10 flex flex-col items-center justify-center group', g.cover)}
                    >
                      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition" />
                      <span className="relative text-white font-extrabold text-lg">{g.label}</span>
                      <span className="relative text-white/70 text-[11px] font-semibold">{g.count} clip{g.count === 1 ? '' : 's'}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Recently added */}
            <section>
              <SectionHeading title="Recently added" />
              <Rail>{recent.map((c) => <ClipCard key={c.id} clip={c} onOpen={() => open(c)} />)}</Rail>
            </section>

            {/* Hot */}
            <section>
              <SectionHeading title="Hot right now" subtitle="Most played by learners" />
              {hot.some((c) => (c.playCount ?? 0) > 0) ? (
                <Rail>{hot.map((c) => <ClipCard key={c.id} clip={c} onOpen={() => open(c)} />)}</Rail>
              ) : (
                <div className="rounded-card border border-white/10 bg-white/[0.025] p-6 text-center text-sm text-slate-400">
                  No plays yet — be the first to play a clip.
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {editing && (
        <ClipEditor
          authorId={backend.currentUserId() ?? undefined}
          onClose={() => { setEditing(false); if (params.get('create')) { params.delete('create'); setParams(params, { replace: true }) } }}
          onSaved={() => { setEditing(false); refresh(); if (params.get('create')) { params.delete('create'); setParams(params, { replace: true }) } }}
        />
      )}
    </div>
  )
}

function PlaylistCard({ playlist, unlocked, onOpen }: { playlist: Playlist; unlocked: boolean; onOpen: () => void }): JSX.Element {
  return (
    <button
      onClick={() => unlocked && onOpen()}
      disabled={!unlocked}
      className={cn('group w-56 shrink-0 text-left', !unlocked && 'cursor-not-allowed')}
    >
      <div className={cn('relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ring-1 ring-white/10 flex items-center justify-center', playlist.cover)}>
        <div className={cn('absolute inset-0 transition', unlocked ? 'bg-black/30 group-hover:bg-black/45' : 'bg-black/60')} />
        <span className="relative text-white font-extrabold text-lg drop-shadow text-center px-3">{playlist.title}</span>
        <span className="absolute top-2 left-2 rounded-md bg-black/45 text-white text-[10px] font-bold px-1.5 py-0.5">PLAYLIST</span>
        {!unlocked && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white">
            <IconLock className="w-6 h-6" />
            <span className="text-[11px] font-bold">Reach {playlist.minLevel}</span>
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between px-0.5">
        <p className="text-sm font-semibold text-white truncate">{playlist.title}</p>
      </div>
      <div className="flex items-center gap-1.5 px-0.5 mt-1">
        {playlist.dots.map((d, i) => (
          <span key={i} className="w-2 h-2 rounded-full" style={{ background: d }} />
        ))}
        <span className="text-[11px] text-slate-500 ml-1">{playlist.clipIds.length} clips</span>
      </div>
    </button>
  )
}

function HeroStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }): JSX.Element {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 px-4 py-3 text-center min-w-[78px]">
      <span className="inline-flex items-center justify-center text-white/90 mb-1">{icon}</span>
      <p className="text-xl font-extrabold text-white leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/70 mt-1">{label}</p>
    </div>
  )
}
