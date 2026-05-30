import { useEffect, useRef } from 'react'
import type { MicMode } from '@shared/types'
import { Card } from '../../../components/ui'
import MessageBubble from '../components/MessageBubble'
import MicControls from './MicControls'
import type { ChatTurn } from '../types'

interface ChatPanelProps {
  turns: ChatTurn[]
  micMode: MicMode
  listening: boolean
  interim: string
  disabled: boolean
  onMicModeChange: (m: MicMode) => void
  onStartMic: () => void
  onStopMic: () => void
  onTextSubmit: (text: string) => void
  /** Companion identity for AI message bubbles. */
  companionName?: string
  companionAvatarUrl?: string
}

export default function ChatPanel({
  turns,
  micMode,
  listening,
  interim,
  disabled,
  onMicModeChange,
  onStartMic,
  onStopMic,
  onTextSubmit,
  companionName,
  companionAvatarUrl
}: ChatPanelProps): JSX.Element {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }, [turns])

  return (
    <Card className="flex flex-col overflow-hidden">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto pr-2">
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/[0.05] flex items-center justify-center mb-4">
              {companionAvatarUrl ? (
                <img src={companionAvatarUrl} alt={companionName ?? 'AI'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-2xl">💬</span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-200 mb-1">
              Say hello to {companionName ?? 'your companion'} 👋
            </p>
            <p className="text-xs text-slate-500">Tap the mic, press Space, or type a message below.</p>
          </div>
        ) : (
          turns.map((t) => (
            <MessageBubble
              key={t.id}
              turn={t}
              companionName={companionName}
              companionAvatarUrl={companionAvatarUrl}
            />
          ))
        )}
      </div>

      <MicControls
        mode={micMode}
        listening={listening}
        interim={interim}
        disabled={disabled}
        onModeChange={onMicModeChange}
        onStart={onStartMic}
        onStop={onStopMic}
        onTextSubmit={onTextSubmit}
      />
    </Card>
  )
}
