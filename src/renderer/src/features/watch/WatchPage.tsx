import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { SectionHeading } from '../../components/ui'
import { IconBookmark, IconPlay, IconVolume, IconYouTube } from '../../components/icons'

interface Segment {
  start: string
  text: string
  active?: boolean
}

const SEGMENTS: Segment[] = [
  { start: '0:02', text: "Hi everyone, welcome back to my channel." },
  { start: '0:05', text: "Today we are going to talk about the present perfect tense." },
  { start: '0:11', text: "It is one of the most confusing tenses in English." },
  { start: '0:16', text: "But I promise — by the end of this video, you will get it.", active: true },
  { start: '0:22', text: "Let's start with a simple example." },
  { start: '0:25', text: "I have lived in London for five years." },
  { start: '0:30', text: "Notice — I am still living there now." },
  { start: '0:34', text: "That is a key clue for using the present perfect." }
]

const SAVED_WORDS = [
  { word: 'confusing', pos: 'adj.', meaning: 'difficult to understand' },
  { word: 'tense (grammar)', pos: 'n.', meaning: 'form of a verb showing time' },
  { word: 'notice', pos: 'v.', meaning: 'to see or become aware of' }
]

const NEXT_VIDEOS = [
  { title: 'Past perfect vs. past simple', channel: 'GrammarLab', time: '12:04', cover: 'from-rose-500 to-pink-700' },
  { title: 'Modal verbs explained', channel: 'EnglishWithEmma', time: '08:33', cover: 'from-sky-500 to-blue-700' },
  { title: 'Phrasal verbs you actually use', channel: 'James Lee', time: '14:21', cover: 'from-emerald-500 to-teal-700' }
]

export default function WatchPage(): JSX.Element {
  const [activeIdx, setActiveIdx] = useState(3)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="flex flex-col gap-5">
          {/* Player */}
          <div className="rounded-2xl overflow-hidden bg-black ring-1 ring-white/10">
            <div className="relative aspect-video bg-gradient-to-br from-slate-700 via-slate-900 to-black flex items-center justify-center">
              <button className="w-16 h-16 rounded-full bg-white/15 backdrop-blur ring-2 ring-white/30 flex items-center justify-center hover:bg-white/25">
                <IconPlay className="w-7 h-7 text-white ml-1" />
              </button>
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold px-2 py-1">
                <IconYouTube className="w-3 h-3" /> YouTube
              </span>
              {/* Subtitle overlay */}
              <div className="absolute bottom-12 left-4 right-4 text-center">
                <p className="inline-block max-w-full bg-black/70 backdrop-blur px-4 py-2 rounded-lg text-white text-base font-medium">
                  {SEGMENTS[activeIdx].text.split(' ').map((w, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(w.replace(/[.,!?;:]$/, ''))}
                      className={cn('mx-0.5 transition hover:bg-brand-500/40 rounded px-0.5', selected === w.replace(/[.,!?;:]$/, '') && 'bg-brand-500/40')}
                    >
                      {w}
                    </button>
                  ))}
                </p>
              </div>
              {/* Controls bar */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-gradient-to-t from-black/80 to-transparent">
                <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: '38%' }} />
                </div>
                <div className="flex items-center justify-between mt-2 text-white text-xs">
                  <div className="flex items-center gap-3">
                    <IconPlay className="w-4 h-4" />
                    <IconVolume className="w-4 h-4" />
                    <span>2:14 / 5:48</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-md bg-white/10 hover:bg-white/20 px-2 py-0.5 text-[11px]">CC</button>
                    <button className="rounded-md bg-white/10 hover:bg-white/20 px-2 py-0.5 text-[11px]">1.0×</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div>
            <h1 className="text-xl font-bold text-white">Present perfect — finally make sense of it</h1>
            <p className="text-xs text-slate-400 mt-1">GrammarLab · 412k views · B1 level</p>
            <div className="flex items-center gap-2 mt-3">
              <button className="btn-ghost text-xs px-3 py-1.5">👍 Like</button>
              <button className="btn-ghost text-xs px-3 py-1.5">💾 Save</button>
              <button className="btn-ghost text-xs px-3 py-1.5">↗ Share</button>
            </div>
          </div>

          {/* Transcript */}
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-4">
            <SectionHeading title="Transcript" subtitle="Click any line to jump · click any word to save it" />
            <div className="flex flex-col gap-0.5 max-h-80 overflow-y-auto">
              {SEGMENTS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    'flex items-start gap-3 text-left rounded-lg px-2.5 py-2 transition',
                    i === activeIdx ? 'bg-brand-500/10 ring-1 ring-brand-400/30' : 'hover:bg-white/[0.04]'
                  )}
                >
                  <span className="text-[11px] text-slate-500 font-mono shrink-0 mt-0.5">{s.start}</span>
                  <span className={cn('text-sm', i === activeIdx ? 'text-white' : 'text-slate-300')}>
                    {s.text.split(' ').map((w, j) => {
                      const clean = w.replace(/[.,!?;:]$/, '')
                      return (
                        <span
                          key={j}
                          onClick={(e) => { e.stopPropagation(); setSelected(clean) }}
                          className={cn('mr-1 transition cursor-pointer hover:text-brand-200', selected === clean && 'bg-brand-500/40 rounded px-0.5')}
                        >
                          {w}
                        </span>
                      )
                    })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-5">
          {/* Selected word card */}
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-4">
            <SectionHeading title="Selected word" subtitle={selected ? '' : 'Click any word in the subtitles'} />
            {selected ? (
              <>
                <p className="text-2xl font-bold text-white">{selected}</p>
                <p className="text-xs text-slate-400 mt-1">English · click to hear</p>
                <button className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 text-brand-200 text-xs font-bold px-3 py-1.5 hover:bg-brand-500/25">
                  <IconBookmark className="w-3.5 h-3.5" /> Save to vocabulary
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">No word selected.</p>
            )}
          </div>

          {/* Saved words */}
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-4">
            <SectionHeading title="Saved from this video" subtitle={`${SAVED_WORDS.length} words`} />
            <div className="flex flex-col gap-2">
              {SAVED_WORDS.map((w) => (
                <div key={w.word} className="rounded-lg bg-white/[0.025] border border-white/[0.06] px-3 py-2">
                  <p className="text-sm font-bold text-white">{w.word} <span className="text-[10px] text-slate-500 font-normal">{w.pos}</span></p>
                  <p className="text-[11px] text-slate-400">{w.meaning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Up next */}
          <div>
            <SectionHeading title="Up next" subtitle="Curated for your level" />
            <div className="flex flex-col gap-2.5">
              {NEXT_VIDEOS.map((v) => (
                <button key={v.title} className="text-left flex gap-2 hover:bg-white/[0.03] rounded-xl p-1.5 transition">
                  <div className={cn('relative w-24 h-14 rounded-lg bg-gradient-to-br shrink-0 ring-1 ring-white/10', v.cover)}>
                    <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/60 text-white rounded px-1">{v.time}</span>
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
  )
}
