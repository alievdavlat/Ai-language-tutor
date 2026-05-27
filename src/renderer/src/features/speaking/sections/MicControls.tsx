import { useEffect, useState } from 'react'
import type { MicMode } from '@shared/types'
import { Chip, Input } from '../../../components/ui'
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
      {/* Mode toggle + live indicator */}
      <div className="flex items-center gap-2 mb-4">
        <Chip selected={mode === 'push-to-talk'} onClick={() => onModeChange('push-to-talk')}>
          👆 Tap-to-talk
        </Chip>
        <Chip selected={mode === 'always-on'} onClick={() => onModeChange('always-on')}>
          🎙️ Always-on
        </Chip>
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

      {/* Main controls row: big circular mic + text input + send */}
      <div className="flex items-center gap-3">
        {/* Circular mic button */}
        <button
          type="button"
          onClick={handleMicClick}
          disabled={disabled && !listening}
          title={
            mode === 'push-to-talk'
              ? 'Tap to speak (or hold Space)'
              : 'Toggle always-on mic (Esc to stop)'
          }
          className={cn(
            'relative shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all duration-200',
            'ring-2 focus-visible:outline-none',
            disabled && !listening
              ? 'bg-white/[0.06] ring-white/10 text-slate-600 cursor-not-allowed opacity-50'
              : listening
                ? 'bg-red-500/90 ring-red-400/60 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110'
                : 'bg-brand-600/80 ring-brand-400/50 text-white hover:bg-brand-500/90 hover:scale-105 shadow-[0_0_15px_rgba(59,130,246,0.35)]'
          )}
        >
          {/* Pulse ring when listening */}
          {listening && (
            <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
          )}
          <span className="relative">{listening ? '⏹' : '🎤'}</span>
        </button>

        {/* Text input */}
        <Input
          className="flex-1"
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
            'shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-150',
            textDisabled || !text.trim()
              ? 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
              : 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white hover:scale-105'
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
