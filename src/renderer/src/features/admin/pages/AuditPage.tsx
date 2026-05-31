import { useBackendQuery } from '../../../services/backend/useBackend'
import { studio } from '../../../services/studio/store'
import { cn } from '../../../lib/classnames'

export default function AuditPage(): JSX.Element {
  const log = useBackendQuery(() => studio.listModerationLog(), [], [])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Audit log</h1>
        <p className="text-sm text-slate-500 mt-0.5">Every moderation action, newest first. {log.data.length} entr{log.data.length === 1 ? 'y' : 'ies'}.</p>
      </div>

      {log.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] py-16 text-center text-sm text-slate-500">No actions recorded yet.</div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] divide-y divide-white/[0.05] bg-white/[0.015]">
          {log.data.map((e) => (
            <div key={e.id} className="px-4 py-2.5 flex items-center gap-3">
              <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md',
                e.action === 'ban' || e.action === 'remove' ? 'bg-rose-500/15 text-rose-200' : e.action === 'warn' ? 'bg-amber-500/15 text-amber-200' : 'bg-white/[0.06] text-slate-300')}>{e.action}</span>
              <p className="text-sm text-slate-300 flex-1 truncate">{e.target.kind} · {e.target.preview ?? e.target.id}</p>
              <span className="text-[11px] text-slate-600">{new Date(e.at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
