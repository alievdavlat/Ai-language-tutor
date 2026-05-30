import { motion } from 'framer-motion'
import { cn } from '../../../lib/classnames'
import type { ChatTurn } from '../types'
import CorrectionBubble from './CorrectionBubble'
import TypingDots from './TypingDots'

interface MessageBubbleProps {
  turn: ChatTurn
  /** Companion portrait + name (shown beside AI messages). */
  companionAvatarUrl?: string
  companionName?: string
}

export default function MessageBubble({ turn, companionAvatarUrl, companionName }: MessageBubbleProps): JSX.Element {
  const isUser = turn.role === 'user'
  const initial = (companionName ?? 'AI').trim().charAt(0).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn('flex mb-4 gap-2.5 items-end', isUser ? 'justify-end' : 'justify-start')}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/15 bg-white/[0.06] flex items-center justify-center">
          {companionAvatarUrl ? (
            <img src={companionAvatarUrl} alt={companionName ?? 'AI'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-xs font-bold text-slate-300">{initial}</span>
          )}
        </div>
      )}

      <div className={cn('max-w-[78%] flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
        {!isUser && companionName && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-1">{companionName}</span>
        )}
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
        {turn.correction && <CorrectionBubble correction={turn.correction} fullOriginal={turn.text} />}
      </div>
    </motion.div>
  )
}
