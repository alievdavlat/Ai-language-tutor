import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, TextArea } from '../../components/ui'
import {
  IconBook,
  IconBolt,
  IconClipboard,
  IconPencilEdit,
  IconPlus,
  IconRefresh,
  IconStar,
  IconYouTube
} from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { isImageCover } from '../../lib/cover'
import { useTargetLanguage } from '../../lib/language'
import type { Course } from '@shared/types'
import {
  EXAMPLE_PAYLOAD,
  alreadySeeded,
  bulkImport,
  overview,
  parsePayload,
  seedDefaultContent,
  type ImportResult
} from '../../services/creator'

const CREATE_ACTIONS = [
  { icon: IconBook, label: 'New course', desc: 'Units, lessons, rich material, drip & pricing — all in one flow', to: '/teacher/course/new', tone: 'from-sky-500/20 to-blue-600/10 text-sky-300' },
  { icon: IconYouTube, label: 'Interactive lesson', desc: 'Video + Think / Discuss blocks', to: '/teacher/new', tone: 'from-rose-500/20 to-pink-600/10 text-rose-300' },
  { icon: IconBolt, label: 'Short / clip', desc: 'Cut a 9:16 clip from a video or stream', to: '/teacher/clips', tone: 'from-amber-500/20 to-orange-600/10 text-amber-300' },
  { icon: IconStar, label: 'Vocab deck', desc: 'Add words — or bulk-import below', to: '/vocabulary', tone: 'from-violet-500/20 to-purple-600/10 text-violet-300' },
  { icon: IconPencilEdit, label: 'Writing task', desc: 'A prompt learners draft against in the Writing Coach', to: '/writing', tone: 'from-emerald-500/20 to-teal-600/10 text-emerald-300' }
]

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-300 mt-0.5">{label}</p>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  )
}

export default function CreatorStudioPage(): JSX.Element {
  const navigate = useNavigate()
  const lang = useTargetLanguage()
  const stats = useBackendQuery(() => overview(), [], { courses: 0, publishedCourses: 0, lessons: 0, vocab: 0, drafts: 0 })
  const me = backend.currentUserId() ?? 'u_anon'
  const myCourses = useBackendQuery(() => backend.myCourses(me), [me], [] as Course[])

  const [raw, setRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seeded, setSeeded] = useState(alreadySeeded())

  const runImport = async (): Promise<void> => {
    setError(null)
    setResult(null)
    let payload
    try {
      payload = parsePayload(raw)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid JSON')
      return
    }
    setBusy(true)
    try {
      const r = await bulkImport(payload, lang.code)
      setResult(r)
      stats.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  const runSeed = async (): Promise<void> => {
    setError(null)
    setResult(null)
    setBusy(true)
    try {
      const r = await seedDefaultContent(lang.code)
      setResult(r)
      setSeeded(true)
      stats.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seeding failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Creator Studio"
          title="Build & publish content"
          subtitle="Author courses, lessons and vocab — or bulk-import and seed starter content in one click."
          action={
            <button onClick={() => navigate('/teacher/course/new')} className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-1.5">
              <IconPlus className="w-4 h-4" /> New course
            </button>
          }
        />

        {/* Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Courses" value={stats.data.courses} hint={`${stats.data.publishedCourses} published`} />
          <StatCard label="Interactive lessons" value={stats.data.lessons} />
          <StatCard label="Vocab words" value={stats.data.vocab} />
          <StatCard label="Drafts" value={stats.data.drafts} hint="unpublished" />
        </div>

        {/* Create new */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><IconPencilEdit className="w-4 h-4 text-brand-300" /> Create something new</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CREATE_ACTIONS.map((a) => {
              const Icon = a.icon
              return (
                <button key={a.label} onClick={() => navigate(a.to)} className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition p-4 text-left">
                  <span className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', a.tone)}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <p className="text-sm font-bold text-white">{a.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{a.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Your courses — edit existing content */}
        {myCourses.data.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><IconBook className="w-4 h-4 text-brand-300" /> Your courses</h2>
            <div className="flex flex-col gap-2">
              {myCourses.data.map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
                  {isImageCover(c.thumbnailUrl) ? (
                    <img src={c.thumbnailUrl} alt="" className="w-16 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <span className={cn('w-16 h-10 rounded-lg bg-gradient-to-br shrink-0', c.cover)} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{c.title}</p>
                    <p className="text-[11px] text-slate-400">{c.level} · {c.publishedAt ? 'Published' : 'Draft'} · {c.pricing.kind === 'free' ? 'Free' : c.pricing.kind === 'one-off' ? `$${c.pricing.usd}` : `$${c.pricing.usdPerMo}/mo`}</p>
                  </div>
                  <button onClick={() => navigate(`/teacher/course/new?id=${c.id}`)} className="btn-ghost text-xs px-3 py-1.5 shrink-0">Edit</button>
                  <button onClick={() => navigate(`/course/${c.id}`)} className="text-xs font-semibold text-brand-300 hover:text-brand-200 shrink-0">View →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seed default content */}
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-5 flex items-center gap-4">
          <span className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0"><IconBolt className="w-5 h-5" /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Seed default content</p>
            <p className="text-[12px] text-slate-300">
              Populate the app with starter courses, lessons and a vocab deck in {lang.name} {lang.flag} so learners have something to do on day one.
              {seeded && <span className="text-emerald-300 font-semibold"> · Already seeded ✓</span>}
            </p>
          </div>
          <button onClick={() => void runSeed()} disabled={busy} className="btn-ghost px-4 py-2 text-sm shrink-0 disabled:opacity-50">
            {busy ? 'Working…' : seeded ? 'Seed again' : 'Seed now'}
          </button>
        </div>

        {/* Bulk import */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2"><IconClipboard className="w-4 h-4 text-brand-300" /> Bulk import (JSON)</h2>
            <button onClick={() => setRaw(EXAMPLE_PAYLOAD)} className="text-xs font-semibold text-brand-300 hover:text-brand-200">Load example</button>
          </div>
          <p className="text-[12px] text-slate-400 mb-3">
            Paste a JSON object with <code className="text-slate-200">{'"courses"'}</code> and/or <code className="text-slate-200">{'"vocab"'}</code> arrays. Each course can carry nested units &amp; lessons.
          </p>
          <TextArea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            placeholder={EXAMPLE_PAYLOAD}
            className="font-mono text-[12px]"
          />
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => void runImport()} disabled={busy || !raw.trim()} className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-1.5 disabled:opacity-50">
              <IconRefresh className="w-4 h-4" /> {busy ? 'Importing…' : 'Import'}
            </button>
            {error && <span className="text-[12px] text-rose-400 font-medium">⚠ {error}</span>}
          </div>

          {result && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-bold text-white mb-1">Imported ✓</p>
              <p className="text-[12px] text-slate-300">
                {result.courses} course(s) · {result.units} unit(s) · {result.lessons} lesson(s) · {result.vocab} word(s)
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 text-[11px] text-amber-300 list-disc list-inside">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => navigate('/courses')} className="text-xs font-semibold text-brand-300 hover:text-brand-200">View in Courses →</button>
                <button onClick={() => navigate('/vocabulary')} className="text-xs font-semibold text-brand-300 hover:text-brand-200">View in Vocabulary →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
