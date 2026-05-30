import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Course } from '@shared/types'
import type { DownloadItem } from '@shared/types/studio.types'
import { cn } from '../../lib/classnames'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { studio } from '../../services/studio/store'
import { PageHeader, ProgressBar, SectionHeading, StatCard } from '../../components/ui'
import { IconCheck, IconDownload, IconRefresh, IconX } from '../../components/icons'

const STATUS_TINT: Record<DownloadItem['status'], string> = {
  queued: 'text-slate-400',
  downloading: 'text-brand-300',
  ready: 'text-emerald-300',
  error: 'text-rose-300',
  expired: 'text-amber-300'
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.round(diff / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export default function DownloadsPage(): JSX.Element {
  const navigate = useNavigate()
  const downloads = useBackendQuery(() => studio.listDownloads(), [], [])
  const sync = useBackendQuery(() => studio.syncState(), [], null)
  const enrolled = useBackendQuery(async () => {
    const me = backend.currentUserId()
    if (!me) return [] as Course[]
    const ens = await backend.myEnrollments(me)
    const cs = await Promise.all(ens.map((e) => backend.getCourse(e.courseId)))
    return cs.filter((c): c is Course => !!c)
  }, [], [] as Course[])
  const [syncing, setSyncing] = useState(false)

  // Animate in-flight downloads.
  useEffect(() => {
    const anyDownloading = downloads.data.some((d) => d.status === 'downloading')
    if (!anyDownloading) return
    const t = setInterval(() => {
      const stillGoing = studio.tickDownloads()
      downloads.refresh()
      if (!stillGoing) clearInterval(t)
    }, 700)
    return () => clearInterval(t)
  }, [downloads.data])

  const addCourse = async (c: Course): Promise<void> => {
    await studio.addDownload('course', c.id, c.title, Math.round(c.hours * 22))
    downloads.refresh()
  }
  const doSync = async (): Promise<void> => {
    setSyncing(true)
    await studio.syncNow()
    setSyncing(false)
    sync.refresh()
  }

  const readyCount = downloads.data.filter((d) => d.status === 'ready').length
  const totalMb = downloads.data.reduce((a, d) => a + (d.status === 'ready' ? d.sizeMb : 0), 0)
  const notDownloaded = enrolled.data.filter((c) => !downloads.data.some((d) => d.refId === c.id))

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Library · Offline"
          title="Downloads & sync"
          subtitle="Learn offline on the train, sync your progress across devices."
          back="/home"
          crumbs={[{ label: 'Home', to: '/home' }, { label: 'Downloads' }]}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={readyCount.toString()} label="Available offline" tone="emerald" icon={<IconDownload />} />
          <StatCard value={`${(totalMb / 1024).toFixed(1)} GB`} label="Storage used" tone="brand" />
          <StatCard value={(sync.data?.devices.length ?? 1).toString()} label="Synced devices" tone="violet" icon={<IconRefresh />} />
          <StatCard value={sync.data?.lastSyncedAt ? relTime(sync.data.lastSyncedAt) : 'never'} label="Last sync" tone="amber" />
        </div>

        {/* Downloads list */}
        <div>
          <SectionHeading title="Downloaded" subtitle="Tap to open · expires for rentals" />
          <div className="flex flex-col gap-2">
            {downloads.data.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No downloads yet. Add an enrolled course below.</p>}
            {downloads.data.map((d) => (
              <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-3.5 flex items-center gap-3">
                <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', d.status === 'ready' ? 'bg-emerald-500/15' : 'bg-white/[0.06]')}>
                  {d.status === 'ready' ? <IconCheck className="w-5 h-5 text-emerald-300" /> : <IconDownload className="w-5 h-5 text-brand-300" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{d.title}</p>
                  {d.status === 'downloading' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1"><ProgressBar value={d.progress} color="brand" /></div>
                      <span className="text-[11px] text-brand-300 shrink-0">{d.progress}%</span>
                    </div>
                  ) : (
                    <p className={cn('text-[11px] capitalize', STATUS_TINT[d.status])}>
                      {d.status} · {d.sizeMb} MB{d.expiresAt ? ` · rental expires ${new Date(d.expiresAt).toLocaleDateString()}` : ''}
                    </p>
                  )}
                </div>
                <button onClick={() => void studio.removeDownload(d.id).then(() => downloads.refresh())} className="text-slate-500 hover:text-rose-300"><IconX className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Add downloads */}
        {notDownloaded.length > 0 && (
          <div>
            <SectionHeading title="Make available offline" subtitle="Your enrolled courses" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notDownloaded.map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 flex items-center gap-3">
                  <div className={cn('w-14 h-10 rounded-lg bg-gradient-to-br shrink-0', c.cover)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                    <p className="text-[11px] text-slate-500">~{Math.round(c.hours * 22)} MB</p>
                  </div>
                  <button onClick={() => void addCourse(c)} className="btn-ghost text-xs px-3 py-1.5 inline-flex items-center gap-1"><IconDownload className="w-3.5 h-3.5" /> Download</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync */}
        {sync.data && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <div className="flex items-center justify-between">
              <SectionHeading title="Cross-device sync" subtitle={`${sync.data.pendingChanges} items ready to mirror`} />
              <button onClick={() => void doSync()} disabled={syncing} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-50">
                <IconRefresh className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} /> {syncing ? 'Syncing…' : 'Sync now'}
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {sync.data.devices.map((dv) => (
                <div key={dv.id} className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0">
                  <span className={cn('w-2 h-2 rounded-full', dv.current ? 'bg-emerald-400' : 'bg-slate-500')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{dv.name} {dv.current && <span className="text-[10px] font-bold text-emerald-300">· THIS DEVICE</span>}</p>
                    <p className="text-[11px] text-slate-500">{dv.platform}</p>
                  </div>
                  <span className="text-[11px] text-slate-500">{relTime(dv.lastSeenAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={() => navigate('/courses')} className="btn-ghost text-sm px-4 py-2 self-center">Browse more courses to download</button>
      </div>
    </div>
  )
}
