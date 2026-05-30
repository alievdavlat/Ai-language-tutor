import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading, ProgressRing } from '../../components/ui'
import { IconHeadphones, IconPlay, IconFlame, IconBookmark, IconSearch } from '../../components/icons'
import {
  CLIPS,
  PLAYLISTS,
  GENRES,
  FEATURED_IDS,
  RECENT_IDS,
  HOT_IDS,
  clipsByIds,
  KIND_LABEL,
  type Clip,
  type ClipKind
} from './data'

const KIND_TABS: { id: ClipKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'song', label: 'Music' },
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV' },
  { id: 'talk', label: 'Talks' }
]

function ClipCard({ clip, onOpen }: { clip: Clip; onOpen: () => void }): JSX.Element {
  return (
    <button
      onClick={onOpen}
      className="group w-56 shrink-0 text-left"
    >
      <div className={cn('relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ring-1 ring-white/10', clip.cover)}>
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
          {clip.plays} plays · {clip.ago}
          <span className="ml-2 inline-flex items-center rounded bg-white/[0.06] text-slate-300 px-1.5 py-0.5 text-[10px] font-bold">{clip.level}</span>
        </p>
      </div>
    </button>
  )
}

function Rail({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:thin]">{children}</div>
  )
}

export default function ClipsPage(): JSX.Element {
  const navigate = useNavigate()
  const [kind, setKind] = useState<ClipKind | 'all'>('all')

  const open = (clip: Clip): void => navigate(`/clips/setup?id=${clip.id}`)

  const visible = (list: Clip[]): Clip[] => (kind === 'all' ? list : list.filter((c) => c.kind === kind))

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Listen & fill the gaps"
          title="Clips"
          subtitle="Learn English from music, movies & talks — fill in the missing words as you listen."
          back="/home"
          action={
            <button className="inline-flex items-center gap-2 rounded-pill bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.09] px-3.5 py-2 text-sm font-medium transition">
              <IconSearch className="w-4 h-4" /> Search clips
            </button>
          }
        />

        {/* Language / progress hero */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-grad-brand p-6">
          <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <ProgressRing value={42} size={104} stroke={9} tone="brand">
                <span className="text-[10px] uppercase tracking-widest text-white/70">Level</span>
                <span className="text-3xl font-extrabold text-white leading-none">3</span>
              </ProgressRing>
              <div>
                <p className="text-sm text-white/80 font-medium">🇬🇧 Learning English</p>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Keep the streak alive</h2>
                <p className="text-sm text-white/70 mt-0.5">42% to Level 4 · play a clip today</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HeroStat icon={<IconBookmark className="w-4 h-4" />} value="128" label="Words" />
              <HeroStat icon={<IconHeadphones className="w-4 h-4" />} value="17" label="Clips" />
              <HeroStat icon={<IconFlame className="w-4 h-4" />} value="6" label="Day streak" />
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

        {/* Featured */}
        <section>
          <SectionHeading title="Featured clips" subtitle="Fresh picks for your level" />
          <Rail>
            {visible(clipsByIds(FEATURED_IDS)).map((c) => (
              <ClipCard key={c.id} clip={c} onOpen={() => open(c)} />
            ))}
          </Rail>
        </section>

        {/* Playlists */}
        <section>
          <SectionHeading title="Playlists" subtitle="Level-by-level mini courses" />
          <Rail>
            {PLAYLISTS.map((p) => (
              <button key={p.id} onClick={() => open(CLIPS[0])} className="group w-56 shrink-0 text-left">
                <div className={cn('relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ring-1 ring-white/10 flex items-center justify-center', p.cover)}>
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition" />
                  <span className="relative text-white font-extrabold text-lg drop-shadow text-center px-3">{p.title}</span>
                  <span className="absolute top-2 left-2 rounded-md bg-black/45 text-white text-[10px] font-bold px-1.5 py-0.5">PLAYLIST</span>
                </div>
                <div className="mt-2 flex items-center justify-between px-0.5">
                  <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                </div>
                <div className="flex items-center gap-1.5 px-0.5 mt-1">
                  {p.dots.map((d, i) => (
                    <span key={i} className="w-2 h-2 rounded-full" style={{ background: d }} />
                  ))}
                  <span className="text-[11px] text-slate-500 ml-1">{p.count} clips</span>
                </div>
              </button>
            ))}
          </Rail>
        </section>

        {/* Genres */}
        <section>
          <SectionHeading title="Genres" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GENRES.map((g) => (
              <button key={g.id} className={cn('relative h-20 rounded-2xl overflow-hidden bg-gradient-to-br ring-1 ring-white/10 flex items-center justify-center group', g.cover)}>
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition" />
                <span className="relative text-white font-extrabold text-lg">{g.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recently added */}
        <section>
          <SectionHeading title="Recently added" />
          <Rail>
            {visible(clipsByIds(RECENT_IDS)).map((c) => (
              <ClipCard key={c.id} clip={c} onOpen={() => open(c)} />
            ))}
          </Rail>
        </section>

        {/* Hot */}
        <section>
          <SectionHeading title="Hot right now" />
          <Rail>
            {visible(clipsByIds(HOT_IDS)).map((c) => (
              <ClipCard key={c.id} clip={c} onOpen={() => open(c)} />
            ))}
          </Rail>
        </section>
      </div>
    </div>
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
