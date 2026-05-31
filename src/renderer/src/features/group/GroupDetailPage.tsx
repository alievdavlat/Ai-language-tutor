import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Group, GroupMember, GroupMessage, PlatformUser, Post, PostKind } from '@shared/types'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader } from '../../components/ui'
import {
  IconArrowRight,
  IconBolt,
  IconChat,
  IconHeart,
  IconLock,
  IconStar,
  IconUsers
} from '../../components/icons'
import { backend } from '../../services/backend/useBackend'
import { meId, ensureCommunitySeed } from '../../services/backend/social'
import { getLanguage } from '@shared/constants'
import { clockTime, timeAgo } from '../../lib/time'

type GroupTab = 'feed' | 'chat' | 'members'
const TABS: { id: GroupTab; label: string; Icon: typeof IconChat }[] = [
  { id: 'feed', label: 'Feed', Icon: IconChat },
  { id: 'chat', label: 'Chat', Icon: IconUsers },
  { id: 'members', label: 'Members', Icon: IconUsers }
]

const ROLE_BADGE: Record<GroupMember['role'], { label: string; cls: string; Icon: typeof IconStar } | null> = {
  owner: { label: 'Owner', cls: 'bg-amber-500/15 text-amber-300 ring-amber-400/20', Icon: IconStar },
  moderator: { label: 'Mod', cls: 'bg-sky-500/15 text-sky-300 ring-sky-400/20', Icon: IconBolt },
  member: null
}

/**
 * Group detail — /group/:id. A group's own home: header with the REAL member
 * count (computed from membership rows, not the old vanity seed number), a real
 * members list with roles, a group-scoped feed, and a group chat. #A53.
 */
export default function GroupDetailPage(): JSX.Element {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const me = meId()

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<GroupTab>('feed')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    await ensureCommunitySeed()
    const [g, mem] = await Promise.all([backend.getGroup(id), backend.groupMembership(id)])
    setGroup(g)
    setMembers(mem)
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const myMembership = members.find((m) => m.user.id === me) ?? null
  const isMember = Boolean(myMembership)
  const isOwner = myMembership?.role === 'owner'

  const toggleMembership = async (): Promise<void> => {
    if (busy || !group || isOwner) return
    setBusy(true)
    try {
      if (isMember) await backend.leaveGroup(me, group.id)
      else await backend.joinGroup(me, group.id)
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-1 py-10">
        <div className="h-40 rounded-card bg-white/[0.04] animate-pulse" />
        <div className="h-6 w-48 rounded-lg bg-white/[0.05] mt-5 animate-pulse" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="w-full max-w-4xl mx-auto px-1 py-10">
        <PageHeader eyebrow="Connect" title="Group not found" subtitle="This group may have been removed." back="/community" />
        <button onClick={() => navigate('/community')} className="btn-primary text-sm px-4 py-2 mt-6">
          Back to Groups & Clubs
        </button>
      </div>
    )
  }

  const lang = getLanguage(group.language)
  const memberWord = group.memberCount === 1 ? 'member' : 'members'

  return (
    <div className="w-full max-w-4xl mx-auto px-1 pb-16">
      <div className="pt-1 pb-4">
        <PageHeader
          eyebrow="Connect"
          title="Groups & Clubs"
          back="/community"
          crumbs={[{ label: 'Connect', to: '/community' }, { label: 'Groups & Clubs', to: '/community' }, { label: group.name }]}
        />
      </div>

      {/* ── Hero banner ───────────────────────────────────────────────── */}
      <section className="rounded-card border border-white/10 bg-white/[0.025] overflow-hidden">
        <div className={cn('relative h-40 bg-gradient-to-br', group.cover)}>
          {group.imageUrl && <img src={group.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <span className="absolute top-3 right-3 text-[11px] font-semibold rounded-full bg-black/40 backdrop-blur px-2.5 py-1 text-white inline-flex items-center gap-1.5 ring-1 ring-white/15">
            <span aria-hidden>{lang.flag}</span> {lang.name}
          </span>
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow">{group.name}</h2>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-4">
          <p className="text-sm text-slate-300 leading-relaxed">{group.description}</p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AvatarStack members={members} />
              <span className="text-sm text-slate-300 inline-flex items-center gap-1.5">
                <IconUsers className="w-4 h-4 text-slate-400" />
                <strong className="text-white font-semibold tabular-nums">{group.memberCount.toLocaleString()}</strong> {memberWord}
              </span>
            </div>

            {isOwner ? (
              <span className="text-xs font-semibold rounded-lg px-3.5 py-2 bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20 inline-flex items-center gap-1.5">
                <IconStar className="w-3.5 h-3.5" /> You own this group
              </span>
            ) : (
              <button
                onClick={() => void toggleMembership()}
                disabled={busy}
                className={cn(
                  'text-sm font-semibold rounded-lg px-5 py-2 transition disabled:opacity-60',
                  isMember
                    ? 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.1] ring-1 ring-white/10'
                    : 'bg-grad-brand text-white hover:brightness-110'
                )}
              >
                {isMember ? 'Joined ✓' : 'Join group'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1 mt-5 mb-4 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'text-sm font-medium rounded-xl px-4 py-2 transition inline-flex items-center gap-2',
              tab === t.id ? 'bg-white/[0.08] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <t.Icon className="w-4 h-4" />
            {t.label}
            {t.id === 'members' && <span className="text-[11px] text-slate-500 tabular-nums">{members.length}</span>}
          </button>
        ))}
      </nav>

      {tab === 'feed' && <GroupFeed group={group} me={me} isMember={isMember} members={members} onJoin={toggleMembership} />}
      {tab === 'chat' && <GroupChat group={group} me={me} isMember={isMember} members={members} onJoin={toggleMembership} />}
      {tab === 'members' && <MembersList members={members} me={me} />}
    </div>
  )
}

// ─── Avatar stack (header) ────────────────────────────────────────────────────

function AvatarStack({ members }: { members: GroupMember[] }): JSX.Element {
  const shown = members.slice(0, 5)
  return (
    <div className="flex -space-x-2">
      {shown.map((m) => (
        <AvatarCircle key={m.user.id} name={m.user.name} size="sm" className="ring-2 ring-canvas" />
      ))}
      {members.length === 0 && <span className="text-xs text-slate-500">No members yet</span>}
    </div>
  )
}

// ─── Members list ─────────────────────────────────────────────────────────────

function MembersList({ members, me }: { members: GroupMember[]; me: string }): JSX.Element {
  if (members.length === 0) {
    return <EmptyState icon={<IconUsers className="w-6 h-6" />} title="No members yet" hint="Be the first to join this group." />
  }
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {members.map((m) => {
        const badge = ROLE_BADGE[m.role]
        return (
          <li key={m.user.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
            <AvatarCircle name={m.user.name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {m.user.name}
                {m.user.id === me && <span className="text-[11px] text-brand-300 font-medium ml-1.5">You</span>}
              </p>
              <p className="text-[11px] text-slate-500">Joined {timeAgo(m.joinedAt)}</p>
            </div>
            {badge && (
              <span className={cn('text-[11px] font-semibold rounded-full px-2 py-0.5 ring-1 inline-flex items-center gap-1', badge.cls)}>
                <badge.Icon className="w-3 h-3" /> {badge.label}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// ─── Group feed ───────────────────────────────────────────────────────────────

function GroupFeed({
  group,
  me,
  isMember,
  members,
  onJoin
}: {
  group: Group
  me: string
  isMember: boolean
  members: GroupMember[]
  onJoin: () => Promise<void>
}): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([])
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [text, setText] = useState('')
  const [kind, setKind] = useState<Extract<PostKind, 'text' | 'question'>>('text')
  const [posting, setPosting] = useState(false)

  const userById = useUserMap(members, posts.map((p) => p.authorId))

  const reload = useCallback(async () => {
    const [list, likes] = await Promise.all([backend.listGroupFeed(group.id), backend.listLikes(me)])
    setPosts(list)
    setLikedIds(new Set(likes.map((l) => l.postId)))
  }, [group.id, me])

  useEffect(() => {
    void reload()
  }, [reload])

  const submit = async (): Promise<void> => {
    const body = text.trim()
    if (!body || posting) return
    setPosting(true)
    try {
      await backend.createPost({ authorId: me, kind, text: body, groupId: group.id })
      setText('')
      setKind('text')
      await reload()
    } finally {
      setPosting(false)
    }
  }

  const toggleLike = async (postId: string): Promise<void> => {
    const { likeCount } = await backend.like(me, postId)
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likeCount } : p)))
  }

  return (
    <div className="flex flex-col gap-4">
      {isMember ? (
        <div className="rounded-card border border-white/10 bg-white/[0.025] p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Share something with ${group.name}…`}
            className="input text-sm min-h-[64px] resize-none w-full"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              {(['text', 'question'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={cn(
                    'text-xs font-medium rounded-lg px-3 py-1.5 transition',
                    kind === k ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {k === 'text' ? 'Post' : 'Question'}
                </button>
              ))}
            </div>
            <button onClick={() => void submit()} disabled={!text.trim() || posting} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      ) : (
        <JoinPrompt label="Join this group to post in its feed." onJoin={onJoin} />
      )}

      {posts.length === 0 ? (
        <EmptyState icon={<IconChat className="w-6 h-6" />} title="No posts yet" hint={isMember ? 'Start the conversation above.' : 'This group has no posts yet.'} />
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => {
            const author = userById.get(p.authorId)
            const liked = likedIds.has(p.id)
            return (
              <article key={p.id} className="rounded-card border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center gap-2.5">
                  <AvatarCircle name={author?.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight truncate">{author?.name ?? 'Member'}</p>
                    <p className="text-[11px] text-slate-500">{timeAgo(p.createdAt)}</p>
                  </div>
                  {p.kind === 'question' && (
                    <span className="ml-auto text-[11px] font-semibold rounded-full px-2 py-0.5 bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20">Question</span>
                  )}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed mt-3 whitespace-pre-wrap">{p.text}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <button
                    onClick={() => void toggleLike(p.id)}
                    className={cn('inline-flex items-center gap-1.5 transition', liked ? 'text-rose-400' : 'hover:text-slate-200')}
                  >
                    <IconHeart className={cn('w-4 h-4', liked && 'fill-current')} /> {p.likeCount}
                  </button>
                  <span className="inline-flex items-center gap-1.5">
                    <IconChat className="w-4 h-4" /> {p.commentCount}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Group chat ───────────────────────────────────────────────────────────────

function GroupChat({
  group,
  me,
  isMember,
  members,
  onJoin
}: {
  group: Group
  me: string
  isMember: boolean
  members: GroupMember[]
  onJoin: () => Promise<void>
}): JSX.Element {
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const userById = useUserMap(members, messages.map((m) => m.senderId))

  const reload = useCallback(async () => {
    setMessages(await backend.listGroupMessages(group.id))
  }, [group.id])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const send = async (): Promise<void> => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    try {
      await backend.sendGroupMessage({ groupId: group.id, senderId: me, text: body })
      setText('')
      await reload()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-card border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col" style={{ height: 'min(60vh, 540px)' }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="m-auto text-center">
            <EmptyState icon={<IconUsers className="w-6 h-6" />} title="No messages yet" hint="Say hello to the group." />
          </div>
        )}
        {messages.map((m) => {
          const mine = m.senderId === me
          const sender = userById.get(m.senderId)
          return (
            <div key={m.id} className={cn('flex items-end gap-2 max-w-[80%]', mine ? 'self-end flex-row-reverse' : 'self-start')}>
              {!mine && <AvatarCircle name={sender?.name} size="sm" />}
              <div>
                {!mine && <p className="text-[11px] text-slate-500 mb-0.5 ml-1">{sender?.name ?? 'Member'}</p>}
                <div
                  className={cn(
                    'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                    mine ? 'bg-grad-brand text-white rounded-br-sm' : 'bg-white/[0.06] text-slate-100 rounded-bl-sm'
                  )}
                >
                  {m.text}
                </div>
                <p className={cn('text-[10px] text-slate-600 mt-0.5', mine ? 'text-right mr-1' : 'ml-1')}>{clockTime(m.createdAt)}</p>
              </div>
            </div>
          )
        })}
      </div>

      {isMember ? (
        <div className="border-t border-white/[0.06] p-3 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder="Message the group…"
            className="input text-sm flex-1"
          />
          <button
            onClick={() => void send()}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-xl bg-grad-brand text-white flex items-center justify-center shrink-0 disabled:opacity-50 hover:brightness-110 transition"
            aria-label="Send message"
          >
            <IconArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="border-t border-white/[0.06] p-3">
          <JoinPrompt label="Join this group to join the chat." onJoin={onJoin} compact />
        </div>
      )}
    </div>
  )
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

/** Resolve PlatformUser objects for author/sender ids — members cover most, with
 *  a lazy backend fetch for anyone not in the membership list. */
function useUserMap(members: GroupMember[], ids: string[]): Map<string, PlatformUser> {
  const base = useMemo(() => new Map(members.map((m) => [m.user.id, m.user])), [members])
  const [extra, setExtra] = useState<Map<string, PlatformUser>>(new Map())

  const missing = useMemo(() => ids.filter((id) => !base.has(id) && !extra.has(id)), [ids, base, extra])

  useEffect(() => {
    if (missing.length === 0) return
    let cancelled = false
    void Promise.all(missing.map((id) => backend.getUser(id))).then((users) => {
      if (cancelled) return
      setExtra((prev) => {
        const next = new Map(prev)
        users.forEach((u) => u && next.set(u.id, u))
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [missing])

  return useMemo(() => new Map([...base, ...extra]), [base, extra])
}

function JoinPrompt({ label, onJoin, compact }: { label: string; onJoin: () => Promise<void>; compact?: boolean }): JSX.Element {
  return (
    <div className={cn('flex items-center gap-3 rounded-card border border-white/10 bg-white/[0.025]', compact ? 'px-3 py-2' : 'p-4')}>
      <IconLock className="w-4 h-4 text-slate-400 shrink-0" />
      <p className="text-sm text-slate-300 flex-1">{label}</p>
      <button onClick={() => void onJoin()} className="bg-grad-brand text-white text-xs font-semibold rounded-lg px-4 py-2 hover:brightness-110 transition shrink-0">
        Join group
      </button>
    </div>
  )
}

function EmptyState({ icon, title, hint }: { icon: JSX.Element; title: string; hint: string }): JSX.Element {
  return (
    <div className="rounded-card border border-dashed border-white/10 bg-white/[0.015] py-10 flex flex-col items-center text-center gap-2">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.05] text-slate-400 flex items-center justify-center">{icon}</div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-slate-500 max-w-xs">{hint}</p>
    </div>
  )
}
