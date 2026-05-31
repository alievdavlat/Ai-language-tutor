import { useEffect, useRef, useState } from 'react'
import type { Accent } from '@shared/types'
import type { TTSProviderId } from '@shared/constants'
import { cn } from '../../lib/classnames'
import { IconHeadphones, IconVolume } from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { synthesizeSpeech, isCloudTTSSupported } from '../../services/tts/synthesize'

/** Free, no-key cloud engines — usable without a pasted API key. */
const KEYLESS: TTSProviderId[] = ['edge', 'pollinations']

/** Strip the ALL-CAPS speaker labels ("WOMAN:", "ADVISOR:") so TTS reads cleanly. */
function spokenFrom(transcript: string): string {
  return transcript.replace(/\b[A-Z][A-Z]+:\s*/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Listening-section audio. Plays a real recording when the section carries an
 * `audioUrl` (uploaded / recorded), otherwise synthesises the listening script
 * with neural TTS (free Edge / Pollinations, falling back to the user's chosen
 * voice) so the section is never silent. The transcript text is NOT shown here —
 * it is revealed only in the post-test review, so listening tests listening.
 */
export default function ListeningAudio({
  audioUrl,
  transcript
}: {
  audioUrl?: string
  transcript?: string
}): JSX.Element | null {
  const tts = useAppStore((s) => s.profile?.settings.tts)
  const accent = (useAppStore((s) => s.profile?.settings.accent) ?? 'us') as Accent

  const [genUrl, setGenUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const objectUrlRef = useRef<string | null>(null)

  // Release any synthesised blob URL on unmount / change.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [])

  if (!audioUrl && !transcript) return null

  // Real recording — stream it directly.
  if (audioUrl) {
    return (
      <div className="rounded-2xl border border-brand-400/20 bg-brand-500/[0.08] p-4">
        <p className="text-[11px] uppercase tracking-widest text-brand-200 font-bold mb-2.5 flex items-center gap-2">
          <IconHeadphones className="w-4 h-4" /> Listening audio
        </p>
        <audio controls src={audioUrl} className="w-full" preload="metadata" />
        <p className="text-[11px] text-slate-500 mt-2">Play the recording, then answer. The transcript is shown in your review.</p>
      </div>
    )
  }

  // No recording — synthesise the script with neural TTS on demand.
  const generate = async (): Promise<void> => {
    if (!transcript) return
    setStatus('loading')
    const active = (tts?.activeProviderId ?? 'system') as TTSProviderId
    // Prefer the user's voice if it's a usable cloud engine, else free Edge → Pollinations.
    const candidates: TTSProviderId[] = []
    const keyOk = (p: TTSProviderId): boolean => KEYLESS.includes(p) || !!tts?.tokens?.[p]
    if (active !== 'system' && isCloudTTSSupported(active) && keyOk(active)) candidates.push(active)
    for (const p of ['edge', 'pollinations'] as TTSProviderId[]) if (!candidates.includes(p)) candidates.push(p)

    const text = spokenFrom(transcript)
    for (const provider of candidates) {
      try {
        const blob = await synthesizeSpeech({
          provider,
          text,
          accent,
          rate: 1,
          voice: tts?.voices?.[provider],
          apiKey: tts?.tokens?.[provider]
        })
        if (!blob) continue
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        setGenUrl(url)
        setStatus('ready')
        return
      } catch {
        /* try the next engine */
      }
    }
    setStatus('error')
  }

  return (
    <div className="rounded-2xl border border-brand-400/20 bg-brand-500/[0.08] p-4">
      <p className="text-[11px] uppercase tracking-widest text-brand-200 font-bold mb-2.5 flex items-center gap-2">
        <IconHeadphones className="w-4 h-4" /> Listening audio
      </p>

      {status === 'ready' && genUrl ? (
        <>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls autoPlay src={genUrl} className="w-full" />
          <p className="text-[11px] text-slate-500 mt-2">Replay as needed, then answer. The transcript is shown in your review.</p>
        </>
      ) : (
        <>
          <button
            onClick={() => void generate()}
            disabled={status === 'loading'}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
              status === 'loading' ? 'bg-white/[0.06] text-slate-400' : 'bg-grad-brand text-white hover:scale-[1.02]'
            )}
          >
            {status === 'loading' ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <IconVolume className="w-4 h-4" />
            )}
            {status === 'loading' ? 'Preparing audio…' : 'Play audio'}
          </button>
          <p className="text-[11px] text-slate-500 mt-2">
            {status === 'error'
              ? 'Audio could not be generated (offline?). You can still answer; the transcript is in your review.'
              : 'Tap to hear the recording. The transcript stays hidden until your review.'}
          </p>
        </>
      )}
    </div>
  )
}
