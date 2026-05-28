import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PlatformUser, Post } from '@shared/types'
import { cn } from '../../lib/classnames'
import { AvatarCircle, Tabs, type TabItem } from '../../components/ui'
import {
  IconBook,
  IconBookmark,
  IconChat,
  IconHeart,
  IconPlay,
  IconPlus,
  IconVolume,
  IconYouTube
} from '../../components/icons'
import { useAppStore } from '../../store/useAppStore'
import { backend, useBackendQuery } from '../../services/backend/useBackend'

type Filter = 'recent' | 'popular' | 'following'
const FILTERS: TabItem<Filter>[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'popular', label: 'Popular' },
  { id: 'following', label: 'Following' }
]

const CHALLENGES = [
  { title: '7-day speaking streak', people: '1,240 joined' },
  { title: 'Learn 50 new words', people: '870 joined' }
]
const GROUPS = [
  { title: 'IELTS Warriors', people: '3.2k' },
  { title: 'Daily Speaking Club', people: '5.1k' },
  { title: 'Grammar Nerds', people: '1.8k' }
]

// Relative-time helper. Returns "5m" / "2h" / "3d" — good enough for a feed.
function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

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

function PostCard({ post, author, onAfterChange }: { post: Post; author: PlatformUser | null; onAfterChange: () => void }): JSX.Element {
  const navigate = useNavigate()
  const me = backend.currentUserId()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [saved, setSaved] = useState(false)

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

  return (
    <div className="rounded-card border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/channel')}><AvatarCircle name={author?.name ?? '?'} size="sm" /></button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{author?.name ?? 'Unknown'}</span>
            <span className={cn('text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5',
              author?.role === 'teacher' ? 'bg-brand-500/20 text-brand-300' : 'bg-white/10 text-slate-400')}>
              {author?.role ?? 'user'}
            </span>
          </div>
          <span className="text-xs text-slate-500">{relTime(post.createdAt)} ago</span>
        </div>
      </div>

      <p className="text-sm text-slate-200 mt-3 leading-relaxed whitespace-pre-wrap">{post.text}</p>
      {post.resource && <Attachment resource={post.resource} />}

      <div className="flex items-center gap-5 mt-3 text-slate-400">
        <button onClick={() => void toggleLike()} className={cn('inline-flex items-center gap-1.5 text-sm transition', liked ? 'text-rose-300' : 'hover:text-white')}>
          <IconHeart className="w-4 h-4" /> {likeCount}
        </button>
        <button className="inline-flex items-center gap-1.5 text-sm hover:text-white">
          <IconChat className="w-4 h-4" /> {post.commentCount}
        </button>
        <button onClick={() => void toggleSave()} className={cn('inline-flex items-center gap-1.5 text-sm transition ml-auto', saved ? 'text-amber-300' : 'hover:text-white')}>
          <IconBookmark className="w-4 h-4" /> {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function Composer({ onPosted }: { onPosted: () => void }): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  const submit = async (): Promise<void> => {
    const me = backend.currentUserId()
    if (!me || !text.trim()) return
    setPosting(true)
    await backend.createPost({ authorId: me, text: text.trim() })
    setText('')
    setPosting(false)
    onPosted()
  }

  return (
    <div className="rounded-card border border-white/[0.07] bg-white/[0.03] p-4">
      <div className="flex items-center gap-3">
        <AvatarCircle name={profile?.name?.trim() || 'You'} size="sm" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit() } }}
          placeholder="Share a resource or tip with the community…"
          className="flex-1 rounded-pill bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2 mt-3 pl-11">
        {[['Link a video', IconYouTube], ['Upload PDF', IconBook], ['Upload audio', IconVolume]].map(([label, Ico]) => {
          const I = Ico as (p: { className?: string }) => JSX.Element
          return (
            <button key={label as string} className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-white/[0.05] border border-white/10 px-3 py-1.5 text-slate-300 hover:bg-white/10">
              <I className="w-3.5 h-3.5" /> {label as string}
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
  // Co-load all authors in one pass so each PostCard doesn't async-fetch.
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
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Community</h1>
          <p className="text-sm text-slate-400 mt-1">Share resources, learn together, join challenges.</p>
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
          </aside>
        </div>
      </div>
    </div>
  )
}
