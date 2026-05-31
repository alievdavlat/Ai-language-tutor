import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Course, PlatformUser } from '@shared/types'
import type { Report } from '@shared/types/studio.types'
import { AvatarCircle, PageHeader, SectionHeading, StatCard, Tabs, type TabItem } from '../../components/ui'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { studio } from '../../services/studio/store'
import { cn } from '../../lib/classnames'
import {
  IconBook,
  IconChart,
  IconCheck,
  IconLock,
  IconStar,
  IconTrophy,
  IconUsers,
  IconX
} from '../../components/icons'

type Tab = 'overview' | 'approvals' | 'reports' | 'users' | 'featured' | 'log'
const TABS: TabItem<Tab>[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'reports', label: 'Moderation' },
  { id: 'users', label: 'Users' },
  { id: 'featured', label: 'Featured' },
  { id: 'log', label: 'Audit log' }
]

const REASON_TINT: Record<Report['reason'], string> = {
  spam: 'bg-amber-500/15 text-amber-200',
  harassment: 'bg-rose-500/15 text-rose-200',
  inappropriate: 'bg-rose-500/15 text-rose-200',
  copyright: 'bg-violet-500/15 text-violet-200',
  misinformation: 'bg-orange-500/15 text-orange-200',
  other: 'bg-slate-500/15 text-slate-200'
}

const CREATE_LINKS: { label: string; desc: string; to: string; emoji: string }[] = [
  { label: 'New course', desc: 'Curriculum + cover + pricing', to: '/teacher/course/new', emoji: '🎓' },
  { label: 'New lesson', desc: 'Interactive video lesson', to: '/teacher/new', emoji: '📖' },
  { label: 'New clip', desc: 'Short fill-in-the-blank clip', to: '/teacher/clips', emoji: '🎬' },
  { label: 'Creator Studio', desc: 'Bulk import + seed content', to: '/studio', emoji: '🧰' }
]

export default function AdminPage(): JSX.Element {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const me = backend.currentUserId() ?? 'admin'

  const allCourses = useBackendQuery(() => backend.listCourses(), [], [])
  const pending = useBackendQuery(async () => {
    const c = await backend.listCourses()
    return c.filter((x) => !x.publishedAt || x.reviewCount < 5)
  }, [], [])
  const reports = useBackendQuery(() => studio.listReports('open'), [], [])
  const log = useBackendQuery(() => studio.listModerationLog(), [], [])
  const featured = useBackendQuery(() => studio.listFeatured(), [], [])
  // Real user lists from the backend (was a hardcoded set of 6 ids).
  const teachers = useBackendQuery(() => backend.listUsers({ role: 'teacher' }), [], [])
  const students = useBackendQuery(() => backend.listUsers({ role: 'student' }), [], [])
  const banned = useBackendQuery(async () => {
    const ids = [...teachers.data, ...students.data].map((u) => u.id)
    const states = await Promise.all(ids.map((id) => studio.getUserModeration(id)))
    return new Set(states.filter((s) => s.banned).map((s) => s.userId))
  }, [teachers.data, students.data], new Set<string>())

  // New signups in the last 7 days, derived from real user createdAt timestamps.
  const newThisWeek = [...teachers.data, ...students.data].filter(
    (u) => Date.now() - Date.parse(u.createdAt) < 7 * 86_400_000
  ).length

  const approve = async (c: Course): Promise<void> => {
    await backend.publishCourse(c.id)
    pending.refresh(); allCourses.refresh()
  }
  const resolve = async (r: Report, action: 'remove' | 'dismiss' | 'warn' | 'ban'): Promise<void> => {
    await studio.resolveReport(r.id, action, me)
    reports.refresh(); log.refresh(); banned.refresh()
  }
  const toggleBan = async (u: PlatformUser): Promise<void> => {
    const state = await studio.getUserModeration(u.id)
    await studio.moderateUser(u.id, state.banned ? 'unban' : 'ban')
    banned.refresh()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Administration"
          title="Admin panel"
          subtitle="Approve content, moderate reports, manage users & the home feed."
          back="/home"
          crumbs={[{ label: 'Home', to: '/home' }, { label: 'Admin' }]}
          action={<span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 text-rose-200 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1"><IconLock className="w-3 h-3" /> Admin</span>}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={(teachers.data.length + students.data.length).toLocaleString()} label="Active users" tone="brand" icon={<IconUsers />} />
          <StatCard value={allCourses.data.length} label="Courses live" tone="emerald" icon={<IconBook />} />
          <StatCard value={pending.data.length} label="Pending review" tone="amber" icon={<IconStar />} />
          <StatCard value={reports.data.length} label="Open reports" tone="rose" icon={<IconChart />} />
        </div>

        {/* Create content — admin can author any content type (#A36). */}
        <div>
          <SectionHeading title="Create content" subtitle="Add real courses, lessons, clips & more to the platform" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CREATE_LINKS.map((c) => (
              <button key={c.to} onClick={() => navigate(c.to)} className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:-translate-y-0.5 transition p-4 text-left">
                <span className="text-2xl">{c.emoji}</span>
                <p className="text-sm font-bold text-white mt-2">{c.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{c.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start flex-wrap" />

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
              <SectionHeading title="This week" subtitle="Platform pulse" />
              <ul className="text-sm text-slate-300 flex flex-col gap-2">
                <li className="flex items-center justify-between"><span>New signups (7d)</span><b className="text-white">{newThisWeek}</b></li>
                <li className="flex items-center justify-between"><span>Courses awaiting review</span><b className="text-white">{pending.data.length}</b></li>
                <li className="flex items-center justify-between"><span>Open reports</span><b className="text-white">{reports.data.length}</b></li>
                <li className="flex items-center justify-between"><span>Actions taken (log)</span><b className="text-white">{log.data.length}</b></li>
                <li className="flex items-center justify-between"><span>Featured slots active</span><b className="text-white">{featured.data.filter((f) => f.active).length}</b></li>
              </ul>
            </div>
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
              <SectionHeading title="Most-reported" subtitle="Triage queue" />
              <div className="flex flex-col gap-2">
                {reports.data.slice(0, 3).map((r) => (
                  <div key={r.id} className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-xs text-slate-300">
                    <p className="text-[10px] uppercase tracking-widest text-rose-300 font-bold mb-1">{r.reason} · {r.reportCount} reports</p>
                    <p className="line-clamp-2">{r.target.preview ?? r.target.kind}</p>
                  </div>
                ))}
                {reports.data.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">Queue is clear 🎉</p>}
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
                  <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 flex items-center gap-4">
                    <div className={cn('w-16 h-12 rounded-lg bg-gradient-to-br shrink-0 ring-1 ring-white/10', c.cover)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{c.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{c.description}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Level {c.level} · {c.targetLanguage.toUpperCase()} · {c.hours}h</p>
                    </div>
                    <button onClick={() => void approve(c)} className="rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5"><IconCheck className="w-3.5 h-3.5" /> Approve</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'reports' && (
          <>
            <SectionHeading title="Moderation queue" subtitle={`${reports.data.length} open reports`} />
            {reports.data.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No open reports. Nicely moderated. ✨</p>
            ) : (
              <div className="flex flex-col gap-3">
                {reports.data.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.05] p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full', REASON_TINT[r.reason])}>{r.reason}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{r.target.kind}</span>
                      <span className="text-[11px] text-rose-300 font-semibold">{r.reportCount} report{r.reportCount === 1 ? '' : 's'}</span>
                      <span className="text-[11px] text-slate-500 ml-auto">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    {r.target.preview && <p className="text-sm text-slate-200 italic line-clamp-2 mb-3">"{r.target.preview}"</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => void resolve(r, 'remove')} className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-3 py-1.5 text-xs font-bold">Remove content</button>
                      {r.target.kind === 'user' && <button onClick={() => void resolve(r, 'ban')} className="rounded-xl bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 px-3 py-1.5 text-xs font-bold">Ban user</button>}
                      <button onClick={() => void resolve(r, 'warn')} className="rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 px-3 py-1.5 text-xs font-bold">Warn</button>
                      <button onClick={() => void resolve(r, 'dismiss')} className="text-xs font-semibold text-slate-400 hover:text-white px-2">Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'users' && (
          <>
            {[{ label: 'Teachers', list: teachers.data }, { label: 'Students', list: students.data }].map((grp) => (
              <div key={grp.label}>
                <SectionHeading title={grp.label} subtitle={`${grp.list.length} accounts`} className="mt-2" />
                <div className="flex flex-col gap-2">
                  {grp.list.map((u) => {
                    const isBanned = banned.data.has(u.id)
                    return (
                      <div key={u.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 flex items-center gap-3">
                        <AvatarCircle name={u.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{u.name} {isBanned && <span className="text-[10px] font-bold text-rose-300">· BANNED</span>}</p>
                          <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                        </div>
                        <span className={cn('inline-flex items-center rounded-full text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5', u.role === 'teacher' ? 'bg-violet-500/20 text-violet-200' : 'bg-brand-500/20 text-brand-200')}>{u.role}</span>
                        <button onClick={() => void toggleBan(u)} className={cn('text-xs font-bold', isBanned ? 'text-emerald-300 hover:text-emerald-200' : 'text-rose-300 hover:text-rose-200')}>{isBanned ? 'Unban' : 'Ban'}</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'featured' && (
          <div className="flex flex-col gap-3">
            <SectionHeading title="Home hero & ad slots" subtitle="Toggle what surfaces on the home feed" />
            {featured.data.map((f) => (
              <div key={f.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 flex items-center gap-3">
                <div className={cn('w-16 h-10 rounded-lg bg-gradient-to-br shrink-0', f.cover)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{f.title}</p>
                  <p className="text-[11px] text-slate-400">{f.kind === 'ad' ? `Sponsored · ${f.sponsor} · $${f.priceWeekUsd}/wk` : 'Course · organic'}</p>
                </div>
                <button onClick={() => void studio.toggleFeatured(f.id).then(() => featured.refresh())}
                  className={cn('relative w-11 h-6 rounded-full transition shrink-0', f.active ? 'bg-emerald-500' : 'bg-white/15')}>
                  <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition', f.active ? 'left-[22px]' : 'left-0.5')} />
                </button>
              </div>
            ))}
            <div className="rounded-card border border-dashed border-white/15 bg-white/[0.02] p-6 flex items-center gap-4">
              <span className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center"><IconTrophy className="w-6 h-6" /></span>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Sell a sponsored slot</p>
                <p className="text-xs text-slate-400">Steam-store-style banner · from $99/week · reaches 12,000+ active learners.</p>
              </div>
              <button onClick={() => void studio.upsertFeatured({ id: `feat_${Math.random().toString(36).slice(2, 8)}`, kind: 'ad', title: 'New ad campaign', cover: 'from-amber-500 to-orange-700', position: featured.data.length, active: false, sponsor: 'Sponsor', priceWeekUsd: 99 }).then(() => featured.refresh())} className="btn-primary text-xs px-4 py-2">Add slot</button>
            </div>
          </div>
        )}

        {tab === 'log' && (
          <>
            <SectionHeading title="Audit log" subtitle="Every moderation action is recorded" />
            {log.data.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No actions yet.</p>
            ) : (
              <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
                {log.data.map((e) => (
                  <div key={e.id} className="px-4 py-3 flex items-center gap-3">
                    <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full',
                      e.action === 'ban' || e.action === 'remove' ? 'bg-rose-500/15 text-rose-200' : e.action === 'warn' ? 'bg-amber-500/15 text-amber-200' : 'bg-slate-500/15 text-slate-300')}>{e.action}</span>
                    <p className="text-sm text-slate-300 flex-1 truncate">{e.target.kind} · {e.target.preview ?? e.target.id}</p>
                    <span className="text-[11px] text-slate-500">{new Date(e.at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
