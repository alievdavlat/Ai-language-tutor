import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle } from '../../components/ui'
import {
  IconArrowRight,
  IconBook,
  IconBolt,
  IconCheck,
  IconChevronLeft,
  IconDownload,
  IconLock,
  IconPlay,
  IconVolume,
  IconYouTube
} from '../../components/icons'

// Hardcoded preview lesson — real data comes from the course/content registry.
const LESSON = {
  course: 'Intermediate · B1',
  unit: 'Unit 1 · Present & past',
  title: 'Present continuous',
  teacher: 'Emma Carter',
  duration: '7:24',
  videoTitle: 'Present continuous — when & how to use it',
  about:
    "In this lesson you'll learn how to talk about actions happening right now and around the present time. We compare it with the present simple and practise common time expressions.",
  materials: [
    { kind: 'pdf' as const, name: 'Present continuous — worksheet.pdf', size: '420 KB' },
    { kind: 'pdf' as const, name: 'Grammar reference (Murphy p.4).pdf', size: '1.1 MB' },
    { kind: 'audio' as const, name: 'Listening: at the office.mp3', size: '3:12' }
  ],
  transcript:
    'Hi everyone! Today we are looking at the present continuous. Right now, I am standing in a classroom and I am talking to you. Notice the form: am / is / are + verb-ing…'
}

const CURRICULUM = [
  { title: 'Intro: daily routines', state: 'done' as const },
  { title: 'Present simple', state: 'done' as const },
  { title: 'Practice: present simple', state: 'done' as const },
  { title: 'Present continuous', state: 'current' as const },
  { title: 'Present vs continuous', state: 'locked' as const },
  { title: 'Unit 1 review', state: 'locked' as const }
]

type Tab = 'materials' | 'notes' | 'about'

function MaterialRow({ m }: { m: (typeof LESSON.materials)[number] }): JSX.Element {
  const isAudio = m.kind === 'audio'
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
      <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', isAudio ? 'bg-brand-500/15 text-brand-300' : 'bg-rose-500/15 text-rose-300')}>
        {isAudio ? <IconVolume className="w-5 h-5" /> : <IconBook className="w-5 h-5" />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{m.name}</p>
        <p className="text-xs text-slate-500">{isAudio ? 'Audio' : 'PDF'} · {m.size}</p>
      </div>
      <button className="w-9 h-9 rounded-full bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition" title={isAudio ? 'Play' : 'Download'}>
        {isAudio ? <IconPlay className="w-[18px] h-[18px]" /> : <IconDownload className="w-[18px] h-[18px]" />}
      </button>
    </div>
  )
}

function CurriculumRow({ item, active }: { item: (typeof CURRICULUM)[number]; active: boolean }): JSX.Element {
  const icon =
    item.state === 'done' ? <IconCheck className="w-4 h-4 text-emerald-300" />
    : item.state === 'locked' ? <IconLock className="w-3.5 h-3.5 text-slate-600" />
    : <IconPlay className="w-3.5 h-3.5 text-brand-300" />
  return (
    <div className={cn('flex items-center gap-2.5 rounded-xl px-3 py-2.5', active ? 'bg-brand-500/15 ring-1 ring-brand-400/30' : item.state === 'locked' ? 'opacity-50' : 'hover:bg-white/5')}>
      <span className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">{icon}</span>
      <span className={cn('text-sm truncate', active ? 'text-white font-semibold' : 'text-slate-300')}>{item.title}</span>
    </div>
  )
}

export default function ClassroomPage(): JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('materials')

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-3 border-b border-white/10 flex items-center gap-3 backdrop-blur-xl bg-canvas-soft/40 shrink-0">
        <button onClick={() => navigate('/courses')} className="text-slate-400 hover:text-white transition" title="Back to course">
          <IconChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{LESSON.title}</p>
          <p className="text-[11px] text-slate-400">{LESSON.course} · {LESSON.unit}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 max-w-6xl mx-auto">
          {/* Main */}
          <div className="flex flex-col gap-5">
            {/* Video */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 aspect-video flex items-center justify-center ring-1 ring-white/10">
              <button className="w-20 h-20 rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:scale-105 transition">
                <IconPlay className="w-9 h-9 text-white ml-1" />
              </button>
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-semibold bg-black/50 text-white rounded-full px-2.5 py-1">
                <IconYouTube className="w-4 h-4 text-red-500" /> YouTube
              </span>
              <span className="absolute bottom-3 right-3 text-[11px] font-semibold bg-black/60 text-white rounded px-1.5 py-0.5">{LESSON.duration}</span>
            </div>

            {/* Title + teacher */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight">{LESSON.videoTitle}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <AvatarCircle name={LESSON.teacher} size="sm" />
                  <span className="text-sm text-slate-300">{LESSON.teacher}</span>
                  <button className="ml-1 text-xs font-semibold text-brand-300 hover:text-brand-200 rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1">
                    Follow
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/10">
              {(['materials', 'notes', 'about'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn('px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition', tab === t ? 'border-brand-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200')}
                >
                  {t === 'notes' ? 'Notes' : t}
                </button>
              ))}
            </div>

            {tab === 'materials' && (
              <div className="flex flex-col gap-2">
                {LESSON.materials.map((m) => <MaterialRow key={m.name} m={m} />)}
              </div>
            )}
            {tab === 'notes' && (
              <p className="text-sm text-slate-300 leading-relaxed">{LESSON.transcript}</p>
            )}
            {tab === 'about' && (
              <p className="text-sm text-slate-300 leading-relaxed">{LESSON.about}</p>
            )}

            {/* Footer actions */}
            <div className="flex items-center gap-3 pt-2">
              <button className="btn-ghost px-5 py-2.5 inline-flex items-center gap-2">
                <IconCheck className="w-4 h-4" /> Mark complete
              </button>
              <button onClick={() => navigate('/learn/exercise')} className="btn-primary flex-1 py-2.5 inline-flex items-center justify-center gap-2">
                <IconBolt className="w-4 h-4" /> Practice exercises <IconArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Curriculum rail */}
          <aside className="lg:border-l lg:border-white/10 lg:pl-6">
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">{LESSON.unit}</p>
            <div className="flex flex-col gap-1">
              {CURRICULUM.map((item) => (
                <CurriculumRow key={item.title} item={item} active={item.title === LESSON.title} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
