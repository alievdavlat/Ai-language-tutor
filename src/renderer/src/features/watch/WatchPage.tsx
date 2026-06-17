import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading } from '../../components/ui'
import { IconBookmark } from '../../components/icons'
import { WATCH_VIDEOS, getWatchVideo, activeSegmentIndex } from '../../services/content/watch'
import YouTubeEmbed, { type YouTubeHandle } from '../../components/content/YouTubeEmbed'
import WordText, { type WordPick } from '../../components/content/WordText'
import DictionaryPopover from '../../components/content/DictionaryPopover'
import { useContentState, isWordSaved, listSavedWords, setWatchPosition } from '../../services/content/progress'
import { useAppStore } from '../../store/useAppStore'

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function WatchPage(): JSX.Element {
  const navigate = useNavigate()
  const { videoId } = useParams()
  const nativeLang = useAppStore((s) => s.profile?.nativeLanguage ?? 'uz')
  const content = useContentState()

  const video = getWatchVideo(videoId ?? '') ?? WATCH_VIDEOS[0]
  const player = useRef<YouTubeHandle | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [pick, setPick] = useState<WordPick | null>(null)
  const lastSaved = useRef(0)

  const source = `Watch · ${video.title}`
  const savedFromVideo = useMemo(() => listSavedWords().filter((w) => w.source === source), [source, content])

  function onTime(t: number): void {
    const idx = activeSegmentIndex(video.segments, t)
    setActiveIdx((cur) => (cur === idx ? cur : idx))
    if (t - lastSaved.current > 5) { lastSaved.current = t; setWatchPosition(video.id, t) }
  }

  function jumpTo(i: number): void {
    player.current?.seekTo(video.segments[i].start)
    player.current?.play()
    setActiveIdx(i)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-5">
        <PageHeader
          title="Watch & learn"
          subtitle="Click a transcript line to jump, or any word to look it up and save it."
          back="/library"
          crumbs={[{ label: 'Library', to: '/library' }, { label: 'Watch' }]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="flex flex-col gap-5">
            {/* Player */}
            <div className="rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 aspect-video">
              <YouTubeEmbed ref={player} videoId={video.youtubeId} onTime={onTime} />
            </div>

            {/* Meta */}
            <div>
              <h1 className="text-xl font-bold text-white">{video.title}</h1>
              <p className="text-xs text-slate-400 mt-1">{video.channel} · {video.sourceViews} views on YouTube · {video.level} level</p>
            </div>

            {/* Transcript */}
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-4">
              <SectionHeading title="Transcript" subtitle="The current line follows the video · click a word to save it" />
              <div className="flex flex-col gap-0.5 max-h-96 overflow-y-auto">
                {video.segments.map((s, i) => (
                  <div
                    key={i}
                    className={cn('flex items-start gap-3 rounded-lg px-2.5 py-2 transition', i === activeIdx ? 'bg-brand-500/10 ring-1 ring-brand-400/30' : 'hover:bg-white/[0.04]')}
                  >
                    <button onClick={() => jumpTo(i)} className="text-[11px] text-brand-300/80 font-mono shrink-0 mt-0.5 hover:text-brand-200" title="Jump to this line">
                      {fmt(s.start)}
                    </button>
                    <span className={cn('text-sm', i === activeIdx ? 'text-white' : 'text-slate-300')}>
                      <WordText text={s.text} onPick={setPick} isSaved={(w) => isWordSaved(w, 'en')} active={pick?.word} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
            {/* Saved words */}
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-4">
              <SectionHeading title="Saved from this video" subtitle={`${savedFromVideo.length} word${savedFromVideo.length === 1 ? '' : 's'}`} />
              {savedFromVideo.length === 0 ? (
                <p className="text-sm text-slate-500">Click a word in the transcript to save it to your vocabulary.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {savedFromVideo.map((w) => (
                    <div key={w.id} className="rounded-lg bg-white/[0.025] border border-white/[0.06] px-3 py-2">
                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                        <IconBookmark className="w-3.5 h-3.5 text-amber-300" /> {w.word}
                        {w.pos && <span className="text-[10px] text-slate-500 font-normal">{w.pos}</span>}
                      </p>
                      {w.meaning && <p className="text-[11px] text-slate-400">{w.meaning}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Up next */}
            <div>
              <SectionHeading title="Up next" subtitle="More to watch" />
              <div className="flex flex-col gap-2.5">
                {WATCH_VIDEOS.filter((v) => v.id !== video.id).map((v) => (
                  <button key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="text-left flex gap-2 hover:bg-white/[0.03] rounded-xl p-1.5 transition">
                    <div className="relative w-24 h-14 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
                      <img src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`} alt={v.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white line-clamp-2">{v.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{v.channel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {pick && (
        <DictionaryPopover
          word={pick.word}
          lang="en"
          nativeLang={nativeLang}
          source={source}
          anchor={{ left: pick.rect.left, top: pick.rect.top, bottom: pick.rect.bottom }}
          onClose={() => setPick(null)}
        />
      )}
    </div>
  )
}
