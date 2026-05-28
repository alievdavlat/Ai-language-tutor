import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { useTargetLanguage } from '../../lib/language'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { AvatarCircle, PageHeader, ProgressBar, SectionHeading, StatCard, Tabs, type TabItem } from '../../components/ui'
import {
  IconBolt,
  IconChat,
  IconChart,
  IconDownload,
  IconFlame,
  IconHeart,
  IconMedal,
  IconMic,
  IconStar,
  IconTrophy,
  IconUsers
} from '../../components/icons'

type Tab = 'overview' | 'certificates' | 'activity'
const TABS: TabItem<Tab>[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'activity', label: 'Activity' }
]

// 5 skill axes for the pentagon radar
const SKILLS = [
  { label: 'Pronunciation', value: 68 },
  { label: 'Fluency', value: 54 },
  { label: 'Grammar', value: 71 },
  { label: 'Intonation', value: 48 },
  { label: 'Vocabulary', value: 62 }
] as const

const CERTS = [
  { name: 'CEFR B1 Level', issuer: 'SpeakAI', date: '2026-04-12', kind: 'level', tint: 'from-brand-500 to-sky-500' },
  { name: 'English Foundations', issuer: 'James Lee', date: '2026-03-30', kind: 'course', tint: 'from-emerald-500 to-teal-500' },
  { name: 'IELTS Practice Mock', issuer: 'British Council', date: '2026-02-18', kind: 'exam', tint: 'from-rose-500 to-pink-500' }
]

const ACTIVITY = [
  { when: '2h ago', text: 'Completed Lesson: Past tenses · +30 XP', tint: 'bg-brand-500/15 text-brand-300', Icon: IconStar },
  { when: 'Yesterday', text: 'Reached Sapphire league', tint: 'bg-violet-500/15 text-violet-300', Icon: IconMedal },
  { when: '2d ago', text: 'New badge: 7-day streak', tint: 'bg-amber-500/15 text-amber-300', Icon: IconFlame },
  { when: '3d ago', text: 'Followed James Lee', tint: 'bg-sky-500/15 text-sky-300', Icon: IconUsers },
  { when: '4d ago', text: 'Scored 82% on CEFR placement', tint: 'bg-emerald-500/15 text-emerald-300', Icon: IconChart }
]

// Pentagon radar — 5 points arranged on a regular pentagon
function RadarChart({ values, labels }: { values: number[]; labels: readonly string[] }): JSX.Element {
  const size = 340
  const padX = 50 // horizontal breathing room so long labels ("Vocabulary") don't clip
  const cx = size / 2
  const cy = size / 2
  const maxR = 105
  const count = values.length
  // Start angle so first point sits at the top
  const angle = (i: number): number => -Math.PI / 2 + (i * 2 * Math.PI) / count
  const point = (i: number, r: number): [number, number] => [
    cx + r * Math.cos(angle(i)),
    cy + r * Math.sin(angle(i))
  ]
  const rings = [0.25, 0.5, 0.75, 1]
  const dataPts = values.map((v, i) => point(i, (v / 100) * maxR))
  const dataPath = dataPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`${-padX} 0 ${size + padX * 2} ${size}`} className="w-full max-w-[420px] mx-auto">
      {/* Concentric pentagons */}
      {rings.map((r) => {
        const pts = Array.from({ length: count }, (_, i) => point(i, r * maxR))
        const path = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
        return <polygon key={r} points={path} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      })}
      {/* Axes */}
      {Array.from({ length: count }, (_, i) => {
        const [x, y] = point(i, maxR)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      })}
      {/* Data shape */}
      <polygon points={dataPath} fill="rgba(37,99,235,0.28)" stroke="rgb(96,165,250)" strokeWidth={1.5} />
      {/* Data dots */}
      {dataPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill="rgb(96,165,250)" />
      ))}
      {/* Labels */}
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

function CertCard({ c }: { c: typeof CERTS[number] }): JSX.Element {
  return (
    <div className={cn('rounded-card p-5 bg-gradient-to-br ring-1 ring-white/10 relative overflow-hidden', c.tint)}>
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] uppercase tracking-widest text-white/80 font-bold">{c.kind}</p>
        <h3 className="text-lg font-bold text-white mt-1">{c.name}</h3>
        <p className="text-xs text-white/80 mt-1">Issued by {c.issuer}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-[11px] text-white/70">{c.date}</span>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/30 transition">
            <IconDownload className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage(): JSX.Element {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const lang = useTargetLanguage()
  const [tab, setTab] = useState<Tab>('overview')
  const displayName = profile?.name?.trim() || 'You'
  const level = profile?.level ?? 'B1'
  const me = backend.currentUserId()
  const counts = useBackendQuery(
    () => me ? backend.followCounts(me) : Promise.resolve({ followers: 0, following: 0 }),
    [me],
    { followers: 0, following: 0 }
  )
  const enrollments = useBackendQuery(
    () => me ? backend.myEnrollments(me) : Promise.resolve([]),
    [me],
    []
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-4xl mx-auto w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Account · Profile"
          title="Your profile"
          subtitle="Public page · stats, badges, certificates"
          back="/home"
          crumbs={[{ label: 'Home', to: '/home' }, { label: 'Profile' }]}
        />
        {/* Header */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <AvatarCircle name={displayName} size="lg" className="!w-24 !h-24 !text-3xl" />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
              <span className="inline-flex items-center rounded-full bg-brand-500/15 text-brand-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ring-1 ring-brand-400/30">
                {level}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">Learning {lang.name} {lang.flag}</p>
            <p className="text-sm text-slate-300 mt-2 max-w-md">
              Software dev practicing daily — aiming for IELTS 7.0 this year.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-400">
              <span><b className="text-white">{counts.data.following}</b> following</span>
              <span><b className="text-white">{counts.data.followers}</b> followers</span>
              <span><b className="text-white">{enrollments.data.length}</b> courses enrolled</span>
            </div>
          </div>
          <div className="flex sm:flex-col gap-2">
            <button onClick={() => navigate('/settings')} className="btn-ghost text-xs px-4 py-2">Edit profile</button>
            <button onClick={() => navigate('/account')} className="btn-ghost text-xs px-4 py-2">Account</button>
          </div>
        </div>

        {/* Top stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value="1,240" label="Total XP" tone="brand" icon={<IconBolt />} />
          <StatCard value={7} label="Day streak" tone="amber" icon={<IconFlame />} />
          <StatCard value={342} label="Words learned" tone="emerald" icon={<IconStar />} />
          <StatCard value={3} label="Certificates" tone="violet" icon={<IconTrophy />} />
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'overview' && (
          <>
            {/* Skill radar */}
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-6">
              <SectionHeading title="Proficiency" subtitle="Estimated from your last 30 days" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <RadarChart values={SKILLS.map((s) => s.value)} labels={SKILLS.map((s) => s.label)} />
                <div className="flex flex-col gap-3">
                  {SKILLS.map((s) => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-200">{s.label}</span>
                        <span className="text-xs font-bold text-brand-200">{s.value}%</span>
                      </div>
                      <ProgressBar value={s.value} color="brand" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent badges */}
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionHeading title="Recent badges" subtitle="Latest 4" />
                <button onClick={() => navigate('/achievements')} className="text-xs font-semibold text-brand-300 hover:text-brand-200">See all →</button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'First chat', Icon: IconChat, tint: 'bg-brand-500/15 text-brand-300' },
                  { name: '7-day streak', Icon: IconFlame, tint: 'bg-amber-500/15 text-amber-300' },
                  { name: 'Smooth talker', Icon: IconMic, tint: 'bg-emerald-500/15 text-emerald-300' },
                  { name: '100 words', Icon: IconHeart, tint: 'bg-pink-500/15 text-pink-300' }
                ].map((b) => (
                  <div key={b.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex flex-col items-center gap-2 text-center">
                    <span className={cn('w-11 h-11 rounded-full flex items-center justify-center', b.tint)}>
                      <b.Icon className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] font-medium text-slate-300 leading-tight">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'certificates' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CERTS.map((c) => <CertCard key={c.name} c={c} />)}
            <div className="rounded-card border border-dashed border-white/15 bg-white/[0.02] p-5 flex flex-col items-center text-center gap-2 min-h-[180px] justify-center">
              <span className="w-11 h-11 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconTrophy className="w-5 h-5" /></span>
              <p className="text-sm font-semibold text-white">Next: CEFR B2</p>
              <p className="text-xs text-slate-400">Complete the B1→B2 course to earn this</p>
              <button onClick={() => navigate('/courses')} className="text-xs font-semibold text-brand-300 hover:text-brand-200 mt-1">Browse courses →</button>
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', a.tint)}>
                  <a.Icon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{a.text}</p>
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">{a.when}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
