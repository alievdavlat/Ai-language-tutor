import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading, StatCard, Tabs, type TabItem } from '../../components/ui'
import { IconLive, IconPlus, IconStar, IconUsers, IconX, IconYouTube } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { studio } from '../../services/studio/store'
import { thumbnailFor } from '../../services/studio/youtube'
import { streams, useStreams, type ScheduledStream } from '../../services/streams/store'

type Tab = 'schedule' | 'history' | 'clips'
const TABS: TabItem<Tab>[] = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'history', label: 'History' },
  { id: 'clips', label: 'Clips & shorts' }
]

function fmtWhen(iso: string): { day: string; time: string } {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const day = isToday
    ? 'Today'
    : d.toDateString() === tomorrow.toDateString()
      ? 'Tomorrow'
      : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  return { day, time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }
}

interface EditorState {
  id?: string
  title: string
  date: string
  time: string
  description: string
  status: ScheduledStream['status']
  peakViewers: string
  avgViewers: string
  durationMin: string
}

function emptyEditor(): EditorState {
  const d = new Date()
  d.setHours(d.getHours() + 2, 0, 0, 0)
  return {
    title: '',
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5),
    description: '',
    status: 'scheduled',
    peakViewers: '',
    avgViewers: '',
    durationMin: ''
  }
}

function toEditor(s: ScheduledStream): EditorState {
  const d = new Date(s.whenISO)
  return {
    id: s.id,
    title: s.title,
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5),
    description: s.description ?? '',
    status: s.status,
    peakViewers: s.peakViewers != null ? String(s.peakViewers) : '',
    avgViewers: s.avgViewers != null ? String(s.avgViewers) : '',
    durationMin: s.durationMin != null ? String(s.durationMin) : ''
  }
}

export default function TeacherLiveHostPage(): JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('schedule')
  const me = backend.currentUserId()
  const shorts = useBackendQuery(() => studio.listShorts(me ?? undefined), [me], [])
  const mine = useStreams(me)
  const [editor, setEditor] = useState<EditorState | null>(null)

  const scheduled = useMemo(
    () =>
      mine.list
        .filter((s) => s.status === 'scheduled')
        .sort((a, b) => new Date(a.whenISO).getTime() - new Date(b.whenISO).getTime()),
    [mine.list]
  )
  const past = useMemo(
    () =>
      mine.list
        .filter((s) => s.status === 'done')
        .sort((a, b) => new Date(b.whenISO).getTime() - new Date(a.whenISO).getTime()),
    [mine.list]
  )

  // Real top stats — derived from the teacher's own stream history.
  const hosted = past.length
  const watchHours = Math.round(past.reduce((a, s) => a + ((s.durationMin ?? 0) * (s.avgViewers ?? 0)) / 60, 0))
  const peak = past.reduce((a, s) => Math.max(a, s.peakViewers ?? 0), 0)

  const save = async (): Promise<void> => {
    if (!editor || !me || !editor.title.trim()) return
    const whenISO = new Date(`${editor.date}T${editor.time}`).toISOString()
    const isNew = !editor.id
    streams.upsert({
      id: editor.id,
      hostId: me,
      title: editor.title.trim(),
      whenISO,
      description: editor.description.trim() || undefined,
      status: editor.status,
      peakViewers: editor.peakViewers ? Number(editor.peakViewers) : undefined,
      avgViewers: editor.avgViewers ? Number(editor.avgViewers) : undefined,
      durationMin: editor.durationMin ? Number(editor.durationMin) : undefined
    })
    // New stream → real announcement so followers see it on Home.
    if (isNew) {
      try {
        await backend.createAnnouncement({
          teacherId: me,
          title: `🔴 Live: ${editor.title.trim()}`,
          body: editor.description.trim() || 'Join the live session.',
          whenISO,
          cover: 'from-red-500 to-rose-700'
        })
      } catch {
        // announcement is best-effort
      }
    }
    setEditor(null)
    mine.refresh()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-5">
        <PageHeader
          eyebrow="Teacher · Live"
          title="Host & broadcast"
          subtitle="Go live, schedule, or cut a short."
          back="/teacher"
          crumbs={[{ label: 'Teacher', to: '/teacher' }, { label: 'Live & clips' }]}
          action={
            <button onClick={() => navigate('/live')} className="inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-bold px-4 py-2.5 shadow-lg shadow-red-500/30">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Go live now
            </button>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={String(hosted)} label="Streams hosted" tone="brand" icon={<IconLive />} />
          <StatCard value={watchHours.toLocaleString()} label="Total watch time (h)" tone="emerald" icon={<IconStar />} />
          <StatCard value={String(peak)} label="Peak viewers" tone="amber" icon={<IconUsers />} />
          <StatCard value={shorts.data.length.toString()} label="Clips posted" tone="violet" icon={<IconYouTube />} />
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'schedule' && (
          <>
            <button
              onClick={() => setEditor(emptyEditor())}
              className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 flex flex-col items-center text-center gap-2 hover:bg-white/[0.04] transition"
            >
              <span className="w-11 h-11 rounded-full bg-red-500/15 text-red-300 flex items-center justify-center"><IconLive className="w-5 h-5" /></span>
              <p className="text-sm font-semibold text-white">Schedule a stream</p>
              <p className="text-xs text-slate-400">Pick a date, post an announcement to followers.</p>
            </button>
            {scheduled.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Nothing scheduled yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {scheduled.map((s) => {
                  const w = fmtWhen(s.whenISO)
                  return (
                    <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-4">
                      <div className="text-center w-20 shrink-0">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{w.day}</p>
                        <p className="text-xs font-bold text-white">{w.time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{s.title}</p>
                        {s.description && <p className="text-[11px] text-slate-400 truncate">{s.description}</p>}
                      </div>
                      <button onClick={() => setEditor(toEditor(s))} className="btn-ghost text-xs px-3 py-1.5">Edit</button>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            <div className="hidden sm:grid grid-cols-[1.5fr_0.7fr_0.5fr_0.5fr_0.5fr] gap-3 px-4 py-2.5 bg-white/[0.02]">
              {['Title', 'Date', 'Peak', 'Avg.', 'Duration'].map((h) => (
                <span key={h} className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{h}</span>
              ))}
            </div>
            {past.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500 text-center">
                No past streams yet — host one and mark it done to build your history.
              </p>
            ) : (
              past.map((p) => (
                <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[1.5fr_0.7fr_0.5fr_0.5fr_0.5fr] gap-1 sm:gap-3 px-4 py-3 items-center">
                  <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                  <p className="text-xs text-slate-400">{new Date(p.whenISO).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-300">{p.peakViewers ?? '—'}</p>
                  <p className="text-xs text-slate-300">{p.avgViewers ?? '—'}</p>
                  <p className="text-xs text-slate-300">{p.durationMin ? `${p.durationMin}m` : '—'}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'clips' && (
          <>
            <div className="flex items-center justify-between">
              <SectionHeading title="Posted clips" subtitle="Short-form to attract followers" />
              <button onClick={() => navigate('/teacher/clips')} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"><IconPlus className="w-3.5 h-3.5" /> Compose a short</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {shorts.data.map((c) => {
                const ytId = c.source.source === 'youtube' ? c.source.youtubeId : null
                return (
                  <button key={c.id} onClick={() => navigate(`/teacher/clips?id=${c.id}`)} className="text-left group">
                    <div className={cn('relative rounded-2xl h-32 ring-1 ring-white/10 flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-500/30 to-rose-500/30')}>
                      {ytId && <img src={thumbnailFor(ytId)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition" />}
                      <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><IconYouTube className="w-4 h-4 text-white" /></span>
                      <span className="absolute bottom-1.5 right-1.5 text-[10px] font-bold bg-black/60 text-white rounded px-1.5 py-0.5">{Math.round(c.endSec - c.startSec)}s</span>
                      {c.status === 'draft' && <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-amber-500/80 text-black rounded px-1.5 py-0.5">DRAFT</span>}
                    </div>
                    <p className="text-xs font-semibold text-white mt-2 line-clamp-2">{c.title}</p>
                    <p className="text-[10px] text-slate-500">{c.views.toLocaleString()} views</p>
                  </button>
                )
              })}
              <button onClick={() => navigate('/teacher/clips')} className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] h-32 flex flex-col items-center justify-center gap-1 hover:bg-white/[0.04]">
                <span className="text-2xl text-slate-400">+</span>
                <span className="text-[11px] text-slate-400">New clip</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Schedule / edit modal */}
      {editor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6" onClick={() => setEditor(null)}>
          <div className="w-full max-w-md rounded-card border border-white/10 bg-[#0f1424] p-5 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{editor.id ? 'Edit stream' : 'Schedule a stream'}</h3>
              <button onClick={() => setEditor(null)} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 flex items-center justify-center">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Title</span>
              <input
                value={editor.title}
                onChange={(e) => setEditor({ ...editor, title: e.target.value })}
                placeholder="e.g. IELTS Speaking Q&A"
                className="rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400/60"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Date</span>
                <input
                  type="date"
                  value={editor.date}
                  onChange={(e) => setEditor({ ...editor, date: e.target.value })}
                  className="rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400/60 [color-scheme:dark]"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Time</span>
                <input
                  type="time"
                  value={editor.time}
                  onChange={(e) => setEditor({ ...editor, time: e.target.value })}
                  className="rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400/60 [color-scheme:dark]"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Description (announcement body)</span>
              <textarea
                value={editor.description}
                onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                rows={2}
                placeholder="What will the session cover?"
                className="rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400/60 resize-none"
              />
            </label>
            {editor.id && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Status</span>
                  <select
                    value={editor.status}
                    onChange={(e) => setEditor({ ...editor, status: e.target.value as ScheduledStream['status'] })}
                    className="rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-sm text-white outline-none focus:border-brand-400/60 [color-scheme:dark]"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="done">Done (move to history)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                {editor.status === 'done' && (
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      ['peakViewers', 'Peak viewers'],
                      ['avgViewers', 'Avg viewers'],
                      ['durationMin', 'Duration (min)']
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</span>
                        <input
                          type="number"
                          min={0}
                          value={editor[key]}
                          onChange={(e) => setEditor({ ...editor, [key]: e.target.value })}
                          className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-brand-400/60"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="flex items-center justify-between gap-2 pt-1">
              {editor.id ? (
                <button
                  onClick={() => { streams.remove(editor.id as string); setEditor(null); mine.refresh() }}
                  className="text-xs font-semibold text-rose-300 hover:text-rose-200"
                >
                  Delete
                </button>
              ) : <span />}
              <div className="flex items-center gap-2">
                <button onClick={() => setEditor(null)} className="btn-ghost text-xs px-4 py-2">Cancel</button>
                <button onClick={() => void save()} disabled={!editor.title.trim()} className="btn-primary text-xs px-5 py-2 disabled:opacity-40">
                  {editor.id ? 'Save changes' : 'Schedule & announce'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
