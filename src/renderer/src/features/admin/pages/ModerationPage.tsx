import type { Report } from '@shared/types/studio.types'
import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { studio } from '../../../services/studio/store'
import { cn } from '../../../lib/classnames'

const REASON_TINT: Record<Report['reason'], string> = {
  spam: 'bg-amber-500/15 text-amber-200',
  harassment: 'bg-rose-500/15 text-rose-200',
  inappropriate: 'bg-rose-500/15 text-rose-200',
  copyright: 'bg-violet-500/15 text-violet-200',
  misinformation: 'bg-orange-500/15 text-orange-200',
  other: 'bg-slate-500/15 text-slate-200'
}

export default function ModerationPage(): JSX.Element {
  const me = backend.currentUserId() ?? 'admin'
  const reports = useBackendQuery(() => studio.listReports('open'), [], [])

  const resolve = async (r: Report, action: 'remove' | 'dismiss' | 'warn' | 'ban'): Promise<void> => {
    await studio.resolveReport(r.id, action, me)
    reports.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Moderation</h1>
        <p className="text-sm text-slate-500 mt-0.5">{reports.data.length} open report{reports.data.length === 1 ? '' : 's'} · every action is written to the audit log.</p>
      </div>

      {reports.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] py-16 text-center text-sm text-slate-500">Queue is clear. ✨</div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.data.map((r) => (
            <div key={r.id} className="rounded-xl border border-rose-400/15 bg-rose-500/[0.04] p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md', REASON_TINT[r.reason])}>{r.reason}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{r.target.kind}</span>
                <span className="text-[11px] text-rose-300 font-semibold">{r.reportCount} report{r.reportCount === 1 ? '' : 's'}</span>
                <span className="text-[11px] text-slate-600 ml-auto">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              {r.target.preview && <p className="text-sm text-slate-200 italic line-clamp-2 mb-3">"{r.target.preview}"</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => void resolve(r, 'remove')} className="rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-3 py-1.5 text-xs font-bold">Remove content</button>
                {r.target.kind === 'user' && <button onClick={() => void resolve(r, 'ban')} className="rounded-lg bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 px-3 py-1.5 text-xs font-bold">Ban user</button>}
                <button onClick={() => void resolve(r, 'warn')} className="rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 px-3 py-1.5 text-xs font-bold">Warn</button>
                <button onClick={() => void resolve(r, 'dismiss')} className="text-xs font-semibold text-slate-400 hover:text-white px-2">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
