import { useEffect, useRef } from 'react'
import { cn } from '../../lib/classnames'
import { AvatarCircle } from '../ui'
import { IconMic } from '../icons'

interface VideoTileProps {
  stream?: MediaStream | null
  name: string
  /** Mirror local self-view (front camera). */
  mirror?: boolean
  /** Mute the <video> element (always true for local self-view to avoid echo). */
  muted?: boolean
  /** Show a "mic muted" indicator. */
  micOff?: boolean
  label?: string
  badge?: string
  className?: string
  /** Gradient shown when there's no video track yet. */
  tone?: string
}

/**
 * Binds a MediaStream to a <video> element. Falls back to an avatar + gradient
 * when no stream / no live video track (camera off, audio-only, connecting).
 */
export default function VideoTile({
  stream,
  name,
  mirror = false,
  muted = false,
  micOff = false,
  label,
  badge,
  className,
  tone = 'from-brand-700 to-indigo-900'
}: VideoTileProps): JSX.Element {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.srcObject !== (stream ?? null)) el.srcObject = stream ?? null
    if (stream) el.play().catch(() => undefined)
  }, [stream])

  const hasVideo = !!stream && stream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live')

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden ring-1 ring-white/10 bg-gradient-to-br flex items-center justify-center',
        tone,
        className
      )}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity',
          hasVideo ? 'opacity-100' : 'opacity-0',
          mirror && 'scale-x-[-1]'
        )}
      />
      {!hasVideo && <AvatarCircle name={name} size="lg" className="!w-20 !h-20 !text-2xl" />}
      {(label || name) && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-black/55 backdrop-blur rounded-full px-2.5 py-1 max-w-[85%] truncate">
          {micOff && <IconMic className="w-3 h-3 text-rose-300" />}
          {label ?? name}
        </span>
      )}
      {badge && (
        <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-black rounded-full px-2 py-0.5">
          {badge}
        </span>
      )}
    </div>
  )
}
