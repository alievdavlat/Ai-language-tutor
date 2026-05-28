import { useState } from 'react'
import type { Course, PlatformUser, Post } from '@shared/types'
import { AvatarCircle, PageHeader, SectionHeading, StatCard, Tabs, type TabItem } from '../../components/ui'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { cn } from '../../lib/classnames'
import {
  IconArrowRight,
  IconBook,
  IconChart,
  IconCheck,
  IconChat,
  IconLock,
  IconStar,
  IconTrophy,
  IconUsers,
  IconX
} from '../../components/icons'

type Tab = 'overview' | 'approvals' | 'users' | 'featured' | 'reports'
const TABS: TabItem<Tab>[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'approvals', label: 'Approval queue' },
  { id: 'users', label: 'Users' },
  { id: 'featured', label: 'Featured' },
  { id: 'reports', label: 'Reports' }
]

function CourseRow({ c, onApprove, onReject }: { c: Course; onApprove: () => void; onReject: () => void }): JSX.Element {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 flex items-center gap-4">
      <div className={cn('w-16 h-12 rounded-lg bg-gradient-to-br shrink-0 ring-1 ring-white/10', c.cover)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{c.title}</p>
        <p className="text-[11px] text-slate-400 line-clamp-1">{c.description}</p>
        <p className="text-[10px] text-slate-500 mt-1">Level {c.level} · {c.targetLanguage.toUpperCase()} · {c.hours}h</p>
      </div>
      <button onClick={onReject} className="rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5">
        <IconX className="w-3.5 h-3.5" /> Reject
      </button>
      <button onClick={onApprove} className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5">
        <IconCheck className="w-3.5 h-3.5" /> Approve
      </button>
    </div>
  )
}

function UserRow({ u, onBan }: { u: PlatformUser; onBan: () => void }): JSX.Element {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 flex items-center gap-3">
      <AvatarCircle name={u.name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">
          {u.name} <span className="text-base">{u.country ? `${u.country}` : ''}</span>
        </p>
        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
      </div>
      <span className={cn(
        'inline-flex items-center rounded-full text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5',
        u.role === 'teacher' ? 'bg-violet-500/20 text-violet-200' : 'bg-brand-500/20 text-brand-200'
      )}>{u.role}</span>
      <button onClick={onBan} className="text-xs font-bold text-rose-300 hover:text-rose-200">Ban</button>
    </div>
  )
}

function ReportRow({ post, author }: { post: Post; author: PlatformUser | null }): JSX.Element {
  return (
    <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-4">
      <div className="flex items-center gap-3 mb-2">
        <AvatarCircle name={author?.name ?? '?'} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{author?.name ?? 'Unknown'}</p>
          <p className="text-[10px] text-rose-300">Reported by 3 users · spam / off-topic</p>
        </div>
        <button className="text-xs font-semibold text-slate-300 hover:text-white">Dismiss</button>
        <button className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-3 py-1.5 text-xs font-bold">Remove</button>
      </div>
      <p className="text-xs text-slate-300 line-clamp-2 italic">"{post.text}"</p>
    </div>
  )
}

export default function AdminPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('overview')
  const allCourses = useBackendQuery(() => backend.listCourses(), [], [])
  // Treat any course without publishedAt OR with low engagement as "needs review".
  const pending = useBackendQuery(async () => {
    const c = await backend.listCourses()
    return c.filter((x) => !x.publishedAt || x.reviewCount < 5)
  }, [], [])
  // Use seed posts as the "reports" feed — every flagged post would surface here.
  const feed = useBackendQuery(() => backend.listFeed({ limit: 5 }), [], [])
  // Pull a couple of seed users to render the Users tab.
  const teachers = useBackendQuery(async () => {
    const ids = ['u_emma', 'u_james', 'u_marco']
    const r = await Promise.all(ids.map((id) => backend.getUser(id)))
    return r.filter((u): u is PlatformUser => u !== null)
  }, [], [])
  const students = useBackendQuery(async () => {
    const ids = ['u_priya', 'u_wei', 'u_yui']
    const r = await Promise.all(ids.map((id) => backend.getUser(id)))
    return r.filter((u): u is PlatformUser => u !== null)
  }, [], [])

  const totalCourses = allCourses.data.length
  const totalUsers = teachers.data.length + students.data.length
  const totalReports = feed.data.length

  const approve = async (c: Course): Promise<void> => {
    await backend.publishCourse(c.id)
    pending.refresh()
    allCourses.refresh()
  }
  const reject = async (_c: Course): Promise<void> => {
    // Mock: just remove from queue. Real impl would set a 'rejected' flag.
    pending.refresh()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Administration"
          title="Admin panel"
          subtitle="Approve content, moderate users, curate the home feed."
          back="/home"
          crumbs={[{ label: 'Home', to: '/home' }, { label: 'Admin' }]}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 text-rose-200 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
              <IconLock className="w-3 h-3" /> Admin
            </span>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={totalUsers.toLocaleString()} label="Active users" tone="brand" icon={<IconUsers />} />
          <StatCard value={totalCourses} label="Courses live" tone="emerald" icon={<IconBook />} />
          <StatCard value={pending.data.length} label="Pending review" tone="amber" icon={<IconStar />} />
          <StatCard value={totalReports} label="Open reports" tone="rose" icon={<IconChart />} />
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
              <SectionHeading title="This week" subtitle="Platform pulse" />
              <ul className="text-sm text-slate-300 flex flex-col gap-2">
                <li className="flex items-center justify-between"><span>New signups</span><b className="text-white">+218</b></li>
                <li className="flex items-center justify-between"><span>New courses submitted</span><b className="text-white">+{pending.data.length}</b></li>
                <li className="flex items-center justify-between"><span>Active learners (7d)</span><b className="text-white">1,420</b></li>
                <li className="flex items-center justify-between"><span>Posts created</span><b className="text-white">+{feed.data.length * 12}</b></li>
                <li className="flex items-center justify-between"><span>Live streams hosted</span><b className="text-white">38</b></li>
              </ul>
            </div>
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
              <SectionHeading title="Top reports today" subtitle={`${totalReports} flagged items`} />
              <div className="flex flex-col gap-2">
                {feed.data.slice(0, 3).map((p) => (
                  <div key={p.id} className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-xs text-slate-300">
                    <p className="text-[10px] uppercase tracking-widest text-rose-300 font-bold mb-1">spam · 3 reports</p>
                    <p className="line-clamp-2">{p.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'approvals' && (
          <>
            <SectionHeading title="Courses waiting for review" subtitle={`${pending.data.length} pending`} />
            {pending.data.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Nothing to review · queue is empty.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pending.data.map((c) => (
                  <CourseRow key={c.id} c={c} onApprove={() => void approve(c)} onReject={() => void reject(c)} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'users' && (
          <>
            <SectionHeading title="Teachers" subtitle={`${teachers.data.length} accounts`} />
            <div className="flex flex-col gap-2">
              {teachers.data.map((u) => <UserRow key={u.id} u={u} onBan={() => undefined} />)}
            </div>
            <SectionHeading title="Students" subtitle={`${students.data.length} accounts shown`} className="mt-3" />
            <div className="flex flex-col gap-2">
              {students.data.map((u) => <UserRow key={u.id} u={u} onBan={() => undefined} />)}
            </div>
          </>
        )}

        {tab === 'featured' && (
          <div className="flex flex-col gap-3">
            <SectionHeading title="Home hero carousel" subtitle="Pick up to 4 cards shown on the home feed" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allCourses.data.slice(0, 6).map((c) => (
                <label key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 flex items-center gap-3 cursor-pointer hover:bg-white/[0.04]">
                  <input type="checkbox" defaultChecked={c.enrollmentCount > 3000} className="accent-brand-500" />
                  <div className={cn('w-14 h-10 rounded-lg bg-gradient-to-br shrink-0', c.cover)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{c.title}</p>
                    <p className="text-[11px] text-slate-400 inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-amber-300"><IconStar className="w-3 h-3" /> {c.rating.toFixed(1)}</span>
                      <span>{c.enrollmentCount.toLocaleString()} learners</span>
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <SectionHeading title="Sponsored slots" subtitle="Steam-store-style banner on home" className="mt-4" />
            <div className="rounded-card border border-dashed border-white/15 bg-white/[0.02] p-6 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center"><IconTrophy className="w-6 h-6" /></span>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">No live ad campaigns</p>
                <p className="text-xs text-slate-400">Slot rentals start at $99/week. Reach 12,000+ active learners.</p>
              </div>
              <button className="btn-primary text-xs px-4 py-2">Sell a slot</button>
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <>
            <SectionHeading title="Open reports" subtitle="Triage flagged posts and live streams" />
            <div className="flex flex-col gap-3">
              {feed.data.map((p) => (
                <ReportRow key={p.id} post={p} author={teachers.data.concat(students.data).find((u) => u.id === p.authorId) ?? null} />
              ))}
            </div>
            <button className="btn-ghost text-xs px-4 py-2 self-center inline-flex items-center gap-1.5">View ban appeals <IconArrowRight className="w-3.5 h-3.5" /></button>
          </>
        )}
      </div>
    </div>
  )
}
