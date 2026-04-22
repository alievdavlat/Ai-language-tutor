import { cn } from '../../../lib/classnames'
import type { ChatTurn } from '../types'
import CorrectionBubble from './CorrectionBubble'
import TypingDots from './TypingDots'

interface MessageBubbleProps {
  turn: ChatTurn
}

export default function MessageBubble({ turn }: MessageBubbleProps): JSX.Element {
  const isUser = turn.role === 'user'
  return (
    <div
      className={cn(
        'flex mb-4 animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div className="max-w-[80%] flex flex-col gap-2">
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg shadow-black/20',
            isUser
              ? 'bg-grad-brand text-white rounded-br-md'
              : 'bg-white/[0.06] text-slate-100 rounded-bl-md border border-white/10 backdrop-blur'
          )}
        >
          {turn.pending && !turn.text ? <TypingDots /> : turn.text}
        </div>
        {turn.correction && (
          <CorrectionBubble correction={turn.correction} fullOriginal={turn.text} />
        )}
      </div>
    </div>
  )
}
