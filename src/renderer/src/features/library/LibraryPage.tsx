import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ListRow, Tabs, type TabItem } from '../../components/ui'
import { useTargetLanguage } from '../../lib/language'
import { IconBook, IconHeadphones, IconPlay, IconVolume } from '../../components/icons'
import { WATCH_VIDEOS } from '../../services/content/watch'
import { STORIES } from '../../services/content/stories'

type Tab = 'videos' | 'books' | 'podcasts'

const TABS: TabItem<Tab>[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'books', label: 'Books' },
  { id: 'podcasts', label: 'Podcasts' }
]

const LEVEL_TONE: Record<string, string> = {
  A1: 'bg-teal-500/80', A2: 'bg-emerald-500/80', B1: 'bg-amber-500/80', B2: 'bg-rose-500/80', C1: 'bg-violet-500/80'
}

// Spoken-word audio that actually plays (openly hosted). Swaps to Storage URLs
// with the cloud Foundation.
const PODCASTS = [
  { id: 'pod1', title: 'Everyday English — small talk', author: 'SpeakAI Audio', duration: '3:00', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'pod2', title: 'Travel phrases you’ll actually use', author: 'SpeakAI Audio', duration: '3:00', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'pod3', title: 'Business English basics', author: 'SpeakAI Audio', duration: '3:00', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
]

function PodcastRow({ p }: { p: (typeof PODCASTS)[number] }): JSX.Element {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  return (
    <ListRow
      leading={<span className="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconHeadphones className="w-5 h-5" /></span>}
      title={p.title}
      subtitle={`${p.author} · ${p.duration}`}
      trailing={
        <>
          <audio ref={ref} src={p.url} onEnded={() => setPlaying(false)} preload="none" />
          <button
            onClick={() => { const el = ref.current; if (!el) return; if (el.paused) { el.play(); setPlaying(true) } else { el.pause(); setPlaying(false) } }}
            className={cn('w-9 h-9 rounded-full flex items-center justify-center transition', playing ? 'bg-brand-500/30 text-brand-100' : 'bg-brand-500/15 text-brand-300 hover:bg-brand-500/25')}
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? <IconVolume className="w-[18px] h-[18px]" /> : <IconPlay className="w-[18px] h-[18px]" />}
          </button>
        </>
      }
    />
  )
}

export default function LibraryPage(): JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('videos')
  const lang = useTargetLanguage()

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{lang.flag} {lang.name}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Library</h1>
          <p className="text-sm text-slate-400 mt-1">Watch, read and listen — open anything to start.</p>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'videos' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {WATCH_VIDEOS.map((v) => (
              <button key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="text-left group">
                <div className="relative rounded-2xl h-32 overflow-hidden ring-1 ring-white/10">
                  <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt={v.title} className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition flex items-center justify-center">
                    <span className="w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center group-hover:scale-110 transition">
                      <IconPlay className="w-5 h-5 text-white ml-0.5" />
                    </span>
                  </span>
                  <span className={cn('absolute top-2 left-2 text-[10px] font-bold text-white rounded px-1.5 py-0.5', LEVEL_TONE[v.level] ?? 'bg-slate-600')}>{v.level}</span>
                </div>
                <p className="text-sm font-semibold text-white mt-2 leading-tight line-clamp-2">{v.title}</p>
                <p className="text-xs text-slate-400">{v.channel} · {v.views}</p>
              </button>
            ))}
          </div>
        )}

        {tab === 'books' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {STORIES.map((s) => (
              <button key={s.id} onClick={() => navigate(`/stories/${s.id}`)} className="text-left group">
                <div className={cn('relative rounded-2xl h-40 p-4 flex flex-col justify-between overflow-hidden bg-gradient-to-br', s.cover)}>
                  <div aria-hidden className="absolute left-3 top-0 bottom-0 w-px bg-white/20" />
                  <div className="flex items-center justify-between">
                    <IconBook className="w-6 h-6 text-white/70" />
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-black/25 text-white rounded-full px-2 py-0.5">{s.level}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{s.emoji} {s.title}</p>
                    <p className="text-[11px] text-white/70 mt-0.5">{s.parts.length} parts · read or listen</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'podcasts' && (
          <div className="flex flex-col gap-2">
            {PODCASTS.map((p) => <PodcastRow key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
