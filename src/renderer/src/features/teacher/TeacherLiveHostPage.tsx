import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading, StatCard, Tabs, type TabItem } from '../../components/ui'
import { IconLive, IconStar, IconUsers, IconYouTube } from '../../components/icons'

type Tab = 'schedule' | 'history' | 'clips'
const TABS: TabItem<Tab>[] = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'history', label: 'History' },
  { id: 'clips', label: 'Clips & shorts' }
]

const SCHEDULED = [
  { title: 'Free talk · Coffee chat', when: 'Today · 19:00', expected: 240 },
  { title: 'IELTS Speaking Q&A', when: 'Sat · 14:00', expected: 510 },
  { title: 'Grammar deep dive', when: 'Mon · 18:00', expected: 180 }
]

const PAST = [
  { title: 'Past tenses live workshop', date: '2026-05-21', peak: 412, avg: 318, duration: '64m' },
  { title: 'Pronunciation clinic', date: '2026-05-14', peak: 286, avg: 220, duration: '48m' },
  { title: 'CEFR placement walkthrough', date: '2026-05-07', peak: 510, avg: 380, duration: '72m' }
]

const CLIPS = [
  { title: '5 IELTS speaking traps to avoid', views: '12K', secs: 58 },
  { title: 'Most common pronunciation mistake', views: '8.4K', secs: 42 },
  { title: 'Quick past simple vs past perfect', views: '5.2K', secs: 50 },
  { title: 'How natives use "would"', views: '3.8K', secs: 38 }
]

export default function TeacherLiveHostPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('schedule')

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-5">
        <PageHeader
          eyebrow="Teacher · Live"
          title="Host & broadcast"
          subtitle="Go live, schedule, or post a short."
          back="/teacher"
          crumbs={[{ label: 'Teacher', to: '/teacher' }, { label: 'Live & clips' }]}
          action={
            <button className="inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-bold px-4 py-2.5 shadow-lg shadow-red-500/30">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Go live now
            </button>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value="32" label="Streams hosted" tone="brand" icon={<IconLive />} />
          <StatCard value="14.2K" label="Total watch time (h)" tone="emerald" icon={<IconStar />} />
          <StatCard value="412" label="Peak viewers" tone="amber" icon={<IconUsers />} />
          <StatCard value="4.7" label="Avg. rating" tone="violet" icon={<IconStar />} />
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'schedule' && (
          <>
            <button className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 flex flex-col items-center text-center gap-2 hover:bg-white/[0.04] transition">
              <span className="w-11 h-11 rounded-full bg-red-500/15 text-red-300 flex items-center justify-center"><IconLive className="w-5 h-5" /></span>
              <p className="text-sm font-semibold text-white">Schedule a stream</p>
              <p className="text-xs text-slate-400">Pick a date, post an announcement to followers.</p>
            </button>
            <div className="flex flex-col gap-2.5">
              {SCHEDULED.map((s) => (
                <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-4">
                  <div className="text-center w-16 shrink-0">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{s.when.split(' · ')[0]}</p>
                    <p className="text-xs font-bold text-white">{s.when.split(' · ')[1]}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                    <p className="text-[11px] text-slate-400">~{s.expected} expected</p>
                  </div>
                  <button className="btn-ghost text-xs px-3 py-1.5">Edit</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'history' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            <div className="hidden sm:grid grid-cols-[1.5fr_0.7fr_0.5fr_0.5fr_0.5fr] gap-3 px-4 py-2.5 bg-white/[0.02]">
              {['Title', 'Date', 'Peak', 'Avg.', 'Duration'].map((h) => (
                <span key={h} className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{h}</span>
              ))}
            </div>
            {PAST.map((p) => (
              <div key={p.title} className="grid grid-cols-1 sm:grid-cols-[1.5fr_0.7fr_0.5fr_0.5fr_0.5fr] gap-1 sm:gap-3 px-4 py-3 items-center">
                <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                <p className="text-xs text-slate-400">{p.date}</p>
                <p className="text-xs text-slate-300">{p.peak}</p>
                <p className="text-xs text-slate-300">{p.avg}</p>
                <p className="text-xs text-slate-300">{p.duration}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'clips' && (
          <>
            <SectionHeading title="Posted clips" subtitle="Short-form to attract followers" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CLIPS.map((c) => (
                <div key={c.title} className="text-left">
                  <div className={cn('relative rounded-2xl h-32 ring-1 ring-white/10 flex items-center justify-center bg-gradient-to-br from-violet-500/30 to-rose-500/30')}>
                    <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><IconYouTube className="w-4 h-4 text-white" /></span>
                    <span className="absolute bottom-1.5 right-1.5 text-[10px] font-bold bg-black/60 text-white rounded px-1.5 py-0.5">{c.secs}s</span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-2 line-clamp-2">{c.title}</p>
                  <p className="text-[10px] text-slate-500">{c.views} views</p>
                </div>
              ))}
              <button className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] h-32 flex flex-col items-center justify-center gap-1 hover:bg-white/[0.04]">
                <span className="text-2xl text-slate-400">+</span>
                <span className="text-[11px] text-slate-400">Add clip</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
