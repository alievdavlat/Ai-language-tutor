import { useEffect, useState } from 'react'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { Spinner } from '../../components/ui'
import VideoTile from '../../components/realtime/VideoTile'
import RealtimeStatus from '../../components/realtime/RealtimeStatus'
import { IconArrowRight, IconMic, IconUsers, IconX } from '../../components/icons'
import { useMeetQueue } from './useMeetQueue'
import { useMediaRoom } from '../../hooks/realtime/useMediaRoom'

type Phase = 'lobby' | 'matching' | 'call'

const LEVELS = ['Any', 'A2', 'B1', 'B2', 'C1']
const TOPICS = ['Free talk', 'Travel', 'Work', 'Movies', 'Daily life']
const GROUP_TONES = ['from-emerald-700 to-teal-900', 'from-rose-700 to-pink-900', 'from-amber-600 to-orange-900', 'from-brand-600 to-indigo-800']

export default function MeetPage(): JSX.Element {
  const name = useAppStore((s) => s.profile?.name) ?? 'You'
  const [phase, setPhase] = useState<Phase>('lobby')
  const [level, setLevel] = useState('Any')
  const [topic, setTopic] = useState('Free talk')
  const [mode, setMode] = useState<'solo' | 'group'>('solo')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState('Partner')

  const queue = useMeetQueue({ name, level, topic, enabled: phase === 'matching' && mode === 'solo' })

  // When the queue matches us, drop into the call.
  useEffect(() => {
    if (phase === 'matching' && mode === 'solo' && queue.match) {
      setRoomId(queue.match.roomId)
      setPartnerName(queue.match.partnerName)
      setPhase('call')
    }
  }, [phase, mode, queue.match])

  const startMatching = (): void => {
    if (mode === 'group') {
      setRoomId('meet:group')
      setPhase('call')
    } else {
      setPhase('matching')
    }
  }

  const nextPartner = (): void => {
    setRoomId(null)
    setPartnerName('Partner')
    setPhase('matching')
  }
  const endCall = (): void => {
    setRoomId(null)
    setPhase('lobby')
  }

  // ── Lobby ──────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-6 py-6 max-w-xl mx-auto w-full flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Speaking partner</h1>
            <p className="text-sm text-slate-400 mt-1">Get matched with a real learner for a live video chat.</p>
          </div>

          <RealtimeStatus />

          <div className="rounded-card border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Mode</p>
              <div className="inline-flex rounded-pill bg-white/[0.04] border border-white/10 p-1">
                {(['solo', 'group'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={cn('px-4 py-1.5 rounded-pill text-sm font-medium transition', m === mode ? 'bg-grad-brand text-white' : 'text-slate-400 hover:text-slate-200')}>
                    {m === 'solo' ? '1-on-1' : 'Group'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Partner level</p>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => setLevel(l)} className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition', l === level ? 'bg-grad-brand text-white' : 'bg-white/[0.05] text-slate-300 hover:bg-white/10')}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Topic</p>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button key={t} onClick={() => setTopic(t)} className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition', t === topic ? 'bg-grad-brand text-white' : 'bg-white/[0.05] text-slate-300 hover:bg-white/10')}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={startMatching} className="btn-primary py-3.5 text-base inline-flex items-center justify-center gap-2">
            <IconUsers className="w-5 h-5" /> {mode === 'group' ? 'Join group room' : 'Start matching'}
          </button>
          <p className="text-xs text-slate-500 text-center">Be respectful · English only · you can skip or report anytime.</p>
        </div>
      </div>
    )
  }

  // ── Matching ───────────────────────────────────────────────────────────
  if (phase === 'matching') {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5">
        <Spinner size="lg" />
        <p className="text-slate-300 font-medium">Finding a partner…</p>
        <p className="text-xs text-slate-500">{level} · {topic}</p>
        <p className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {queue.waitingCount} learner{queue.waitingCount === 1 ? '' : 's'} searching now
        </p>
        <button onClick={endCall} className="text-xs text-slate-500 hover:text-slate-300 mt-2">Cancel</button>
      </div>
    )
  }

  // ── Call (mounting MeetCall (un)subscribes the media room) ───────────────
  return (
    <MeetCall
      key={roomId ?? 'call'}
      roomId={roomId ?? 'meet:group'}
      mode={mode}
      selfName={name}
      partnerName={partnerName}
      topic={topic}
      onNext={mode === 'solo' ? nextPartner : undefined}
      onEnd={endCall}
    />
  )
}

function MeetCall({
  roomId,
  mode,
  selfName,
  partnerName,
  topic,
  onNext,
  onEnd
}: {
  roomId: string
  mode: 'solo' | 'group'
  selfName: string
  partnerName: string
  topic: string
  onNext?: () => void
  onEnd: () => void
}): JSX.Element {
  const room = useMediaRoom(roomId, {
    presence: { name: selfName },
    publish: true,
    video: true,
    audio: true
  })

  const remotes = Object.entries(room.remoteStreams)
  const otherPeers = room.peers.filter((p) => p.peerId !== room.peerId)

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex-1 relative bg-gradient-to-br from-indigo-950 via-slate-900 to-black p-4">
        {mode === 'group' ? (
          <div className="grid grid-cols-2 gap-3 w-full max-w-3xl mx-auto h-full content-center">
            {otherPeers.slice(0, 3).map((p, i) => (
              <VideoTile
                key={p.peerId}
                stream={room.remoteStreams[p.peerId]}
                name={(p.name as string) ?? 'Guest'}
                tone={GROUP_TONES[i % GROUP_TONES.length]}
                className="aspect-video"
              />
            ))}
            <VideoTile
              stream={room.localStream}
              name={selfName}
              label="You"
              mirror
              muted
              micOff={!room.micOn}
              tone="from-brand-600 to-indigo-800"
              className="aspect-video"
            />
            {otherPeers.length === 0 && (
              <div className="col-span-2 text-center text-slate-400 text-sm py-6">
                Waiting for others to join this group room…
              </div>
            )}
          </div>
        ) : (
          <>
            <VideoTile
              stream={remotes[0]?.[1]}
              name={partnerName}
              tone="from-emerald-700 to-teal-900"
              className="absolute inset-4"
              label={otherPeers[0]?.name as string ?? partnerName}
            />
            <VideoTile
              stream={room.localStream}
              name={selfName}
              label="You"
              mirror
              muted
              micOff={!room.micOn}
              tone="from-brand-600 to-indigo-800"
              className="absolute bottom-4 right-4 w-32 h-44 z-10"
            />
            {remotes.length === 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <Spinner size="md" />
                <p className="text-slate-300 text-sm mt-3">Connecting to {partnerName}…</p>
              </div>
            )}
          </>
        )}

        <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 backdrop-blur px-4 py-2 text-sm text-white z-20">
          Talk about: <b>{topic}</b>
        </div>
        {room.mediaError && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 rounded-full bg-rose-600/80 px-4 py-1.5 text-xs text-white z-20">
            {room.mediaError}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 py-4 bg-canvas-soft/80">
        <button onClick={room.toggleMic} className={cn('w-12 h-12 rounded-full text-white flex items-center justify-center transition', room.micOn ? 'bg-white/10 hover:bg-white/20' : 'bg-rose-600 hover:bg-rose-500')} title={room.micOn ? 'Mute' : 'Unmute'}>
          <IconMic className="w-5 h-5" />
        </button>
        {onNext && (
          <button onClick={onNext} className="px-5 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold inline-flex items-center gap-2 transition" title="Next partner">
            Next <IconArrowRight className="w-4 h-4" />
          </button>
        )}
        <button onClick={onEnd} className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition" title="End">
          <IconX className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
