import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type {
  Challenge,
  Group,
  LeaderboardRow,
  PlatformUser,
  Post,
  PostKind,
  SearchResults
} from '@shared/types'
import { cn } from '../../lib/classnames'
import { AvatarCircle, Tabs, type TabItem } from '../../components/ui'
import {
  IconBolt,
  IconBook,
  IconBookmark,
  IconChat,
  IconChart,
  IconFilm,
  IconHeart,
  IconImage,
  IconMic,
  IconPlay,
  IconPlus,
  IconSearch,
  IconStop,
  IconStar,
  IconTrophy,
  IconUsers,
  IconVolume,
  IconX,
  IconYouTube,
  type IconProps
} from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { social, meId, ensureSocialBootstrap } from '../../services/backend/social'
import { uploadUrl } from '../../services/backend/storage'
import CommentsSection from '../../components/CommentsSection'
import { daysUntil, timeAgo } from '../../lib/time'

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
const ACHIEVEMENT_EMOJI = ['🏆', '🔥', '🎯', '⭐', '🥇', '📚', '🎓', '💪', '🚀', '🧠'] as const

const GROUP_COVERS = [
  'from-rose-500 to-pink-700',
  'from-sky-500 to-blue-700',
  'from-violet-500 to-purple-700',
  'from-amber-500 to-orange-700',
  'from-emerald-500 to-teal-700'
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
  if (resource.kind === 'image') {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/20">
        <img src={resource.url} alt={resource.title ?? 'Image'} className="w-full max-h-[28rem] object-contain" />
      </div>
    )
  }
  if (resource.kind === 'video') {
    return (
      <div className="mt-3 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black">
        <video src={resource.url} controls preload="metadata" className="w-full max-h-[28rem]" />
      </div>
    )
  }
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

function PollBody({ poll: initialPoll, postId }: { poll: NonNullable<Post['poll']>; postId: string }): JSX.Element {
  // Real, persisted voting via the Backend (poll_votes table / local store).
  // Tallies survive reload; the viewer can change or withdraw their vote.
  const me = backend.currentUserId()
  const [poll, setPoll] = useState<NonNullable<Post['poll']>>(initialPoll)
  const [voted, setVoted] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setPoll(initialPoll)
    if (!me) { setVoted(null); return }
    void backend.myPollVote(me, postId).then(setVoted)
  }, [me, postId, initialPoll])

  const total = poll.options.reduce((acc, o) => acc + o.votes, 0)
  const showResults = voted != null

  const vote = async (optionId: string): Promise<void> => {
    if (!me || busy) return
    setBusy(true)
    try {
      const res = await backend.votePoll(me, postId, optionId)
      setPoll(res.poll)
      setVoted(res.myVote)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {poll.options.map((o) => {
        const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0
        const isVoted = voted === o.id
        return (
          <button
            key={`${postId}-${o.id}`}
            onClick={() => void vote(o.id)}
            disabled={busy || !me}
            className={cn(
              'relative rounded-xl border px-3 py-2 text-left transition overflow-hidden disabled:cursor-not-allowed',
              !isVoted && 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer',
              isVoted && 'border-brand-400/60 bg-brand-500/10'
            )}
          >
            {showResults && (
              <span
                className={cn('absolute inset-y-0 left-0 -z-0 transition-[width] duration-500', isVoted ? 'bg-brand-500/20' : 'bg-white/[0.04]')}
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="relative flex items-center justify-between gap-3">
              <span className={cn('text-sm', isVoted ? 'text-white font-bold' : 'text-slate-200')}>{o.label}</span>
              {showResults && <span className="text-xs font-bold text-slate-300 shrink-0">{pct}%</span>}
            </div>
          </button>
        )
      })}
      <p className="text-[10px] text-slate-500 mt-0.5">
        {total.toLocaleString()} vote{total === 1 ? '' : 's'}
        {showResults && ' · tap your choice again to undo'}
        {!me && ' · sign in to vote'}
      </p>
    </div>
  )
}

function StudySessionBody({ s, postId }: { s: NonNullable<Post['studySession']>; postId: string }): JSX.Element {
  const navigate = useNavigate()
  const me = backend.currentUserId()
  const [joinedIds, setJoinedIds] = useState<string[]>(s.joinedIds)
  const [busy, setBusy] = useState(false)
  useEffect(() => { setJoinedIds(s.joinedIds) }, [s.joinedIds])

  const joined = !!me && joinedIds.includes(me)
  const seatsLeft = Math.max(0, s.capacity - joinedIds.length)
  const full = seatsLeft === 0 && !joined

  const toggle = async (): Promise<void> => {
    if (!me || busy) return
    if (full) return
    setBusy(true)
    try {
      const res = await backend.joinStudySession(me, postId)
      setJoinedIds(res.joinedIds)
      if (res.joined) navigate('/meet')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-500/10 to-amber-500/10 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center rounded-full bg-rose-500/30 text-rose-100 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">Live session</span>
        <span className="text-[11px] text-rose-200">{relUntil(s.whenISO)} · {s.durationMin} min</span>
      </div>
      <p className="text-base font-bold text-white">{s.topic}</p>
      <p className="text-xs text-slate-300 mt-1">{s.language.toUpperCase()} · {s.level} · {joinedIds.length}/{s.capacity} joined · {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left</p>
      <button
        onClick={() => void toggle()}
        disabled={busy || !me || full}
        className={cn(
          'w-full mt-3 py-2 text-sm rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed',
          joined ? 'bg-white/[0.08] text-rose-100 hover:bg-white/[0.12] ring-1 ring-rose-400/40' : 'btn-primary'
        )}
      >
        {!me ? 'Sign in to join' : full ? 'Session full' : joined ? 'Joined ✓ · Open room' : 'Join session'}
      </button>
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
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mm = String(Math.floor(v.durationSec / 60)).padStart(2, '0')
  const ss = String(v.durationSec % 60).padStart(2, '0')

  const toggle = (): void => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) { void el.play(); setPlaying(true) }
    else { el.pause(); setPlaying(false) }
  }

  return (
    <div className="mt-3 rounded-2xl border border-pink-400/30 bg-pink-500/[0.08] p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          disabled={!v.audioUrl}
          className="w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-400 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
        >
          {playing ? <IconStop className="w-4 h-4" /> : <IconPlay className="w-5 h-5 ml-0.5" />}
        </button>
        <div className="flex-1">
          <div className="flex items-end gap-0.5 h-6 mb-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <span key={i} className={cn('flex-1 rounded-t', playing ? 'bg-pink-200' : 'bg-pink-300/70')} style={{ height: `${30 + Math.abs(Math.sin(i * 0.4)) * 60}%` }} />
            ))}
          </div>
          <p className="text-[11px] text-pink-200 font-mono">{mm}:{ss}</p>
        </div>
      </div>
      {v.audioUrl && (
        <audio ref={audioRef} src={v.audioUrl} onEnded={() => setPlaying(false)} className="hidden" />
      )}
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
  const [reacting, setReacting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const meta = KIND[post.kind] ?? KIND.text

  useEffect(() => {
    if (!me) return
    void backend.isLiked(me, post.id).then(setLiked)
    void backend.isSaved(me, { kind: 'post', id: post.id }).then(setSaved)
    void backend.myReaction(me, post.id).then(setMyReaction)
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
  const pickReaction = async (emoji: string): Promise<void> => {
    setShowReactions(false)
    if (!me || reacting) return
    setReacting(true)
    try {
      const res = await backend.reactToPost(me, post.id, emoji)
      setReactions(res.reactions)
      setMyReaction(res.myReaction)
    } finally {
      setReacting(false)
    }
  }

  return (
    <div className="rounded-card border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => author && navigate(`/channel?id=${author.id}`)}><AvatarCircle name={author?.name ?? '?'} src={(author as { avatarUrl?: string } | null)?.avatarUrl} size="sm" /></button>
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
      {post.kind === 'study-session' && post.studySession && <StudySessionBody s={post.studySession} postId={post.id} />}
      {post.kind === 'achievement' && post.achievement && <AchievementBody a={post.achievement} />}
      {post.kind === 'voice' && post.voice && <VoiceBody v={post.voice} />}

      {/* Reactions row */}
      {Object.keys(reactions).length > 0 && (
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {Object.entries(reactions).sort((a, b) => b[1] - a[1]).map(([emoji, n]) => (
            <button
              key={emoji}
              onClick={() => void pickReaction(emoji)}
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
        <button onClick={() => setShowComments((v) => !v)} className={cn('inline-flex items-center gap-1.5 text-sm rounded-full px-2 py-1 transition', showComments ? 'text-brand-200 bg-brand-500/10' : 'hover:text-white hover:bg-white/[0.04]')}>
          <IconChat className="w-4 h-4" /> {commentCount}
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
                  onClick={() => void pickReaction(e)}
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

      {/* Threaded comments — persisted via the backend (comments table). */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/[0.07]">
          <CommentsSection targetKind="post" targetId={post.id} onCountChange={setCommentCount} />
        </div>
      )}
    </div>
  )
}

// ─── Voice recorder (MediaRecorder → upload) ────────────────────────────────

function VoiceRecorder({
  value,
  onChange
}: {
  value: { audioUrl: string; durationSec: number } | null
  onChange: (v: { audioUrl: string; durationSec: number } | null) => void
}): JSX.Element {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = (): void => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  useEffect(() => () => {
    stopTimer()
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop())
  }, [])

  const start = async (): Promise<void> => {
    setError(null)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Recording is not supported here.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        const ext = (rec.mimeType || 'audio/webm').includes('ogg') ? 'ogg' : 'webm'
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type })
        setUploading(true)
        void uploadUrl(file, 'posts')
          .then((url) => onChange({ audioUrl: url, durationSec }))
          .catch((e) => setError(e instanceof Error ? e.message : 'Upload failed'))
          .finally(() => setUploading(false))
      }
      recorderRef.current = rec
      startedAtRef.current = Date.now()
      rec.start()
      setRecording(true)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch {
      setError('Microphone permission denied.')
    }
  }

  const stop = (): void => {
    stopTimer()
    setRecording(false)
    recorderRef.current?.stop()
  }

  const fmt = (s: number): string => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (value) {
    return (
      <div className="rounded-xl border border-pink-400/30 bg-pink-500/[0.08] p-3 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-pink-500/80 text-white flex items-center justify-center shrink-0"><IconMic className="w-4 h-4" /></span>
        <audio src={value.audioUrl} controls className="flex-1 h-9" />
        <span className="text-[11px] text-pink-200 font-mono shrink-0">{fmt(value.durationSec)}</span>
        <button onClick={() => onChange(null)} className="text-slate-400 hover:text-rose-300 shrink-0" title="Re-record"><IconX className="w-4 h-4" /></button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 flex items-center gap-3">
      <button
        onClick={() => (recording ? stop() : void start())}
        disabled={uploading}
        className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white transition shrink-0', recording ? 'bg-rose-500 hover:bg-rose-400 animate-pulse' : 'bg-pink-500 hover:bg-pink-400 disabled:opacity-50')}
      >
        {recording ? <IconStop className="w-4 h-4" /> : <IconMic className="w-5 h-5" />}
      </button>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{uploading ? 'Saving clip…' : recording ? 'Recording…' : 'Record a voice clip'}</p>
        <p className="text-[11px] text-slate-400 font-mono">{recording ? fmt(elapsed) : error ?? 'Tap the mic to start'}</p>
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
  // Rich-payload capture so poll/resource posts a learner creates match the feed
  // (previously these set only the kind label → broken polls, no attachment).
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [resourceUrl, setResourceUrl] = useState('')
  // Uploaded photo / video attachment (any kind).
  const [media, setMedia] = useState<{ kind: 'image' | 'video'; url: string; name: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  // Achievement picker.
  const [achEmoji, setAchEmoji] = useState<string>(ACHIEVEMENT_EMOJI[0])
  const [achTitle, setAchTitle] = useState('')
  // Recorded voice clip.
  const [voice, setVoice] = useState<{ audioUrl: string; durationSec: number } | null>(null)
  const photoInput = useRef<HTMLInputElement | null>(null)
  const videoInput = useRef<HTMLInputElement | null>(null)

  const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean)
  const canSubmit =
    !posting &&
    (kind === 'poll'
      ? !!text.trim() && validOptions.length >= 2
      : kind === 'resource'
        ? !!resourceUrl.trim()
        : kind === 'voice'
          ? !!voice
          : kind === 'achievement'
            ? !!text.trim()
            : !!text.trim() || !!media)

  const reset = (): void => {
    setText('')
    setKind('text')
    setPollOptions(['', ''])
    setResourceUrl('')
    setMedia(null)
    setUploadError(null)
    setAchEmoji(ACHIEVEMENT_EMOJI[0])
    setAchTitle('')
    setVoice(null)
  }

  const pickMedia = async (file: File | undefined, mediaKind: 'image' | 'video'): Promise<void> => {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadUrl(file, 'posts')
      setMedia({ kind: mediaKind, url, name: file.name })
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (photoInput.current) photoInput.current.value = ''
      if (videoInput.current) videoInput.current.value = ''
    }
  }

  const submit = async (): Promise<void> => {
    const me = backend.currentUserId()
    if (!me || !canSubmit || posting) return
    setPosting(true)
    const base = { authorId: me, kind, text: text.trim() }
    try {
      if (kind === 'achievement') {
        await backend.createPost({
          ...base,
          achievement: { title: achTitle.trim() || 'Achievement unlocked', emoji: achEmoji, description: text.trim() }
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
      } else if (kind === 'poll') {
        await backend.createPost({
          ...base,
          poll: {
            question: text.trim(),
            options: validOptions.map((label, i) => ({ id: String.fromCharCode(97 + i), label, votes: 0 }))
          }
        })
      } else if (kind === 'voice' && voice) {
        await backend.createPost({ ...base, voice: { durationSec: voice.durationSec, audioUrl: voice.audioUrl } })
      } else if (kind === 'resource') {
        const url = resourceUrl.trim()
        const rkind: 'youtube' | 'pdf' | 'audio' = /youtu\.?be/i.test(url)
          ? 'youtube'
          : /\.pdf($|\?)/i.test(url)
            ? 'pdf'
            : /\.(mp3|wav|m4a|ogg)($|\?)/i.test(url)
              ? 'audio'
              : 'youtube'
        await backend.createPost({ ...base, resource: { kind: rkind, url, title: text.trim() || undefined } })
      } else if (media) {
        // Photo/video attachment on a text or question post.
        await backend.createPost({ ...base, resource: { kind: media.kind, url: media.url, title: text.trim() || undefined } })
      } else {
        await backend.createPost(base)
      }
      reset()
      onPosted()
    } finally {
      setPosting(false)
    }
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

      {/* Poll options — at least two needed to post a poll */}
      {kind === 'poll' && (
        <div className="mt-3 pl-11 flex flex-col gap-2">
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 w-4">{String.fromCharCode(65 + i)}</span>
              <input
                value={opt}
                onChange={(e) => setPollOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
              />
              {pollOptions.length > 2 && (
                <button onClick={() => setPollOptions((prev) => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-rose-300 text-lg leading-none px-1" title="Remove">×</button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button onClick={() => setPollOptions((prev) => [...prev, ''])} className="self-start text-xs font-semibold text-brand-300 hover:text-brand-200 pl-6">+ Add option</button>
          )}
        </div>
      )}

      {/* Resource link — YouTube / PDF / audio URL */}
      {kind === 'resource' && (
        <div className="mt-3 pl-11">
          <input
            value={resourceUrl}
            onChange={(e) => setResourceUrl(e.target.value)}
            placeholder="Paste a YouTube, PDF or audio link…"
            className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
          />
        </div>
      )}

      {/* Achievement picker — emoji + title; the text box becomes the description */}
      {kind === 'achievement' && (
        <div className="mt-3 pl-11 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {ACHIEVEMENT_EMOJI.map((e) => (
              <button
                key={e}
                onClick={() => setAchEmoji(e)}
                className={cn('text-xl w-9 h-9 rounded-xl transition', achEmoji === e ? 'bg-amber-500/25 ring-1 ring-amber-400/50' : 'bg-white/[0.04] hover:bg-white/[0.08]')}
              >{e}</button>
            ))}
          </div>
          <input
            value={achTitle}
            onChange={(e) => setAchTitle(e.target.value)}
            placeholder="Achievement title (e.g. 30-day streak)"
            className="w-full rounded-xl bg-white/[0.05] border border-white/10 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
          />
        </div>
      )}

      {/* Voice recorder — records a clip, uploads it, stores audioUrl on the post */}
      {kind === 'voice' && (
        <div className="mt-3 pl-11">
          <VoiceRecorder value={voice} onChange={setVoice} />
        </div>
      )}

      {/* Uploaded photo / video preview */}
      {media && (
        <div className="mt-3 pl-11">
          <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black/30">
            {media.kind === 'image'
              ? <img src={media.url} alt={media.name} className="w-full max-h-72 object-contain" />
              : <video src={media.url} controls preload="metadata" className="w-full max-h-72" />}
            <button
              onClick={() => setMedia(null)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center"
              title="Remove"
            ><IconX className="w-4 h-4" /></button>
          </div>
        </div>
      )}
      {uploadError && <p className="mt-2 pl-11 text-xs text-rose-300">{uploadError}</p>}

      {/* Hidden file inputs driven by the attach buttons below */}
      <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={(e) => void pickMedia(e.target.files?.[0], 'image')} />
      <input ref={videoInput} type="file" accept="video/*" className="hidden" onChange={(e) => void pickMedia(e.target.files?.[0], 'video')} />

      <div className="flex items-center gap-1.5 mt-3 pl-11 flex-wrap">
        <button
          onClick={() => photoInput.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition border bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] disabled:opacity-50"
          title="Attach a photo"
        >
          <IconImage className="w-3.5 h-3.5" /> Photo
        </button>
        <button
          onClick={() => videoInput.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition border bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08] disabled:opacity-50"
          title="Attach a video"
        >
          <IconFilm className="w-3.5 h-3.5" /> {uploading ? 'Uploading…' : 'Video'}
        </button>
        <span className="w-px h-5 bg-white/10 mx-0.5" />
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
          disabled={posting || !canSubmit}
          className="btn-primary text-xs px-4 py-1.5 ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  )
}

// ─── Mega-search ─────────────────────────────────────────────────────────────

function MegaSearch(): JSX.Element {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setResults(null)
      return
    }
    setBusy(true)
    const handle = setTimeout(() => {
      void social.search(term, { limit: 6 }).then((r) => {
        setResults(r)
        setBusy(false)
      })
    }, 200)
    return () => clearTimeout(handle)
  }, [q])

  const go = (to: string): void => {
    setOpen(false)
    setQ('')
    navigate(to)
  }

  return (
    <div className="relative w-full max-w-md">
      <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search courses, clips, lessons, people, groups…"
        className="input pl-9 text-sm w-full"
      />
      {open && q.trim().length >= 2 && (
        <div className="absolute z-30 mt-2 w-full max-h-[70vh] overflow-y-auto rounded-card border border-white/12 bg-canvas-soft shadow-2xl shadow-black/50 p-2">
          {busy && !results ? (
            <p className="px-3 py-4 text-xs text-slate-500">Searching…</p>
          ) : results && results.total === 0 ? (
            <p className="px-3 py-4 text-xs text-slate-500">No results for “{results.query}”.</p>
          ) : results ? (
            <div className="flex flex-col gap-1">
              <SearchGroup title="People" show={results.users.length > 0}>
                {results.users.map((u) => (
                  <button key={u.id} onMouseDown={() => go('/explore')} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.05] text-left">
                    <AvatarCircle name={u.name} size="sm" />
                    <span className="text-sm text-white">{u.name}</span>
                    <span className="text-[10px] text-slate-500 ml-auto capitalize">{u.role}</span>
                  </button>
                ))}
              </SearchGroup>
              <SearchGroup title="Courses" show={results.courses.length > 0}>
                {results.courses.map((c) => (
                  <button key={c.id} onMouseDown={() => go('/courses')} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.05] text-left">
                    <span className={cn('w-7 h-7 rounded-lg bg-gradient-to-br shrink-0', c.cover)} />
                    <span className="text-sm text-white truncate">{c.title}</span>
                    <span className="text-[10px] text-slate-500 ml-auto">{c.level}</span>
                  </button>
                ))}
              </SearchGroup>
              <SearchGroup title="Clips" show={results.clips.length > 0}>
                {results.clips.map((c) => (
                  <button key={c.id} onMouseDown={() => go('/clips')} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.05] text-left">
                    <span className={cn('w-7 h-7 rounded-lg bg-gradient-to-br shrink-0', c.cover)} />
                    <span className="text-sm text-white truncate">{c.title}</span>
                    <span className="text-[10px] text-slate-500 ml-auto truncate">{c.artist}</span>
                  </button>
                ))}
              </SearchGroup>
              <SearchGroup title="Lessons" show={results.lessons.length > 0}>
                {results.lessons.map((l) => (
                  <button key={l.lessonId} onMouseDown={() => go('/courses')} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.05] text-left">
                    <IconBook className="w-4 h-4 text-violet-300 shrink-0" />
                    <span className="text-sm text-white truncate">{l.title}</span>
                    <span className="text-[10px] text-slate-500 ml-auto truncate">{l.courseTitle}</span>
                  </button>
                ))}
              </SearchGroup>
              <SearchGroup title="Groups" show={results.groups.length > 0}>
                {results.groups.map((g) => (
                  <button key={g.id} onMouseDown={() => go('/community')} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.05] text-left">
                    <span className="w-7 h-7 rounded-lg bg-grad-brand flex items-center justify-center text-white text-[11px] font-bold shrink-0">{g.name[0]}</span>
                    <span className="text-sm text-white truncate">{g.name}</span>
                  </button>
                ))}
              </SearchGroup>
              <SearchGroup title="Posts" show={results.posts.length > 0}>
                {results.posts.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/[0.05]">
                    <IconChat className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-200 truncate">{p.text}</span>
                  </div>
                ))}
              </SearchGroup>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function SearchGroup({ title, show, children }: { title: string; show: boolean; children: React.ReactNode }): JSX.Element | null {
  if (!show) return null
  return (
    <div className="mb-1">
      <p className="px-2 py-1 text-[10px] uppercase tracking-widest text-slate-500 font-bold">{title}</p>
      {children}
    </div>
  )
}

// ─── Groups & clubs ──────────────────────────────────────────────────────────

function GroupsView(): JSX.Element {
  const me = meId()
  const profile = useAppStore((s) => s.profile)
  const [groups, setGroups] = useState<Group[]>([])
  const [myIds, setMyIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [q, setQ] = useState('')

  const reload = useCallback(async () => {
    const [all, mine] = await Promise.all([backend.listGroups(), backend.myGroups(me)])
    setGroups(all)
    setMyIds(new Set(mine.map((g) => g.id)))
  }, [me])

  useEffect(() => {
    void reload()
  }, [reload])

  const toggle = async (g: Group): Promise<void> => {
    if (myIds.has(g.id)) await backend.leaveGroup(me, g.id)
    else await backend.joinGroup(me, g.id)
    await reload()
  }

  const filtered = groups.filter((g) => !q.trim() || g.name.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search groups & clubs" className="input pl-9 text-sm" />
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 shrink-0">
          <IconPlus className="w-4 h-4" /> Create
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((g) => {
          const joined = myIds.has(g.id)
          return (
            <article key={g.id} className="rounded-card border border-white/10 bg-white/[0.025] overflow-hidden">
              <div className={cn('h-20 bg-gradient-to-br relative', g.cover)}>
                {g.imageUrl && <img src={g.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <p className="text-sm font-bold text-white">{g.name}</p>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 min-h-[2.4em]">{g.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                    <IconUsers className="w-3.5 h-3.5" /> {g.memberCount.toLocaleString()} members
                  </span>
                  <button
                    onClick={() => void toggle(g)}
                    className={cn(
                      'text-xs font-semibold rounded-lg px-3 py-1.5 transition',
                      joined ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-grad-brand text-white hover:brightness-110'
                    )}
                  >
                    {joined ? 'Joined ✓' : 'Join'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {creating && (
        <CreateGroupModal
          ownerId={me}
          defaultLanguage={profile?.targetLanguage ?? 'en'}
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false)
            await reload()
          }}
        />
      )}
    </div>
  )
}

function CreateGroupModal({
  ownerId,
  defaultLanguage,
  onClose,
  onCreated
}: {
  ownerId: string
  defaultLanguage: Group['language']
  onClose: () => void
  onCreated: () => Promise<void>
}): JSX.Element {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [coverIdx, setCoverIdx] = useState(0)
  const [saving, setSaving] = useState(false)

  const create = async (): Promise<void> => {
    if (name.trim().length < 3 || saving) return
    setSaving(true)
    try {
      await backend.upsertGroup({
        id: `g_${Math.random().toString(36).slice(2, 9)}`,
        name: name.trim(),
        description: description.trim() || 'A new community group.',
        language: defaultLanguage,
        ownerId,
        cover: GROUP_COVERS[coverIdx],
        visibility: 'public',
        memberCount: 1,
        createdAt: new Date().toISOString()
      })
      await onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-card border border-white/12 bg-canvas-soft p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Create a group or club</h3>
        <div className="flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input text-sm" placeholder="Group name (e.g. Morning Speaking Crew)" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input text-sm min-h-[80px] resize-none" placeholder="What's this group about?" />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Cover</p>
            <div className="flex gap-2">
              {GROUP_COVERS.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setCoverIdx(i)}
                  className={cn('h-9 flex-1 rounded-lg bg-gradient-to-br transition', c, coverIdx === i ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100')}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="btn-ghost text-xs px-4 py-2">Cancel</button>
          <button onClick={() => void create()} disabled={name.trim().length < 3 || saving} className="btn-primary text-xs px-4 py-2">
            {saving ? 'Creating…' : 'Create group'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Challenges & events (with leaderboards) ─────────────────────────────────

function ChallengesView(): JSX.Element {
  const me = meId()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [joined, setJoined] = useState<Set<string>>(new Set())
  const [leaderboard, setLeaderboard] = useState<{ challenge: Challenge; rows: LeaderboardRow[] } | null>(null)

  const reload = useCallback(async () => {
    const [all, mine] = await Promise.all([backend.listChallenges(), backend.myChallenges(me)])
    setChallenges(all)
    setJoined(new Set(mine.map((m) => m.challenge.id)))
  }, [me])

  useEffect(() => {
    void reload()
  }, [reload])

  const join = async (c: Challenge): Promise<void> => {
    if (joined.has(c.id)) await backend.leaveChallenge(me, c.id)
    else await backend.joinChallenge(me, c.id)
    await reload()
  }

  const openBoard = async (c: Challenge): Promise<void> => {
    const rows = await social.challengeLeaderboard(c.id)
    setLeaderboard({ challenge: c, rows })
  }

  return (
    <div className="flex flex-col gap-3">
      {challenges.length === 0 && <p className="text-sm text-slate-500">No active challenges right now.</p>}
      {challenges.map((c) => {
        const left = daysUntil(c.endsAt)
        const isJoined = joined.has(c.id)
        return (
          <article key={c.id} className="rounded-card border border-white/10 bg-white/[0.025] overflow-hidden">
            <div className="flex">
              {c.imageUrl ? (
                <div className="w-24 shrink-0 relative bg-white/[0.04]">
                  <img src={c.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              ) : (
                <div className={cn('w-2 bg-gradient-to-b', c.cover)} />
              )}
              <div className="flex-1 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{c.title}</p>
                      <span className="text-[10px] uppercase tracking-widest font-bold rounded-full bg-white/[0.06] text-slate-400 px-2 py-0.5">{c.kind}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{c.description}</p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      🎯 Goal {c.goal} · 👥 {c.participantCount.toLocaleString()} joined · ⏳ {left > 0 ? `${left}d left` : 'ended'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => void join(c)}
                    className={cn(
                      'text-xs font-semibold rounded-lg px-3 py-1.5 transition',
                      isJoined ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-grad-brand text-white hover:brightness-110'
                    )}
                  >
                    {isJoined ? 'Joined ✓' : 'Join challenge'}
                  </button>
                  <button onClick={() => void openBoard(c)} className="text-xs font-semibold rounded-lg px-3 py-1.5 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 inline-flex items-center gap-1.5">
                    <IconTrophy className="w-3.5 h-3.5" /> Leaderboard
                  </button>
                </div>
              </div>
            </div>
          </article>
        )
      })}

      {leaderboard && (
        <LeaderboardModal me={me} data={leaderboard} onClose={() => setLeaderboard(null)} />
      )}
    </div>
  )
}

function LeaderboardModal({
  me,
  data,
  onClose
}: {
  me: string
  data: { challenge: Challenge; rows: LeaderboardRow[] }
  onClose: () => void
}): JSX.Element {
  const { challenge, rows } = data
  const medal = ['🥇', '🥈', '🥉']
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-card border border-white/12 bg-canvas-soft p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-white inline-flex items-center gap-2"><IconTrophy className="w-5 h-5 text-amber-300" /> Leaderboard</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <p className="text-xs text-slate-400 mb-4">{challenge.title} · goal {challenge.goal}</p>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No participants yet — be the first to join.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {rows.map((r, i) => (
              <div
                key={r.userId}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2',
                  r.userId === me ? 'bg-brand-500/15 ring-1 ring-brand-400/40' : 'bg-white/[0.03]'
                )}
              >
                <span className="w-6 text-center text-sm font-bold text-slate-400">{i < 3 ? medal[i] : i + 1}</span>
                <AvatarCircle name={r.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {r.name} {r.userId === me && <span className="text-[10px] text-brand-300">· you</span>}
                  </p>
                  <div className="h-1.5 rounded-full bg-white/[0.06] mt-1 overflow-hidden">
                    <span className={cn('block h-full rounded-full bg-gradient-to-r', challenge.cover)} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{r.progress}</p>
                  {r.completed && <p className="text-[10px] text-emerald-300">done ✓</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Right rail (real data) ──────────────────────────────────────────────────

function RightRail({ onSeeGroups, onSeeChallenges }: { onSeeGroups: () => void; onSeeChallenges: () => void }): JSX.Element {
  const navigate = useNavigate()
  const challenges = useBackendQuery(() => backend.listChallenges({ active: true }), [], [])
  const groups = useBackendQuery(() => backend.listGroups(), [], [])
  const live = useBackendQuery(() => backend.listLiveNow(), [], [])

  return (
    <aside className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Active challenges</p>
          <button onClick={onSeeChallenges} className="text-[11px] text-brand-300 hover:text-brand-200 font-semibold">See all</button>
        </div>
        <div className="flex flex-col gap-2">
          {challenges.data.slice(0, 2).map((c) => (
            <button key={c.id} onClick={onSeeChallenges} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3 text-left hover:bg-white/[0.05]">
              <p className="text-sm font-semibold text-white">{c.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.participantCount.toLocaleString()} joined · {daysUntil(c.endsAt)}d left</p>
            </button>
          ))}
          {challenges.data.length === 0 && <p className="text-xs text-slate-500">No active challenges.</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Popular groups</p>
          <button onClick={onSeeGroups} className="text-brand-300 hover:text-brand-200"><IconPlus className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-col gap-2">
          {groups.data.slice(0, 3).map((g) => (
            <button key={g.id} onClick={onSeeGroups} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-left hover:bg-white/[0.05]">
              <span className="w-9 h-9 rounded-xl bg-grad-brand flex items-center justify-center text-white text-xs font-bold overflow-hidden relative">
                {g.imageUrl ? <img src={g.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" /> : g.name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{g.name}</p>
                <p className="text-xs text-slate-500">{g.memberCount.toLocaleString()} members</p>
              </div>
            </button>
          ))}
          {groups.data.length === 0 && <p className="text-xs text-slate-500">No groups yet.</p>}
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Now live</p>
        {live.data.length === 0 ? (
          <p className="text-xs text-slate-500">No streams live right now.</p>
        ) : (
          <button onClick={() => navigate('/live')} className="block w-full text-left rounded-2xl border border-rose-400/30 bg-gradient-to-br from-rose-500/10 to-pink-500/10 overflow-hidden hover:brightness-110">
            {live.data[0].imageUrl && (
              <div className="relative h-24">
                <img src={live.data[0].imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              </div>
            )}
            <div className="p-3">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> {live.data.length} stream{live.data.length === 1 ? '' : 's'} live
              </p>
              <p className="text-sm font-semibold text-white mt-1">{live.data[0].title}</p>
              <p className="text-[11px] text-slate-400">{live.data[0].viewerCount} watching</p>
            </div>
          </button>
        )}
      </div>
    </aside>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export type CommunityView = 'feed' | 'groups' | 'challenges'
type View = CommunityView
export const COMMUNITY_VIEWS: TabItem<View>[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'groups', label: 'Groups & Clubs' },
  { id: 'challenges', label: 'Challenges & Events' }
]
const VIEWS = COMMUNITY_VIEWS

interface CommunityPageProps {
  /** Controlled view — when set, the parent owns the section nav (embedded). */
  view?: CommunityView
  onViewChange?: (v: CommunityView) => void
  /** Embedded inside the merged Connect page: drop own header/tabs/scroll. */
  embedded?: boolean
}

export default function CommunityPage({ view: viewProp, onViewChange, embedded }: CommunityPageProps = {}): JSX.Element {
  const navigate = useNavigate()
  const [viewState, setViewState] = useState<View>('feed')
  const view = viewProp ?? viewState
  const setView = (v: View): void => { onViewChange ? onViewChange(v) : setViewState(v) }
  const [filter, setFilter] = useState<Filter>('recent')
  const feed = useBackendQuery(() => backend.listFeed(), [], [])
  const me = backend.currentUserId()
  const following = useBackendQuery(
    () => (me ? backend.following(me) : Promise.resolve([])),
    [me],
    [] as PlatformUser[]
  )
  const authors = useBackendQuery(async () => {
    const ids = Array.from(new Set(feed.data.map((p) => p.authorId)))
    const users = await Promise.all(ids.map((id) => backend.getUser(id)))
    const map: Record<string, PlatformUser> = {}
    for (const u of users) if (u) map[u.id] = u
    return map
  }, [feed.data], {} as Record<string, PlatformUser>)

  // Populate groups/challenges/DMs/learner history on first open.
  useEffect(() => {
    void ensureSocialBootstrap().then(() => feed.refresh())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sorted = (() => {
    if (filter === 'popular') return [...feed.data].sort((a, b) => b.likeCount - a.likeCount)
    if (filter === 'following') {
      const ids = new Set(following.data.map((u) => u.id))
      return feed.data.filter((p) => ids.has(p.authorId))
    }
    return feed.data
  })()

  const body = (
    <>
        {!embedded && (
          <div className="mb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Community</h1>
              <p className="text-sm text-slate-400 mt-1">Share resources, join groups, compete in challenges, search everything.</p>
            </div>
            <MegaSearch />
          </div>
        )}

        {!embedded && <Tabs items={VIEWS} active={view} onChange={setView} className="self-start mb-5" />}

        {view === 'feed' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
            <div className="flex flex-col gap-4">
              <Composer onPosted={feed.refresh} />
              <Tabs items={FILTERS} active={filter} onChange={setFilter} className="self-start" />
              {filter === 'following' && following.data.length === 0 && (
                <div className="rounded-card border border-white/10 bg-white/[0.025] p-6 text-center text-sm text-slate-400">
                  You're not following anyone yet. Find people on <button onClick={() => navigate('/explore')} className="text-brand-300">Explore</button>.
                </div>
              )}
              {sorted.length === 0 && !feed.loading && filter !== 'following' && (
                <div className="rounded-card border border-white/10 bg-white/[0.025] p-6 text-center text-sm text-slate-400">
                  No posts yet — be the first.
                </div>
              )}
              {sorted.map((p) => (
                <PostCard key={p.id} post={p} author={authors.data[p.authorId] ?? null} onAfterChange={feed.refresh} />
              ))}
            </div>
            <RightRail onSeeGroups={() => setView('groups')} onSeeChallenges={() => setView('challenges')} />
          </div>
        )}

        {view === 'groups' && <GroupsView />}
        {view === 'challenges' && <ChallengesView />}
    </>
  )

  if (embedded) return <div className="flex flex-col gap-1">{body}</div>
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full">{body}</div>
    </div>
  )
}
