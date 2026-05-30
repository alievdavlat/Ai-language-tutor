import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { MicMode } from '@shared/types'
import { cn } from '../../../lib/classnames'

interface MicControlsProps {
  mode: MicMode
  listening: boolean
  interim: string
  /** Disables START (busy / not ready). Stop is ALWAYS available. */
  disabled: boolean
  onModeChange: (m: MicMode) => void
  onStart: () => void
  onStop: () => void
  onTextSubmit: (text: string) => void
}

const INPUT_TAG_REGEX = /^(INPUT|TEXTAREA|SELECT)$/

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && INPUT_TAG_REGEX.test(el.tagName)
}

export default function MicControls({
  mode,
  listening,
  interim,
  disabled,
  onModeChange,
  onStart,
  onStop,
  onTextSubmit
}: MicControlsProps): JSX.Element {
  const [text, setText] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (isTypingTarget(e.target)) return

      if (e.key === 'Escape' && listening) {
        e.preventDefault()
        onStop()
        return
      }

      if (mode !== 'push-to-talk') return
      if (e.code !== 'Space' || e.repeat) return
      e.preventDefault()
      if (listening) onStop()
      else if (!disabled) onStart()
    }

    const handleBlur = (): void => {
      if (listening) onStop()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', handleBlur)
    }
  }, [mode, listening, disabled, onStart, onStop])

  const submitText = (): void => {
    if (!text.trim()) return
    onTextSubmit(text.trim())
    setText('')
  }

  const handleMicClick = (): void => {
    if (listening) onStop()
    else if (!disabled) onStart()
  }

  const textDisabled = disabled && !listening

  return (
    <div className="border-t border-white/[0.08] pt-4">
      {/* Mode segmented toggle + live indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10">
          {([
            { m: 'push-to-talk' as MicMode, label: '👆 Tap-to-talk' },
            { m: 'always-on' as MicMode, label: '🎙️ Always-on' }
          ]).map(({ m, label }) => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition',
                mode === m ? 'bg-brand-500/30 text-white shadow-glow-sm' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {listening && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-red-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_#f87171]" />
            {mode === 'always-on' ? 'Listening…' : 'Recording…'}
          </span>
        )}
        {!listening && interim && (
          <span className="text-xs text-slate-400 italic ml-auto truncate max-w-[50%]">
            &ldquo;{interim}&rdquo;
          </span>
        )}
      </div>

      {/* Composer pill: mic + input + send in one rounded bar */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl border bg-white/[0.04] pl-2 pr-2 py-2 transition',
          listening ? 'border-red-400/40 shadow-[0_0_20px_rgba(239,68,68,0.18)]' : 'border-white/10 focus-within:border-brand-400/50'
        )}
      >
        {/* Circular mic button */}
        <button
          type="button"
          onClick={handleMicClick}
          disabled={disabled && !listening}
          title={mode === 'push-to-talk' ? 'Tap to speak (or hold Space)' : 'Toggle always-on mic (Esc to stop)'}
          className={cn(
            'relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all duration-200 focus-visible:outline-none',
            disabled && !listening
              ? 'bg-white/[0.06] text-slate-600 cursor-not-allowed opacity-50'
              : listening
                ? 'bg-red-500/90 text-white shadow-[0_0_18px_rgba(239,68,68,0.5)]'
                : 'bg-brand-600/90 text-white hover:bg-brand-500 hover:scale-105 shadow-[0_0_14px_rgba(59,130,246,0.35)]'
          )}
        >
          {listening && (
            <motion.span
              className="absolute inset-0 rounded-full bg-red-400/30"
              animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          <span className="relative">{listening ? '⏹' : '🎤'}</span>
        </button>

        {/* Text input (bare, seamless inside the pill) */}
        <input
          className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500 px-1"
          placeholder="…or type to chat"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submitText()
            }
          }}
          disabled={textDisabled}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={submitText}
          disabled={textDisabled || !text.trim()}
          className={cn(
            'shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all duration-150',
            textDisabled || !text.trim()
              ? 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
              : 'bg-brand-500/90 text-white hover:bg-brand-500 hover:scale-105'
          )}
          title="Send message"
        >
          ↑
        </button>
      </div>

      <p className="text-[10px] text-slate-600 mt-2 text-center">
        {mode === 'push-to-talk'
          ? 'Tap mic or press Space to speak · Esc to cancel'
          : 'Always listening — tap mic or press Esc to stop'}
      </p>
    </div>
  )
}
