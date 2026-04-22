import { useEffect, useState } from 'react'
import type { MicMode } from '@shared/types'
import { Button, Chip, Input } from '../../../components/ui'

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
    // Global shortcuts:
    //   - Esc always cancels active listening
    //   - Space toggles listening in tap-to-talk (push-to-talk) mode
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
      // Safer to drop recording when the window loses focus — prevents the mic
      // staying hot in the background.
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

  const modeHint =
    mode === 'push-to-talk'
      ? 'Tap the mic (or press Space) to start. Tap again to stop. Esc cancels.'
      : 'Speak any time — the mic waits for ~1.5 s of silence before sending. Tap Stop or press Esc to turn off.'

  return (
    <div className="border-t border-white/10 pt-3">
      <div className="flex items-center gap-2 mb-2">
        <Chip selected={mode === 'push-to-talk'} onClick={() => onModeChange('push-to-talk')}>
          👆 Tap-to-talk
        </Chip>
        <Chip selected={mode === 'always-on'} onClick={() => onModeChange('always-on')}>
          🎙️ Always-on
        </Chip>
        {listening && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-red-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shadow-[0_0_8px_#f87171]" />
            {mode === 'always-on' ? 'Listening continuously' : 'Recording — tap to stop'}
          </span>
        )}
        {!listening && interim && (
          <span className="text-xs text-slate-400 italic ml-auto truncate max-w-[50%]">
            &ldquo;{interim}&rdquo;
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={listening ? 'record' : 'primary'}
          className="px-6 min-w-[180px]"
          disabled={disabled && !listening}
          onClick={handleMicClick}
          title={modeHint}
        >
          {listening
            ? '● Stop'
            : mode === 'push-to-talk'
              ? '🎤 Tap to speak'
              : '🎤 Start listening'}
        </Button>

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
        <Button
          variant="ghost"
          onClick={submitText}
          disabled={textDisabled || !text.trim()}
        >
          Send
        </Button>
      </div>

      <p className="text-[10px] text-slate-500 mt-2 text-center">{modeHint}</p>
    </div>
  )
}
