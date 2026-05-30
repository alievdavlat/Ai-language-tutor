import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ShortClip } from '@shared/types/studio.types'
import { cn } from '../../../lib/classnames'
import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { studio } from '../../../services/studio/store'
import { fetchVideoMeta, thumbnailFor } from '../../../services/studio/youtube'
import { PageHeader, SectionHeading } from '../../../components/ui'
import { IconLive, IconPlus, IconX, IconYouTube } from '../../../components/icons'

const ASPECTS: { id: ShortClip['aspect']; label: string; box: string }[] = [
  { id: '9:16', label: 'Reel / Short', box: 'w-9 h-16' },
  { id: '1:1', label: 'Square', box: 'w-12 h-12' },
  { id: '16:9', label: 'Landscape', box: 'w-16 h-9' }
]

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ClipsComposerPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('id')
  const prefillYt = params.get('yt')
  const me = backend.currentUserId() ?? 'u_anon'

  const shorts = useBackendQuery(() => studio.listShorts(me), [me], [])
  const liveStreams = useBackendQuery(() => backend.listLiveNow(), [], [])

  const [sourceKind, setSourceKind] = useState<'youtube' | 'live'>('youtube')
  const [linkInput, setLinkInput] = useState('')
  const [fetching, setFetching] = useState(false)
  const [clip, setClip] = useState<ShortClip>(() => ({
    id: `sh_${Math.random().toString(36).slice(2, 10)}`,
    teacherId: me,
    source: { source: 'youtube', youtubeId: '' },
    title: '',
    startSec: 0,
    endSec: 45,
    aspect: '9:16',
    status: 'draft',
    views: 0,
    createdAt: new Date().toISOString()
  }))
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!editId) return
    void studio.listShorts(me).then((list) => {
      const found = list.find((s) => s.id === editId)
      if (found) {
        setClip(found)
        setSourceKind(found.source.source === 'live' ? 'live' : 'youtube')
      }
    })
  }, [editId, me])

  // Prefill from a YouTube hand-off (?yt=ID) — used by the channel import flow.
  useEffect(() => {
    if (!prefillYt || editId) return
    setLinkInput(prefillYt)
    void fetchVideoMeta(prefillYt).then((meta) => {
      if (meta) setClip((c) => ({ ...c, source: { source: 'youtube', youtubeId: meta.youtubeId, title: meta.title }, title: c.title || meta.title }))
    })
  }, [prefillYt, editId])

  const ytId = clip.source.source === 'youtube' ? clip.source.youtubeId : null

  const onFetch = async (): Promise<void> => {
    setFetching(true)
    const meta = await fetchVideoMeta(linkInput)
    setFetching(false)
    if (!meta) return
    setClip((c) => ({ ...c, source: { source: 'youtube', youtubeId: meta.youtubeId, title: meta.title }, title: c.title || meta.title }))
  }

  const pickLive = (streamId: string, title: string): void => {
    setClip((c) => ({ ...c, source: { source: 'live', streamId, title }, title: c.title || `Clip · ${title}` }))
  }

  const embedSrc = useMemo(() => {
    if (!ytId) return null
    const q = new URLSearchParams({ rel: '0', modestbranding: '1', start: String(Math.floor(clip.startSec)), end: String(Math.floor(clip.endSec)) })
    return `https://www.youtube.com/embed/${ytId}?${q.toString()}`
  }, [ytId, clip.startSec, clip.endSec])

  const hasSource = (clip.source.source === 'youtube' && clip.source.youtubeId) || clip.source.source === 'live'
  const duration = Math.max(0, clip.endSec - clip.startSec)

  const save = async (publish: boolean): Promise<void> => {
    setBusy(true)
    await studio.upsertShort(clip)
    if (publish) await studio.publishShort(clip.id)
    setBusy(false)
    shorts.refresh()
    if (publish) navigate('/teacher/live')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-5">
        <PageHeader
          eyebrow="Teacher · Clips composer"
          title="Cut a short"
          subtitle="Trim a highlight from a video or a past live stream → publish as a short."
          back="/teacher/live"
          crumbs={[{ label: 'Teacher', to: '/teacher' }, { label: 'Live & clips', to: '/teacher/live' }, { label: 'Composer' }]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          {/* Editor */}
          <div className="flex flex-col gap-4">
            {/* Source picker */}
            <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-4">
              <div className="flex gap-2">
                {(['youtube', 'live'] as const).map((k) => (
                  <button key={k} onClick={() => setSourceKind(k)} className={cn('flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 transition',
                    sourceKind === k ? 'border-brand-400/40 bg-brand-500/10 text-white' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.05]')}>
                    {k === 'youtube' ? <IconYouTube className="w-4 h-4 text-red-500" /> : <IconLive className="w-4 h-4 text-rose-400" />}
                    {k === 'youtube' ? 'From a video' : 'From a live stream'}
                  </button>
                ))}
              </div>

              {sourceKind === 'youtube' ? (
                <div className="flex gap-2">
                  <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="YouTube URL or ID" className="input flex-1" />
                  <button onClick={() => void onFetch()} disabled={fetching || !linkInput.trim()} className="btn-primary px-4 disabled:opacity-50">{fetching ? '…' : 'Load'}</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {liveStreams.data.map((s) => (
                    <button key={s.id} onClick={() => pickLive(s.id, s.title)} className={cn('rounded-xl border px-3 py-2.5 text-left text-sm transition',
                      clip.source.source === 'live' && clip.source.streamId === s.id ? 'border-brand-400/40 bg-brand-500/10 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]')}>
                      <span className="font-semibold">{s.title}</span>
                      <span className="text-[11px] text-slate-500 block">{s.category} · {s.viewerCount} watched</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Trim */}
            {hasSource && (
              <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-4">
                <SectionHeading title="Trim" subtitle={`Clip length: ${fmt(duration)}`} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Start (sec)</label>
                    <input type="number" min={0} value={clip.startSec} onChange={(e) => setClip((c) => ({ ...c, startSec: Math.max(0, Number(e.target.value) || 0) }))} className="input mt-1.5" />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">End (sec)</label>
                    <input type="number" min={clip.startSec + 1} value={clip.endSec} onChange={(e) => setClip((c) => ({ ...c, endSec: Number(e.target.value) || c.startSec + 1 }))} className="input mt-1.5" />
                  </div>
                </div>
                {/* visual trim bar */}
                <div className="relative h-9 rounded-lg bg-white/[0.05] overflow-hidden">
                  <div className="absolute inset-y-0 bg-grad-brand/60" style={{ left: `${Math.min(95, (clip.startSec / (clip.endSec + 30)) * 100)}%`, width: `${Math.max(5, (duration / (clip.endSec + 30)) * 100)}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{fmt(clip.startSec)} → {fmt(clip.endSec)}</span>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Aspect ratio</label>
                  <div className="flex gap-2 mt-2">
                    {ASPECTS.map((a) => (
                      <button key={a.id} onClick={() => setClip((c) => ({ ...c, aspect: a.id }))} className={cn('rounded-xl border p-3 flex flex-col items-center gap-2 flex-1 transition',
                        clip.aspect === a.id ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]')}>
                        <span className={cn('rounded bg-slate-500/40 border border-white/20', a.box)} />
                        <span className="text-[11px] font-semibold text-slate-300">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Meta */}
            {hasSource && (
              <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-3">
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Title</label>
                  <input value={clip.title} onChange={(e) => setClip((c) => ({ ...c, title: e.target.value }))} placeholder="5 IELTS speaking traps to avoid" className="input mt-1.5" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Caption</label>
                  <textarea value={clip.caption ?? ''} onChange={(e) => setClip((c) => ({ ...c, caption: e.target.value }))} placeholder="Stop losing band points 👇" className="input mt-1.5 min-h-[60px] resize-none" />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => void save(false)} disabled={busy} className="btn-ghost px-5 py-2.5 disabled:opacity-50">Save draft</button>
                  <button onClick={() => void save(true)} disabled={busy || !clip.title.trim() || duration < 1} className="btn-primary flex-1 py-2.5 disabled:opacity-50">{busy ? 'Publishing…' : 'Publish short'}</button>
                </div>
              </div>
            )}
          </div>

          {/* Preview + existing */}
          <div className="flex flex-col gap-4">
            <div className={cn('rounded-card border border-white/10 bg-black/40 overflow-hidden mx-auto w-full', clip.aspect === '9:16' ? 'max-w-[220px]' : clip.aspect === '1:1' ? 'max-w-[300px]' : '')}>
              {embedSrc ? (
                <iframe title="preview" src={embedSrc} className={cn('w-full', clip.aspect === '9:16' ? 'aspect-[9/16]' : clip.aspect === '1:1' ? 'aspect-square' : 'aspect-video')} allow="autoplay; encrypted-media" allowFullScreen />
              ) : ytId === '' && clip.source.source === 'live' ? (
                <div className="aspect-[9/16] grid place-items-center text-slate-500 text-sm p-6 text-center"><span>Live-stream clips export server-side once recording is wired.<br /><span className="text-[11px]">(preview unavailable for live source)</span></span></div>
              ) : (
                <div className="aspect-[9/16] grid place-items-center text-slate-500 text-sm p-6 text-center">Pick a source to preview</div>
              )}
            </div>

            <div>
              <SectionHeading title="Your clips" subtitle={`${shorts.data.length} total`} />
              <div className="flex flex-col gap-2">
                {shorts.data.map((s) => {
                  const sid = s.source.source === 'youtube' ? s.source.youtubeId : null
                  return (
                    <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-violet-500/30 to-rose-500/30 shrink-0">
                        {sid && <img src={thumbnailFor(sid)} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{s.title}</p>
                        <p className="text-[10px] text-slate-500">{Math.round(s.endSec - s.startSec)}s · {s.status === 'draft' ? 'Draft' : `${s.views.toLocaleString()} views`}</p>
                      </div>
                      <button onClick={() => navigate(`/teacher/clips?id=${s.id}`)} className="text-[11px] font-semibold text-brand-300 hover:text-brand-200">Edit</button>
                      <button onClick={() => void studio.deleteShort(s.id).then(() => shorts.refresh())} className="text-rose-400/70 hover:text-rose-300"><IconX className="w-3.5 h-3.5" /></button>
                    </div>
                  )
                })}
                {shorts.data.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center text-xs text-slate-400">
                    <IconPlus className="w-5 h-5 mx-auto text-slate-500" /> No clips yet — cut your first highlight.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
