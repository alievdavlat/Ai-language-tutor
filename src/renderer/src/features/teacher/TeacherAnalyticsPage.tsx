import { PageHeader, ProgressBar, SectionHeading, StatCard, Spinner } from '../../components/ui'
import { IconChart, IconStar, IconTrophy, IconUsers } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { studio } from '../../services/studio/store'

export default function TeacherAnalyticsPage(): JSX.Element {
  const me = backend.currentUserId()
  const stats = useBackendQuery(() => studio.teacherStats(me ?? undefined), [me], null)
  // Real reviews across the teacher's courses, newest first.
  const reviews = useBackendQuery<{ name: string; rating: number; text: string }[]>(
    async () => {
      if (!me) return []
      const courses = await backend.myCourses(me)
      const lists = await Promise.all(courses.map((c) => backend.listReviews(c.id)))
      const flat = lists.flat().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      const named = await Promise.all(
        flat.slice(0, 6).map(async (r) => ({
          name: (await backend.getUser(r.userId))?.name ?? 'A student',
          rating: r.rating,
          text: r.text
        }))
      )
      return named
    },
    [me],
    []
  )

  if (!stats.data) {
    return <div className="h-full grid place-items-center"><Spinner /></div>
  }
  const s = stats.data
  const maxPlays = Math.max(...s.weeklyPlays, 1)
  const reviewList = reviews.data
  const avgReview = reviewList.length
    ? (reviewList.reduce((a, r) => a + r.rating, 0) / reviewList.length).toFixed(1)
    : '—'

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Teacher · Analytics"
          title="Channel performance"
          subtitle="Live · computed from your courses, lessons & sales"
          back="/teacher"
          crumbs={[{ label: 'Teacher', to: '/teacher' }, { label: 'Analytics' }]}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={s.views.toLocaleString()} label="Total views" tone="brand" icon={<IconChart />} />
          <StatCard value={s.subscribers.toLocaleString()} label="Subscribers" tone="emerald" icon={<IconUsers />} />
          <StatCard value={`${s.avgCompletion}%`} label="Avg. completion" tone="violet" icon={<IconStar />} />
          <StatCard value={`$${s.revenueUsd.toLocaleString()}`} label="Revenue (paid)" tone="amber" icon={<IconTrophy />} />
        </div>

        {/* Plays chart */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
          <SectionHeading title="Weekly plays" subtitle="Last 12 weeks" />
          <div className="flex items-end gap-2 h-36">
            {s.weeklyPlays.map((v, i) => (
              <div key={i} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5">
                <div className="w-full rounded-t bg-gradient-to-t from-brand-700 to-brand-400 transition" style={{ height: `${(v / maxPlays) * 88}%` }} title={`${v} plays`} />
                <span className="text-[9px] text-slate-500">W{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">{s.watchTimeHours.toLocaleString()} watch-hours estimated this period.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <SectionHeading title="Top courses" subtitle="By views" />
            {s.topCourses.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No courses yet — publish one to see analytics.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {s.topCourses.map((c) => (
                  <div key={c.courseId} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                      <span className="text-xs font-bold text-amber-200">${c.revenueUsd}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-slate-400 shrink-0">{c.views.toLocaleString()} plays</span>
                      <div className="flex-1"><ProgressBar value={c.completion} color="brand" /></div>
                      <span className="text-[11px] text-slate-400 shrink-0">{c.completion}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <SectionHeading title="Audience" subtitle="By country" />
            <div className="flex flex-col gap-2.5">
              {s.audience.map((a) => (
                <div key={a.country}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-200">{a.country}</span>
                    <span className="text-xs font-bold text-brand-200">{a.pct}%</span>
                  </div>
                  <ProgressBar value={a.pct} color="brand" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
          <SectionHeading title="Latest reviews" subtitle={reviewList.length ? `${avgReview} · ${reviewList.length} review${reviewList.length === 1 ? '' : 's'}` : undefined} />
          {reviewList.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No reviews yet. They appear here as students review your courses.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {reviewList.map((r, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center gap-1 text-amber-300 text-sm">
                    {Array.from({ length: r.rating }).map((_, j) => <IconStar key={j} className="w-3.5 h-3.5" />)}
                  </div>
                  <p className="text-xs text-slate-300 mt-2 leading-snug">"{r.text}"</p>
                  <p className="text-[10px] text-slate-500 mt-2">— {r.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
