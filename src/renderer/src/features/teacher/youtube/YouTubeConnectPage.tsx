import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { VideoMeta } from '../../../services/studio/youtube'
import { cn } from '../../../lib/classnames'
import { studio } from '../../../services/studio/store'
import {
  connectChannel,
  fetchVideoMeta,
  importChannelVideos,
  thumbnailFor,
  youtubeConfigured,
  youtubeApiKeyConfigured
} from '../../../services/studio/youtube'
import { PageHeader, SectionHeading, Spinner } from '../../../components/ui'
import { IconCheck, IconPlus, IconYouTube } from '../../../components/icons'
import { useBackendQuery } from '../../../services/backend/useBackend'

export default function YouTubeConnectPage(): JSX.Element {
  const navigate = useNavigate()
  const conn = useBackendQuery(() => studio.youtubeConnection(), [], null)
  const videos = useBackendQuery(() => studio.listImportedVideos(), [], [])
  const [connecting, setConnecting] = useState(false)
  const [importing, setImporting] = useState(false)

  // paste-a-link metadata demo
  const [link, setLink] = useState('')
  const [meta, setMeta] = useState<VideoMeta | null>(null)
  const [metaLoading, setMetaLoading] = useState(false)

  const connect = async (): Promise<void> => {
    setConnecting(true)
    const c = await connectChannel()
    studio.setYouTubeConnection(c)
    setConnecting(false)
    conn.refresh()
  }
  const disconnect = async (): Promise<void> => {
    await studio.disconnectYouTube()
    conn.refresh()
    videos.refresh()
  }
  const doImport = async (): Promise<void> => {
    if (!conn.data?.connected) return
    setImporting(true)
    const list = await importChannelVideos(conn.data)
    studio.setImportedVideos(list)
    setImporting(false)
    videos.refresh()
  }
  const fetchMeta = async (): Promise<void> => {
    setMetaLoading(true)
    setMeta(await fetchVideoMeta(link))
    setMetaLoading(false)
  }

  if (!conn.data) return <div className="h-full grid place-items-center"><Spinner /></div>
  const connected = conn.data.connected

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-5">
        <PageHeader
          eyebrow="Teacher · Integrations"
          title="YouTube channel"
          subtitle="Connect your channel, import videos, or turn any link into a lesson."
          back="/teacher"
          crumbs={[{ label: 'Teacher', to: '/teacher' }, { label: 'YouTube' }]}
        />

        {/* Connection card */}
        <div className={cn('rounded-card border p-5 flex items-center gap-4', connected ? 'border-emerald-400/25 bg-emerald-500/[0.06]' : 'border-white/10 bg-white/[0.025]')}>
          <span className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0', connected ? 'bg-emerald-500/15' : 'bg-red-500/15')}>
            {connected && conn.data.thumbnail
              ? <img src={conn.data.thumbnail} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              : <IconYouTube className="w-7 h-7 text-red-500" />}
          </span>
          <div className="flex-1 min-w-0">
            {connected ? (
              <>
                <p className="text-base font-bold text-white inline-flex items-center gap-2">{conn.data.channelTitle} <IconCheck className="w-4 h-4 text-emerald-300" /></p>
                <p className="text-xs text-slate-400">{conn.data.subscriberCount?.toLocaleString()} subscribers · connected {conn.data.connectedAt ? new Date(conn.data.connectedAt).toLocaleDateString() : ''}</p>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-white">Not connected</p>
                <p className="text-xs text-slate-400">Sign in with Google to import your channel's videos.</p>
              </>
            )}
          </div>
          {connected ? (
            <button onClick={() => void disconnect()} className="btn-ghost text-xs px-4 py-2">Disconnect</button>
          ) : (
            <button onClick={() => void connect()} disabled={connecting} className="inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-bold px-4 py-2.5 disabled:opacity-50">
              <IconYouTube className="w-4 h-4" /> {connecting ? 'Connecting…' : 'Connect channel'}
            </button>
          )}
        </div>

        {!youtubeConfigured && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3 text-xs text-amber-200/90">
            ⚙️ Running in <b>demo mode</b> — set <code className="text-amber-100">VITE_YT_CLIENT_ID</code>{!youtubeApiKeyConfigured && <> and <code className="text-amber-100">VITE_YT_API_KEY</code></>} in <code>.env.local</code> for the real Google OAuth flow. See <code>docs/YOUTUBE-OAUTH.md</code>.
          </div>
        )}

        {/* Import */}
        {connected && (
          <div>
            <div className="flex items-center justify-between">
              <SectionHeading title="Channel videos" subtitle={videos.data.length ? `${videos.data.length} imported` : 'Import to use as lesson or clip sources'} />
              <button onClick={() => void doImport()} disabled={importing} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{importing ? 'Importing…' : videos.data.length ? 'Re-sync' : 'Import videos'}</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {videos.data.map((v) => (
                <div key={v.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 flex gap-3">
                  <img src={v.thumbnail || thumbnailFor(v.id)} alt="" className="w-28 h-16 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="text-sm font-semibold text-white line-clamp-2">{v.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{v.viewCount.toLocaleString()} views</p>
                    <div className="flex gap-2 mt-auto pt-2">
                      <button onClick={() => { studio.markVideoImported(v.id); navigate(`/teacher/new?yt=${v.id}`) }} className="text-[11px] font-semibold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1"><IconPlus className="w-3 h-3" /> Make a lesson</button>
                      <button onClick={() => navigate(`/teacher/clips?yt=${v.id}`)} className="text-[11px] font-semibold text-violet-300 hover:text-violet-200">Cut a clip</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paste-a-link */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
          <SectionHeading title="Paste a link" subtitle="Fetch any YouTube video's metadata — no channel connection needed" />
          <div className="flex gap-2 mt-1">
            <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtu.be/…" className="input flex-1" />
            <button onClick={() => void fetchMeta()} disabled={metaLoading || !link.trim()} className="btn-primary px-4 disabled:opacity-50">{metaLoading ? '…' : 'Fetch'}</button>
          </div>
          {meta && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 mt-3 flex items-center gap-3">
              <img src={meta.thumbnail} alt="" className="w-28 h-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white line-clamp-2">{meta.title}</p>
                <p className="text-[11px] text-slate-400">{meta.channelTitle}</p>
              </div>
              <button onClick={() => navigate(`/teacher/new?yt=${meta.youtubeId}`)} className="btn-ghost text-xs px-3 py-2 shrink-0">Make a lesson →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
