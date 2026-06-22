import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import VideoTile from '../../components/realtime/VideoTile'
import { IconHeart, IconMic, IconUsers, IconX } from '../../components/icons'
import { useMediaRoom } from '../../hooks/realtime/useMediaRoom'
import { useT } from '../../i18n'

interface ChatMsg {
  id: string
  name: string
  text: string
  role?: string
}
interface FloatReaction {
  id: string
  emoji: string
  x: number
}

const GROUP_TONES = [
  'from-brand-700 to-indigo-900',
  'from-emerald-700 to-teal-900',
  'from-rose-700 to-pink-900',
  'from-amber-600 to-orange-900'
]
const REACTIONS = ['❤️', '🔥', '👏', '🎉']

export default function LiveRoomPage({ group = false }: { group?: boolean }): JSX.Element {
  const t = useT()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const name = useAppStore((s) => s.profile?.name) ?? 'You'

  const streamId = params.get('id') ?? (group ? 'group-demo' : 'demo')
  const me = backend.currentUserId()
  // Resolve the real stream row so the host is its OWNER, not a URL param
  // (fixes #B21 — anyone with `?host=1` used to become host). The `?host=1`
  // hint only covers the brief window before the row loads for the creator.
  const { data: stream } = useBackendQuery(
    () => backend.listLiveNow().then((l) => l.find((s) => s.id === streamId) ?? null),
    [streamId],
    null
  )
  const isHost = stream ? stream.hostId === me : params.get('host') === '1'

  // When the host leaves the room (unmount), END the stream so it doesn't linger
  // as a zombie in everyone's Live list.
  const endRef = useRef<{ host: boolean; id: string | null }>({ host: false, id: null })
  useEffect(() => {
    endRef.current = { host: isHost, id: stream?.id ?? null }
  }, [isHost, stream])
  useEffect(
    () => () => {
      if (endRef.current.host && endRef.current.id) {
        void backend.endLiveStream(endRef.current.id).catch(() => {})
      }
    },
    []
  )
  // In a group room, hosts AND co-hosts publish video; in a 1-host stream only
  // the host publishes and everyone else is a viewing audience.
  const role: 'host' | 'cohost' | 'viewer' = isHost ? 'host' : group ? 'cohost' : 'viewer'
  const publish = role === 'host' || role === 'cohost'
  const roomId = group ? `live:group:${streamId}` : `live:${streamId}`

  const room = useMediaRoom(roomId, {
    presence: { name, role },
    publish,
    video: true,
    audio: true
  })

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState('')
  const [reactions, setReactions] = useState<FloatReaction[]>([])
  const [kicked, setKicked] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ── Wire chat + reactions + kick ─────────────────────────────────────────
  useEffect(() => {
    if (!room.channel) return
    const ch = room.channel
    const offChat = ch.on('chat', (p) => {
      const m = p as { name: string; text: string; role?: string }
      setMessages((prev) => [...prev.slice(-80), { id: Math.random().toString(36).slice(2), ...m }])
    })
    const offReact = ch.on('reaction', (p) => {
      const e = (p as { emoji: string }).emoji
      pushReaction(e)
    })
    const offKick = ch.on('kick', (p) => {
      if ((p as { peerId: string }).peerId === room.peerId) setKicked(true)
    })
    return () => {
      offChat()
      offReact()
      offKick()
    }
  }, [room.channel, room.peerId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Leave the room if a host removed us.
  useEffect(() => {
    if (kicked) {
      const t = setTimeout(() => navigate('/live'), 1200)
      return () => clearTimeout(t)
    }
  }, [kicked, navigate])

  function pushReaction(emoji: string): void {
    const r: FloatReaction = { id: Math.random().toString(36).slice(2), emoji, x: 10 + Math.random() * 60 }
    setReactions((prev) => [...prev, r])
    setTimeout(() => setReactions((prev) => prev.filter((x) => x.id !== r.id)), 2600)
  }

  const sendChat = (): void => {
    const text = draft.trim()
    if (!text) return
    room.send('chat', { name, text, role })
    setMessages((prev) => [...prev.slice(-80), { id: Math.random().toString(36).slice(2), name, text, role }])
    setDraft('')
  }

  const sendReaction = (emoji: string): void => {
    room.send('reaction', { emoji })
    pushReaction(emoji)
  }

  const kick = (peerId: string): void => room.send('kick', { peerId })

  // ── Roster math ──────────────────────────────────────────────────────────
  const publishers = useMemo(
    () => room.peers.filter((p) => p.peerId !== room.peerId && (p.role === 'host' || p.role === 'cohost')),
    [room.peers, room.peerId]
  )
  const totalInRoom = room.peers.length

  if (kicked) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black gap-3">
        <p className="text-white font-semibold">{t('lib.removedFromRoom')}</p>
        <p className="text-slate-400 text-sm">{t('lib.returningToLive')}</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col lg:flex-row bg-black">
      {/* Stage */}
      <div className="flex-1 relative flex items-center justify-center bg-gradient-to-br from-slate-900 to-black min-h-[40vh] p-4 overflow-hidden">
        {group ? (
          <div className="grid grid-cols-2 gap-3 w-full max-w-3xl">
            {/* Self tile first when publishing */}
            {publish && (
              <VideoTile
                stream={room.localStream}
                name={name}
                label={`${name} · ${t('lib.you')}${role === 'host' ? ` · ${t('lib.host')}` : ''}`}
                mirror
                muted
                micOff={!room.micOn}
                tone={GROUP_TONES[0]}
                className="aspect-video"
              />
            )}
            {publishers.slice(0, publish ? 3 : 4).map((p, i) => (
              <div key={p.peerId} className="relative">
                <VideoTile
                  stream={room.remoteStreams[p.peerId]}
                  name={(p.name as string) ?? t('lib.guest')}
                  label={`${(p.name as string) ?? t('lib.guest')}${p.role === 'host' ? ` · ${t('lib.host')}` : ''}`}
                  tone={GROUP_TONES[(i + 1) % GROUP_TONES.length]}
                  className="aspect-video"
                />
                {isHost && (
                  <button
                    onClick={() => kick(p.peerId)}
                    title={t('lib.removeFromRoom')}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {publishers.length === 0 && !publish && (
              <div className="col-span-2 text-center text-slate-400 text-sm py-10">{t('lib.waitingCohosts')}</div>
            )}
          </div>
        ) : isHost ? (
          // Single-stream host: show own camera big.
          <VideoTile stream={room.localStream} name={name} label={`${name} · ${t('lib.you')}`} mirror muted micOff={!room.micOn} tone="from-brand-700 to-indigo-900" className="absolute inset-4" />
        ) : (
          // Single-stream viewer: show the host's video.
          <VideoTile
            stream={publishers[0] ? room.remoteStreams[publishers[0].peerId] : null}
            name={(publishers[0]?.name as string) ?? t('lib.hostCap')}
            label={(publishers[0]?.name as string) ?? t('lib.hostCap')}
            tone="from-rose-700 to-pink-900"
            className="absolute inset-4"
          />
        )}

        {!isHost && !group && publishers.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <p className="text-white font-semibold">{t('lib.hostNotStarted')}</p>
            <p className="text-slate-400 text-sm mt-1">{t('lib.seeWhenLive')}</p>
          </div>
        )}

        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-rose-600 text-white rounded-full px-2.5 py-1 z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {group ? t('lib.groupLive') : t('lib.live')}
        </span>
        <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs text-white bg-black/50 rounded-full px-3 py-1.5 z-20">
          <IconUsers className="w-3.5 h-3.5" /> {totalInRoom}
        </span>
        {room.mediaError && publish && (
          <div className="absolute top-14 left-4 rounded-full bg-rose-600/80 px-3 py-1.5 text-[11px] text-white z-20">{room.mediaError}</div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
          {publish && (
            <button onClick={room.toggleMic} className={cn('w-10 h-10 rounded-full text-white flex items-center justify-center transition', room.micOn ? 'bg-white/10 hover:bg-white/20' : 'bg-rose-600 hover:bg-rose-500')} title={room.micOn ? t('lib.mute') : t('lib.unmute')}>
              <IconMic className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => navigate('/live')} className="inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm px-4 py-2 transition">
            <IconX className="w-4 h-4" /> {t('lib.leave')}
          </button>
        </div>

        {/* Floating reactions */}
        <div className="absolute bottom-16 left-4 flex gap-2 z-20">
          {REACTIONS.map((e) => (
            <button key={e} onClick={() => sendReaction(e)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-lg transition">{e}</button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 z-10">
          {reactions.map((r) => (
            <span key={r.id} className="absolute bottom-24 text-2xl animate-[float-up_2.6s_ease-out_forwards]" style={{ left: `${r.x}%` }}>{r.emoji}</span>
          ))}
        </div>
      </div>

      {/* Chat */}
      <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-canvas-soft/60 flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <IconHeart className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-semibold text-white">{t('lib.liveChat')}</span>
          <span className="ml-auto text-[11px] text-slate-400">{totalInRoom} {t('lib.here')}</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-xs text-slate-500">{t('lib.sayHi')} 👋</p>
          )}
          {messages.map((c) => (
            <div key={c.id} className="text-sm">
              <span className={c.role === 'host' ? 'text-brand-300 font-semibold' : 'text-slate-400 font-medium'}>{c.name}</span>{' '}
              <span className="text-slate-200">{c.text}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="p-3 border-t border-white/10">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendChat() }}
            placeholder={t('lib.saySomething')}
            className="w-full rounded-pill bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
          />
        </div>
      </aside>
    </div>
  )
}
