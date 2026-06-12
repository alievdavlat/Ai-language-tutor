import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { useTargetLanguage } from '../../lib/language'
import { backend } from '../../services/backend/useBackend'
import { social, meId, ensureLearnerSeed } from '../../services/backend/social'
import { timeAgo } from '../../lib/time'
import { downloadProfileCertificate } from '../../lib/certificate'
import { AvatarCircle, PageHeader, ProgressBar, SectionHeading, StatCard, Tabs, type TabItem } from '../../components/ui'
import {
  IconBolt,
  IconBook,
  IconChart,
  IconDownload,
  IconFlame,
  IconMedal,
  IconMic,
  IconStar,
  IconTrophy,
  IconUsers,
  type IconProps
} from '../../components/icons'
import type {
  ActivityEvent,
  Badge,
  Certificate,
  SkillRadar,
  UserStats
} from '@shared/types'

type Tab = 'overview' | 'certificates' | 'activity'
const TABS: TabItem<Tab>[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'activity', label: 'Activity' }
]

const SKILL_LABELS = ['Pronunciation', 'Fluency', 'Grammar', 'Intonation', 'Vocabulary'] as const

// Pentagon radar — 5 points on a regular pentagon.
function RadarChart({ values, labels }: { values: number[]; labels: readonly string[] }): JSX.Element {
  const size = 340
  const padX = 50
  const cx = size / 2
  const cy = size / 2
  const maxR = 105
  const count = values.length
  const angle = (i: number): number => -Math.PI / 2 + (i * 2 * Math.PI) / count
  const point = (i: number, r: number): [number, number] => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))]
  const rings = [0.25, 0.5, 0.75, 1]
  const dataPts = values.map((v, i) => point(i, (v / 100) * maxR))
  const dataPath = dataPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`${-padX} 0 ${size + padX * 2} ${size}`} className="w-full max-w-[420px] mx-auto">
      {rings.map((r) => {
        const pts = Array.from({ length: count }, (_, i) => point(i, r * maxR))
        const path = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
        return <polygon key={r} points={path} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      })}
      {Array.from({ length: count }, (_, i) => {
        const [x, y] = point(i, maxR)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      })}
      <polygon points={dataPath} fill="rgba(37,99,235,0.28)" stroke="rgb(96,165,250)" strokeWidth={1.5} />
      {dataPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill="rgb(96,165,250)" />
      ))}
      {labels.map((l, i) => {
        const [lx, ly] = point(i, maxR + 22)
        return (
          <text
            key={l}
            x={lx}
            y={ly}
            fill="rgb(203,213,225)"
            fontSize={11}
            fontWeight={600}
            textAnchor={Math.abs(lx - cx) < 5 ? 'middle' : lx > cx ? 'start' : 'end'}
            dominantBaseline={ly < cy - 5 ? 'alphabetic' : ly > cy + 5 ? 'hanging' : 'middle'}
          >
            {l}
          </text>
        )
      })}
    </svg>
  )
}

function CertCard({ c, learnerName }: { c: Certificate; learnerName: string }): JSX.Element {
  return (
    <div className={cn('rounded-card p-5 bg-gradient-to-br ring-1 ring-white/10 relative overflow-hidden', c.cover)}>
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] uppercase tracking-widest text-white/80 font-bold">{c.source}</p>
        <h3 className="text-lg font-bold text-white mt-1">{c.title}</h3>
        <p className="text-xs text-white/80 mt-1">{c.detail}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] text-white/70">{new Date(c.issuedAt).toLocaleDateString()}</span>
          <button
            onClick={() => downloadProfileCertificate(c, learnerName)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/30 transition"
          >
            <IconDownload className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>
    </div>
  )
}

const ACTIVITY_META: Record<string, { Icon: (p: IconProps) => JSX.Element; tint: string; label: (e: ActivityEvent) => string }> = {
  lesson_complete: { Icon: IconStar, tint: 'bg-brand-500/15 text-brand-300', label: (e) => `Completed a lesson${e.xp ? ` · +${e.xp} XP` : ''}` },
  word_learned: { Icon: IconBook, tint: 'bg-emerald-500/15 text-emerald-300', label: (e) => `Learned new words${typeof e.meta?.count === 'number' ? ` (${e.meta.count})` : ''}` },
  practice_session: { Icon: IconChart, tint: 'bg-sky-500/15 text-sky-300', label: (e) => `Practice session${e.minutes ? ` · ${e.minutes} min` : ''}` },
  speaking_session: { Icon: IconMic, tint: 'bg-violet-500/15 text-violet-300', label: (e) => `Speaking session${e.minutes ? ` · ${e.minutes} min` : ''}` },
  exam_attempt: { Icon: IconChart, tint: 'bg-amber-500/15 text-amber-300', label: () => 'Took an exam' },
  streak_day: { Icon: IconFlame, tint: 'bg-amber-500/15 text-amber-300', label: () => 'Kept the streak alive' },
  achievement: { Icon: IconMedal, tint: 'bg-violet-500/15 text-violet-300', label: () => 'Unlocked an achievement' },
  course_enroll: { Icon: IconUsers, tint: 'bg-brand-500/15 text-brand-300', label: () => 'Enrolled in a course' },
  custom: { Icon: IconBolt, tint: 'bg-white/10 text-slate-300', label: () => 'Activity' }
}

export default function ProfilePage(): JSX.Element {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const lang = useTargetLanguage()
  const me = meId()
  const [tab, setTab] = useState<Tab>('overview')
  const displayName = profile?.name?.trim() || 'You'
  const level = profile?.level ?? 'B1'

  const [stats, setStats] = useState<UserStats | null>(null)
  const [radar, setRadar] = useState<SkillRadar | null>(null)
  const [certs, setCerts] = useState<Certificate[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [counts, setCounts] = useState({ followers: 0, following: 0 })
  const [enrollCount, setEnrollCount] = useState(0)

  const load = useCallback(async () => {
    const [s, r, c, b, a, fc, enr] = await Promise.all([
      backend.getStats(me),
      social.getSkillRadar(me),
      social.listCertificates(me),
      social.listBadges(me),
      backend.listActivity(me, { limit: 30 }),
      backend.followCounts(me),
      backend.myEnrollments(me)
    ])
    setStats(s)
    setRadar(r)
    setCerts(c)
    setBadges(b)
    setActivity(a)
    setCounts(fc)
    setEnrollCount(enr.length)
  }, [me])

  useEffect(() => {
    void ensureLearnerSeed(me).then(load)
  }, [me, load])

  const radarValues = radar
    ? [radar.pronunciation, radar.fluency, radar.grammar, radar.intonation, radar.vocabulary]
    : [0, 0, 0, 0, 0]
  const earnedBadges = badges.filter((b) => b.earned)
  const recentBadges = (earnedBadges.length > 0 ? earnedBadges : badges).slice(0, 4)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Account · Profile"
          title="Your profile"
          subtitle="Public page · stats, badges, certificates"
          back="/home"
          crumbs={[{ label: 'Home', to: '/home' }, { label: 'Profile' }]}
        />

        {/* Header */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <AvatarCircle name={displayName} src={profile?.avatarUrl} size="lg" className="!w-24 !h-24 !text-3xl" />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              <span className="inline-flex items-center rounded-full bg-brand-500/15 text-brand-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ring-1 ring-brand-400/30">
                {level}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">Learning {lang.name} {lang.flag}</p>
            {profile?.name && <p className="text-sm text-slate-300 mt-2 max-w-md">Practicing daily to level up.</p>}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-400">
              <span><b className="text-white">{counts.following}</b> following</span>
              <span><b className="text-white">{counts.followers}</b> followers</span>
              <span><b className="text-white">{enrollCount}</b> courses enrolled</span>
            </div>
          </div>
          <div className="flex sm:flex-col gap-2">
            <button onClick={() => navigate('/settings')} className="btn-ghost text-xs px-4 py-2">Edit profile</button>
            <button onClick={() => navigate('/account')} className="btn-ghost text-xs px-4 py-2">Account</button>
          </div>
        </div>

        {/* Top stats row — real */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={(stats?.xp ?? 0).toLocaleString()} label="Total XP" tone="brand" icon={<IconBolt />} />
          <StatCard value={stats?.streak ?? 0} label="Day streak" tone="amber" icon={<IconFlame />} />
          <StatCard value={stats?.wordsLearned ?? 0} label="Words learned" tone="emerald" icon={<IconStar />} />
          <StatCard value={certs.length} label="Certificates" tone="violet" icon={<IconTrophy />} />
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'overview' && (
          <>
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-6">
              <SectionHeading title="Proficiency" subtitle="Estimated from your activity & exams" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <RadarChart values={radarValues} labels={SKILL_LABELS} />
                <div className="flex flex-col gap-3">
                  {SKILL_LABELS.map((label, i) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-200">{label}</span>
                        <span className="text-xs font-bold text-brand-200">{radarValues[i]}%</span>
                      </div>
                      <ProgressBar value={radarValues[i]} color="brand" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionHeading title="Badges" subtitle={`${earnedBadges.length} earned`} />
                <button onClick={() => navigate('/achievements')} className="text-xs font-semibold text-brand-300 hover:text-brand-200">See all →</button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {recentBadges.map((b) => (
                  <div
                    key={b.id}
                    className={cn(
                      'rounded-2xl border p-3 flex flex-col items-center gap-2 text-center',
                      b.earned ? 'border-white/10 bg-white/[0.03]' : 'border-white/[0.06] bg-white/[0.015] opacity-60'
                    )}
                  >
                    <span className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center text-2xl">{b.emoji}</span>
                    <span className="text-[11px] font-medium text-slate-300 leading-tight">{b.title}</span>
                    {!b.earned && <div className="w-full"><ProgressBar value={b.progress} color="brand" /></div>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'certificates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certs.map((c) => <CertCard key={c.id} c={c} learnerName={displayName} />)}
            <div className="rounded-card border border-dashed border-white/15 bg-white/[0.02] p-5 flex flex-col items-center text-center gap-2 min-h-[180px] justify-center">
              <span className="w-11 h-11 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconTrophy className="w-5 h-5" /></span>
              <p className="text-sm font-semibold text-white">{certs.length === 0 ? 'No certificates yet' : 'Earn more'}</p>
              <p className="text-xs text-slate-400">Finish a course or take an exam to earn a certificate.</p>
              <button onClick={() => navigate('/courses')} className="text-xs font-semibold text-brand-300 hover:text-brand-200 mt-1">Browse courses →</button>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            {activity.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500 text-center">No activity yet — start a lesson or a conversation.</p>
            ) : (
              activity.map((a) => {
                const meta = ACTIVITY_META[a.kind] ?? ACTIVITY_META.custom
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', meta.tint)}>
                      <meta.Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200">{meta.label(a)}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0">{timeAgo(a.createdAt)}</span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
