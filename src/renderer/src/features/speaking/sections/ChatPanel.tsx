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
  onTextSubmit
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
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
            <p className="text-sm mb-2">Say hello to start 👋</p>
            <p className="text-xs">Hold Space or the Record button, or type a message.</p>
          </div>
        ) : (
          turns.map((t) => <MessageBubble key={t.id} turn={t} />)
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
