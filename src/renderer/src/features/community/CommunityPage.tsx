import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PlatformUser, Post, PostKind } from '@shared/types'
import { cn } from '../../lib/classnames'
import { AvatarCircle, Tabs, type TabItem } from '../../components/ui'
import {
  IconBolt,
  IconBook,
  IconBookmark,
  IconChat,
  IconChart,
  IconHeart,
  IconMic,
  IconPlay,
  IconPlus,
  IconStar,
  IconTrophy,
  IconUsers,
  IconVolume,
  IconYouTube,
  type IconProps
} from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { backend, useBackendQuery } from '../../services/backend/useBackend'

type Filter = 'recent' | 'popular' | 'following'
const FILTERS: TabItem<Filter>[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'popular', label: 'Popular' },
  { id: 'following', label: 'Following' }
]

interface KindMeta {
  label: string
  Icon: (p: IconProps) => JSX.Element
  tint: string
}
const KIND: Record<PostKind, KindMeta> = {
  text: { label: 'Post', Icon: IconChat, tint: 'bg-white/10 text-slate-300' },
  question: { label: 'Question', Icon: IconChat, tint: 'bg-sky-500/15 text-sky-300' },
  resource: { label: 'Resource', Icon: IconBook, tint: 'bg-violet-500/15 text-violet-300' },
  achievement: { label: 'Achievement', Icon: IconTrophy, tint: 'bg-amber-500/15 text-amber-300' },
  poll: { label: 'Poll', Icon: IconChart, tint: 'bg-emerald-500/15 text-emerald-300' },
  'study-session': { label: 'Study session', Icon: IconUsers, tint: 'bg-rose-500/15 text-rose-300' },
  voice: { label: 'Voice clip', Icon: IconMic, tint: 'bg-pink-500/15 text-pink-300' }
}

const REACTION_EMOJI = ['❤️', '👍', '🔥', '🎯', '👏', '🤔', '🧠'] as const

const CHALLENGES = [
  { title: '7-day speaking streak', people: '1,240 joined' },
  { title: 'Learn 50 new words', people: '870 joined' }
]
const GROUPS = [
  { title: 'IELTS Warriors', people: '3.2k' },
  { title: 'Daily Speaking Club', people: '5.1k' },
  { title: 'Grammar Nerds', people: '1.8k' }
]

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function relUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return 'started'
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `in ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `in ${h}h`
  return `in ${Math.floor(h / 24)}d`
}

// ─── Body renderers per kind ───────────────────────────────────────────────

function Attachment({ resource }: { resource: NonNullable<Post['resource']> }): JSX.Element {
  if (resource.kind === 'youtube') {
    return (
      <div className="relative rounded-2xl bg-gradient-to-br from-sky-600 to-blue-800 h-40 flex items-center justify-center ring-1 ring-white/10 mt-3">
        <span className="w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center"><IconPlay className="w-5 h-5 text-white ml-0.5" /></span>
        <span className="absolute top-2 left-2"><IconYouTube className="w-5 h-5 text-red-500" /></span>
        <span className="absolute bottom-2 left-3 text-sm font-semibold text-white">{resource.title ?? 'Video'}</span>
      </div>
    )
  }
  if (resource.kind === 'pdf') {
    return (
      <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-300 flex items-center justify-center"><IconBook className="w-5 h-5" /></span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{resource.title ?? 'PDF'}</p>
          <p className="text-[11px] text-slate-400">PDF · tap to read</p>
        </div>
      </div>
    )
  }
  return (
    <div className="mt-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconVolume className="w-5 h-5" /></span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{resource.title ?? 'Audio'}</p>
        <p className="text-[11px] text-slate-400">Audio · tap to play</p>
      </div>
    </div>
  )
}

function PollBody({ poll, postId }: { poll: NonNullable<Post['poll']>; postId: string }): JSX.Element {
  // Visual-only voting (frontend) so the bars react immediately on tap.
  // A backend-persisted vote is a follow-up — for now we mirror likes pattern.
  const total = poll.options.reduce((acc, o) => acc + o.votes, 0)
  const [voted, setVoted] = useState<string | null>(null)
  return (
    <div className="mt-3 flex flex-col gap-2">
      {poll.options.map((o) => {
        const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0
        const isVoted = voted === o.id
        return (
          <button
            key={`${postId}-${o.id}`}
            onClick={() => setVoted(o.id)}
            disabled={voted !== null}
            className={cn(
              'relative rounded-xl border px-3 py-2 text-left transition overflow-hidden',
              voted == null && 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer',
              voted != null && !isVoted && 'border-white/10 bg-white/[0.025]',
              isVoted && 'border-brand-400/60 bg-brand-500/10'
            )}
          >
            {voted != null && (
              <span
                className={cn('absolute inset-y-0 left-0 -z-0', isVoted ? 'bg-brand-500/15' : 'bg-white/[0.04]')}
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="relative flex items-center justify-between">
              <span className={cn('text-sm', isVoted ? 'text-white font-bold' : 'text-slate-200')}>{o.label}</span>
              {voted != null && <span className="text-xs font-bold text-slate-300">{pct}%</span>}
            </div>
          </button>
        )
      })}
      {voted != null && (
        <p className="text-[10px] text-slate-500 mt-0.5">{total.toLocaleString()} votes</p>
      )}
    </div>
  )
}

function StudySessionBody({ s }: { s: NonNullable<Post['studySession']> }): JSX.Element {
  const seatsLeft = Math.max(0, s.capacity - s.joinedIds.length)
  return (
    <div className="mt-3 rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-500/10 to-amber-500/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center rounded-full bg-rose-500/30 text-rose-100 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Live session</span>
        <span className="text-[11px] text-rose-200">{relUntil(s.whenISO)} · {s.durationMin} min</span>
      </div>
      <p className="text-base font-bold text-white">{s.topic}</p>
      <p className="text-xs text-slate-300 mt-1">{s.language.toUpperCase()} · {s.level} · {s.joinedIds.length}/{s.capacity} joined · {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left</p>
      <button className="btn-primary w-full mt-3 py-2 text-sm">Join session</button>
    </div>
  )
}

function AchievementBody({ a }: { a: NonNullable<Post['achievement']> }): JSX.Element {
  return (
    <div className="mt-3 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-400/30 p-4 flex items-center gap-4">
      <div className="text-5xl shrink-0">{a.emoji}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-amber-200/80 font-bold">Achievement unlocked</p>
        <p className="text-sm font-bold text-white">{a.title}</p>
        <p className="text-xs text-slate-300 mt-0.5">{a.description}</p>
      </div>
    </div>
  )
}

function VoiceBody({ v }: { v: NonNullable<Post['voice']> }): JSX.Element {
  const mm = String(Math.floor(v.durationSec / 60)).padStart(2, '0')
  const ss = String(v.durationSec % 60).padStart(2, '0')
  return (
    <div className="mt-3 rounded-2xl border border-pink-400/30 bg-pink-500/[0.08] p-4">
      <div className="flex items-center gap-3">
        <button className="w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-400 text-white flex items-center justify-center"><IconPlay className="w-5 h-5 ml-0.5" /></button>
        <div className="flex-1">
          <div className="flex items-end gap-0.5 h-6 mb-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i} className="flex-1 rounded-t bg-pink-300/70" style={{ height: `${30 + Math.abs(Math.sin(i * 0.4)) * 60}%` }} />
            ))}
          </div>
          <p className="text-[11px] text-pink-200 font-mono">{mm}:{ss}</p>
        </div>
      </div>
      {v.transcript && (
        <p className="text-xs text-slate-300 italic mt-3 line-clamp-2">"{v.transcript}"</p>
      )}
    </div>
  )
}

// ─── Card ──────────────────────────────────────────────────────────────────

function PostCard({ post, author, onAfterChange }: { post: Post; author: PlatformUser | null; onAfterChange: () => void }): JSX.Element {
  const navigate = useNavigate()
  const me = backend.currentUserId()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [saved, setSaved] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [reactions, setReactions] = useState<Record<string, number>>(post.reactions ?? {})
  const [myReaction, setMyReaction] = useState<string | null>(null)
  const meta = KIND[post.kind] ?? KIND.text

  useEffect(() => {
    if (!me) return
    void backend.isLiked(me, post.id).then(setLiked)
    void backend.isSaved(me, { kind: 'post', id: post.id }).then(setSaved)
  }, [me, post.id])

  const toggleLike = async (): Promise<void> => {
    if (!me) return
    const res = await backend.like(me, post.id)
    setLiked(res.liked)
    setLikeCount(res.likeCount)
    onAfterChange()
  }
  const toggleSave = async (): Promise<void> => {
    if (!me) return
    const res = await backend.save(me, { kind: 'post', id: post.id })
    setSaved(res.saved)
  }
  const pickReaction = (emoji: string): void => {
    setReactions((prev) => {
      const next = { ...prev }
      // Remove previous reaction
      if (myReaction && next[myReaction]) {
        next[myReaction] = Math.max(0, next[myReaction] - 1)
        if (next[myReaction] === 0) delete next[myReaction]
      }
      // Toggle off if same emoji clicked
      if (myReaction === emoji) {
        setMyReaction(null)
        return next
      }
      next[emoji] = (next[emoji] ?? 0) + 1
      setMyReaction(emoji)
      return next
    })
    setShowReactions(false)
  }

  return (
    <div className="rounded-card border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/channel')}><AvatarCircle name={author?.name ?? '?'} size="sm" /></button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{author?.name ?? 'Unknown'}</span>
            <span className={cn('text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5',
              author?.role === 'teacher' ? 'bg-brand-500/20 text-brand-300' : 'bg-white/10 text-slate-400')}>
              {author?.role ?? 'user'}
            </span>
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest rounded-full px-2 py-0.5', meta.tint)}>
              <meta.Icon className="w-3 h-3" /> {meta.label}
            </span>
          </div>
          <span className="text-xs text-slate-500">{relTime(post.createdAt)} ago</span>
        </div>
      </div>

      <p className={cn(
        'mt-3 leading-relaxed whitespace-pre-wrap',
        post.kind === 'question' ? 'text-base font-semibold text-white' : 'text-sm text-slate-200'
      )}>{post.text}</p>

      {/* Kind-specific bodies */}
      {post.resource && <Attachment resource={post.resource} />}
      {post.kind === 'poll' && post.poll && <PollBody poll={post.poll} postId={post.id} />}
      {post.kind === 'study-session' && post.studySession && <StudySessionBody s={post.studySession} />}
      {post.kind === 'achievement' && post.achievement && <AchievementBody a={post.achievement} />}
      {post.kind === 'voice' && post.voice && <VoiceBody v={post.voice} />}

      {/* Reactions row */}
      {Object.keys(reactions).length > 0 && (
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {Object.entries(reactions).sort((a, b) => b[1] - a[1]).map(([emoji, n]) => (
            <button
              key={emoji}
              onClick={() => pickReaction(emoji)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition',
                myReaction === emoji
                  ? 'bg-brand-500/20 ring-1 ring-brand-400/40 text-brand-100'
                  : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'
              )}
            >
              <span>{emoji}</span><span className="text-[11px] font-bold">{n}</span>
            </button>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 mt-3 text-slate-400 relative">
        <button onClick={() => void toggleLike()} className={cn('inline-flex items-center gap-1.5 text-sm transition rounded-full px-2 py-1', liked ? 'text-rose-300' : 'hover:text-white hover:bg-white/[0.04]')}>
          <IconHeart className="w-4 h-4" /> {likeCount}
        </button>
        <button className="inline-flex items-center gap-1.5 text-sm hover:text-white hover:bg-white/[0.04] rounded-full px-2 py-1">
          <IconChat className="w-4 h-4" /> {post.commentCount}
        </button>
        <div className="relative">
          <button onClick={() => setShowReactions((v) => !v)} className="inline-flex items-center gap-1.5 text-sm hover:text-white hover:bg-white/[0.04] rounded-full px-2 py-1">
            <IconBolt className="w-4 h-4" /> React
          </button>
          {showReactions && (
            <div className="absolute bottom-full mb-1.5 left-0 z-10 rounded-full bg-canvas-soft border border-white/15 shadow-xl shadow-black/40 flex gap-0.5 px-1.5 py-1.5">
              {REACTION_EMOJI.map((e) => (
                <button
                  key={e}
                  onClick={() => pickReaction(e)}
                  className="text-lg w-8 h-8 rounded-full hover:bg-white/10 hover:scale-125 transition"
                >{e}</button>
              ))}
            </div>
          )}
        </div>
        <button className="inline-flex items-center gap-1.5 text-sm hover:text-white hover:bg-white/[0.04] rounded-full px-2 py-1">
          ↗ <span>{post.shareCount ?? 0}</span>
        </button>
        <button onClick={() => void toggleSave()} className={cn('inline-flex items-center gap-1.5 text-sm transition ml-auto rounded-full px-2 py-1', saved ? 'text-amber-300' : 'hover:text-white hover:bg-white/[0.04]')}>
          <IconBookmark className="w-4 h-4" /> {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── Composer with type picker ─────────────────────────────────────────────

function Composer({ onPosted }: { onPosted: () => void }): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const [text, setText] = useState('')
  const [kind, setKind] = useState<PostKind>('text')
  const [posting, setPosting] = useState(false)

  const submit = async (): Promise<void> => {
    const me = backend.currentUserId()
    if (!me || !text.trim()) return
    setPosting(true)
    const base = { authorId: me, kind, text: text.trim() }
    if (kind === 'achievement') {
      await backend.createPost({
        ...base,
        achievement: { title: 'Achievement', emoji: '🏆', description: text.trim() }
      })
    } else if (kind === 'study-session') {
      await backend.createPost({
        ...base,
        studySession: {
          topic: text.trim(),
          language: profile?.targetLanguage ?? 'en',
          level: profile?.level ?? 'B1',
          whenISO: new Date(Date.now() + 60 * 60_000).toISOString(),
          durationMin: 60,
          capacity: 8,
          joinedIds: []
        }
      })
    } else {
      await backend.createPost(base)
    }
    setText('')
    setKind('text')
    setPosting(false)
    onPosted()
  }

  const placeholder: Record<PostKind, string> = {
    text: 'Share a thought, tip, or update…',
    question: 'Ask a question (e.g. "When do I use \'have been\'?")',
    resource: 'Title + describe the resource you\'re sharing…',
    achievement: 'What did you just achieve? (e.g. "First 30-day streak!")',
    poll: 'Ask a question — options come next…',
    'study-session': 'Topic for the live study session…',
    voice: 'Caption your voice clip…'
  }

  return (
    <div className="rounded-card border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <AvatarCircle name={profile?.name?.trim() || 'You'} size="sm" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) void submit() }}
          placeholder={placeholder[kind]}
          rows={kind === 'text' ? 1 : 2}
          className="flex-1 rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none resize-none"
        />
      </div>
      <div className="flex items-center gap-1.5 mt-3 pl-11 flex-wrap">
        {(['text', 'question', 'resource', 'achievement', 'poll', 'study-session', 'voice'] as PostKind[]).map((k) => {
          const m = KIND[k]
          const active = kind === k
          return (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition border',
                active ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
              )}
            >
              <m.Icon className="w-3.5 h-3.5" /> {m.label}
            </button>
          )
        })}
        <button
          onClick={() => void submit()}
          disabled={posting || !text.trim()}
          className="btn-primary text-xs px-4 py-1.5 ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  )
}

export default function CommunityPage(): JSX.Element {
  const [filter, setFilter] = useState<Filter>('recent')
  const feed = useBackendQuery(() => backend.listFeed(), [], [])
  const authors = useBackendQuery(async () => {
    const ids = Array.from(new Set(feed.data.map((p) => p.authorId)))
    const users = await Promise.all(ids.map((id) => backend.getUser(id)))
    const map: Record<string, PlatformUser> = {}
    for (const u of users) if (u) map[u.id] = u
    return map
  }, [feed.data], {} as Record<string, PlatformUser>)

  const sorted = (() => {
    if (filter === 'popular') return [...feed.data].sort((a, b) => b.likeCount - a.likeCount)
    return feed.data
  })()

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-5xl mx-auto w-full">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Community</h1>
            <p className="text-sm text-slate-400 mt-1">Share resources, ask questions, vote on polls, join live sessions.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-200 text-xs font-bold px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {feed.data.length} posts today
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          {/* Feed */}
          <div className="flex flex-col gap-4">
            <Composer onPosted={feed.refresh} />
            <Tabs items={FILTERS} active={filter} onChange={setFilter} className="self-start" />
            {sorted.length === 0 && !feed.loading && (
              <div className="rounded-card border border-white/10 bg-white/[0.025] p-6 text-center text-sm text-slate-400">
                No posts yet — be the first.
              </div>
            )}
            {sorted.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                author={authors.data[p.authorId] ?? null}
                onAfterChange={feed.refresh}
              />
            ))}
          </div>

          {/* Right rail */}
          <aside className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Active challenges</p>
              </div>
              <div className="flex flex-col gap-2">
                {CHALLENGES.map((c) => (
                  <div key={c.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                    <p className="text-sm font-semibold text-white">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.people}</p>
                    <button className="text-xs font-semibold text-brand-300 hover:text-brand-200 mt-2">Join →</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Popular groups</p>
                <button className="text-brand-300 hover:text-brand-200"><IconPlus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-col gap-2">
                {GROUPS.map((g) => (
                  <div key={g.title} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                    <span className="w-9 h-9 rounded-xl bg-grad-brand flex items-center justify-center text-white text-xs font-bold">{g.title[0]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{g.title}</p>
                      <p className="text-xs text-slate-500">{g.people} members</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Now live</p>
              <div className="rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-500/10 to-pink-500/10 p-3">
                <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> 3 streams live
                </p>
                <p className="text-sm font-semibold text-white mt-1">Coffee chat · Free talk</p>
                <p className="text-[11px] text-slate-400">Marco B. · 124 watching</p>
                <button className="text-xs font-semibold text-rose-300 hover:text-rose-200 mt-2">Watch →</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
