import { useState } from 'react'
import type { Comment, CommentTargetKind, PlatformUser } from '@shared/types'
import { cn } from '../lib/classnames'
import { timeAgo } from '../lib/time'
import { AvatarCircle } from './ui'
import { IconHeart } from './icons'
import { backend, useBackendQuery } from '../services/backend/useBackend'
import { comments } from '../services/comments/store'

function CommentRow({ c, user, onReply, onLike, onDelete, isReply }: {
  c: Comment
  user?: PlatformUser
  onReply: () => void
  onLike: () => void
  onDelete: () => void
  isReply?: boolean
}): JSX.Element {
  const liked = comments.isLiked(c.id)
  const likes = comments.likeCount(c.id)
  return (
    <div className={cn('flex gap-3', isReply && 'ml-11')}>
      <AvatarCircle name={user?.name} src={(user as { avatarUrl?: string } | undefined)?.avatarUrl} size={isReply ? 'sm' : 'md'} />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-bold text-white">{user?.name ?? 'Learner'}</span>
          <span className="text-[11px] text-slate-500 ml-2">{timeAgo(c.createdAt)}</span>
        </p>
        <p className="text-sm text-slate-200 mt-0.5 whitespace-pre-wrap break-words">{c.text}</p>
        <div className="flex items-center gap-4 mt-1.5">
          <button onClick={onLike} className={cn('inline-flex items-center gap-1 text-xs transition', liked ? 'text-rose-300' : 'text-slate-400 hover:text-slate-200')}>
            <IconHeart className="w-3.5 h-3.5" /> {likes > 0 ? likes : ''}
          </button>
          {!isReply && <button onClick={onReply} className="text-xs font-semibold text-slate-400 hover:text-slate-200">Reply</button>}
          {comments.canDelete(c) && <button onClick={onDelete} className="text-xs text-slate-500 hover:text-rose-300">Delete</button>}
        </div>
      </div>
    </div>
  )
}

export default function CommentsSection({ targetKind, targetId }: { targetKind: CommentTargetKind; targetId: string }): JSX.Element {
  const meId = backend.currentUserId()
  const q = useBackendQuery(async () => {
    const list = await comments.list(targetKind, targetId)
    const ids = [...new Set(list.map((c) => c.authorId))]
    const users = await Promise.all(ids.map((id) => backend.getUser(id)))
    const map: Record<string, PlatformUser> = {}
    for (const u of users) if (u) map[u.id] = u
    return { list, map }
  }, [targetKind, targetId], { list: [] as Comment[], map: {} as Record<string, PlatformUser> })

  const me = useBackendQuery(() => (meId ? backend.getUser(meId) : Promise.resolve(null)), [meId], null)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const tops = q.data.list.filter((c) => !c.parentId)
  const repliesOf = (id: string): Comment[] => q.data.list.filter((c) => c.parentId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const post = async (): Promise<void> => {
    if (!text.trim()) return
    await comments.add({ targetKind, targetId, text })
    setText('')
    q.refresh()
  }
  const postReply = async (parentId: string): Promise<void> => {
    if (!replyText.trim()) return
    await comments.add({ targetKind, targetId, text: replyText, parentId })
    setReplyText('')
    setReplyTo(null)
    q.refresh()
  }

  return (
    <section>
      <h2 className="text-base font-bold mb-3">{tops.length} comment{tops.length === 1 ? '' : 's'}</h2>

      {/* Composer */}
      {meId ? (
        <div className="flex gap-3 mb-6">
          <AvatarCircle name={me.data?.name} src={(me.data as { avatarUrl?: string } | null)?.avatarUrl} size="md" />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              rows={2}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none resize-none"
            />
            <div className="flex justify-end mt-2">
              <button onClick={() => void post()} disabled={!text.trim()} className="btn-primary px-4 py-1.5 text-sm disabled:opacity-40">Comment</button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 mb-6">Sign in to join the conversation.</p>
      )}

      {/* Thread */}
      <div className="flex flex-col gap-5">
        {tops.length === 0 && <p className="text-sm text-slate-500">No comments yet — be the first.</p>}
        {tops.map((c) => (
          <div key={c.id} className="flex flex-col gap-3">
            <CommentRow c={c} user={q.data.map[c.authorId]} onReply={() => setReplyTo(replyTo === c.id ? null : c.id)} onLike={() => { comments.toggleLike(c.id); q.refresh() }} onDelete={() => { void comments.remove(c.id).then(() => q.refresh()) }} />
            {repliesOf(c.id).map((r) => (
              <CommentRow key={r.id} c={r} user={q.data.map[r.authorId]} isReply onReply={() => {}} onLike={() => { comments.toggleLike(r.id); q.refresh() }} onDelete={() => { void comments.remove(r.id).then(() => q.refresh()) }} />
            ))}
            {replyTo === c.id && meId && (
              <div className="ml-11 flex gap-2">
                <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`Reply to ${q.data.map[c.authorId]?.name ?? 'comment'}…`} className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none" />
                <button onClick={() => void postReply(c.id)} disabled={!replyText.trim()} className="btn-primary px-4 py-2 text-sm disabled:opacity-40">Reply</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
