import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/classnames'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AvatarCircle } from '../../components/ui'
import { IconChevronLeft, IconSearch } from '../../components/icons'
import { backend } from '../../services/backend/useBackend'
import { meId, ensureDmSeed } from '../../services/backend/social'
import { subscribeTable, emitLocalChange } from '../../services/backend/realtime'
import type { DmMessage, DmThread, PlatformUser } from '@shared/types'
import { clockTime, timeAgo } from '../../lib/time'

interface ThreadView {
  thread: DmThread
  other: PlatformUser | null
  lastText: string
  lastAt: string
  unread: number
}

export default function InboxPage(): JSX.Element {
  const navigate = useNavigate()
  const me = meId()
  const [threads, setThreads] = useState<ThreadView[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DmMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [people, setPeople] = useState<PlatformUser[]>([])
  const [composing, setComposing] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Load + shape the thread list (other participant, preview, unread). ──
  const loadThreads = useCallback(async (): Promise<ThreadView[]> => {
    const raw = await backend.listThreads(me)
    const views = await Promise.all(
      raw.map(async (thread): Promise<ThreadView> => {
        const otherId = thread.participantIds.find((id) => id !== me) ?? me
        const [other, msgs] = await Promise.all([backend.getUser(otherId), backend.listMessages(thread.id)])
        const unread = msgs.filter((m) => m.senderId !== me && !m.readBy.includes(me)).length
        const last = msgs[msgs.length - 1]
        return {
          thread,
          other,
          lastText: last?.text ?? thread.lastMessageText ?? 'Say hello 👋',
          lastAt: last?.createdAt ?? thread.lastMessageAt,
          unread
        }
      })
    )
    return views.sort((a, b) => b.lastAt.localeCompare(a.lastAt))
  }, [me])

  const refreshThreads = useCallback(async () => {
    const views = await loadThreads()
    setThreads(views)
    setActiveId((cur) => cur ?? views[0]?.thread.id ?? null)
  }, [loadThreads])

  // First run: seed starter threads, then load.
  useEffect(() => {
    let alive = true
    ;(async () => {
      await ensureDmSeed(me)
      const views = await loadThreads()
      if (!alive) return
      setThreads(views)
      setActiveId(views[0]?.thread.id ?? null)
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [me, loadThreads])

  // Load messages for the active thread + mark read.
  const loadMessages = useCallback(
    async (threadId: string) => {
      const msgs = await backend.listMessages(threadId)
      setMessages(msgs)
      await backend.markThreadRead(threadId, me)
    },
    [me]
  )

  useEffect(() => {
    if (!activeId) {
      setMessages([])
      return
    }
    void loadMessages(activeId).then(() => {
      // reflect the just-read state in the list badge
      setThreads((prev) => prev.map((t) => (t.thread.id === activeId ? { ...t, unread: 0 } : t)))
    })
  }, [activeId, loadMessages])

  // Realtime: any new message refetches the open thread + the list previews.
  useEffect(() => {
    const unsub = subscribeTable('messages', () => {
      if (activeId) void loadMessages(activeId)
      void refreshThreads()
    })
    return unsub
  }, [activeId, loadMessages, refreshThreads])

  // Keep the conversation scrolled to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, activeId])

  // People search to start a new conversation.
  useEffect(() => {
    if (!composing) return
    let alive = true
    void backend.listUsers({ q: search.trim() || undefined, limit: 20 }).then((list) => {
      if (alive) setPeople(list.filter((u) => u.id !== me))
    })
    return () => {
      alive = false
    }
  }, [composing, search, me])

  // Deep link from "Message"/"Say hi" buttons: /inbox?user=<id>[&greet=1]
  const [params] = useSearchParams()
  const deepLinkedRef = useRef<string | null>(null)
  useEffect(() => {
    const uid = params.get('user')
    if (!uid || loading || deepLinkedRef.current === uid) return
    deepLinkedRef.current = uid
    void (async () => {
      const thread = await backend.getOrCreateThread(me, uid)
      if (params.get('greet')) {
        const existing = await backend.listMessages(thread.id)
        if (existing.length === 0) {
          const saved = await backend.sendMessage({ threadId: thread.id, senderId: me, text: 'Hi! 👋 Want to practice together?' })
          emitLocalChange({ event: 'INSERT', table: 'messages', new: saved as unknown as Record<string, unknown>, old: null })
        }
      }
      await refreshThreads()
      setActiveId(thread.id)
      await loadMessages(thread.id) // explicit — setActiveId may be a no-op if already active
    })()
  }, [params, loading, me, refreshThreads, loadMessages])

  const send = async (): Promise<void> => {
    const text = draft.trim()
    if (!text || !activeId || sending) return
    setSending(true)
    setDraft('')
    const optimistic: DmMessage = {
      id: `tmp_${Date.now()}`,
      threadId: activeId,
      senderId: me,
      text,
      readBy: [me],
      createdAt: new Date().toISOString()
    }
    setMessages((prev) => [...prev, optimistic])
    try {
      const saved = await backend.sendMessage({ threadId: activeId, senderId: me, text })
      // Tell other windows / live subscribers a row landed.
      emitLocalChange({ event: 'INSERT', table: 'messages', new: saved as unknown as Record<string, unknown>, old: null })
      await loadMessages(activeId)
      await refreshThreads()
    } finally {
      setSending(false)
    }
  }

  const startConversation = async (userId: string): Promise<void> => {
    const thread = await backend.getOrCreateThread(me, userId)
    setComposing(false)
    setSearch('')
    await refreshThreads()
    setActiveId(thread.id)
  }

  const active = threads.find((t) => t.thread.id === activeId) ?? null
  const otherName = active?.other?.name ?? 'Conversation'
  const filteredThreads = threads.filter((t) =>
    !search.trim() || (t.other?.name ?? '').toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div className="h-full flex overflow-hidden">
      {/* Thread list */}
      <aside className="w-72 shrink-0 border-r border-white/[0.07] bg-white/[0.015] flex flex-col">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate('/home')}
              title="Back"
              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center"
            >
              <IconChevronLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold tracking-tight">Inbox</h1>
            <button
              onClick={() => setComposing((v) => !v)}
              className="ml-auto text-xs font-semibold rounded-lg bg-brand-500/15 text-brand-200 hover:bg-brand-500/25 px-2.5 py-1.5"
            >
              {composing ? 'Cancel' : '+ New'}
            </button>
          </div>
          <div className="relative mt-3">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={composing ? 'Search people to message' : 'Search conversations'}
              className="input pl-9 text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Compose mode: pick someone to message. */}
          {composing ? (
            people.length === 0 ? (
              <p className="p-4 text-xs text-slate-500">No people found.</p>
            ) : (
              people.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startConversation(u.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04]"
                >
                  <AvatarCircle name={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      {u.role === 'teacher' && (
                        <span className="text-[9px] uppercase font-bold tracking-wider bg-violet-500/20 text-violet-200 rounded px-1 py-0.5">T</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{u.bio ?? (u.role === 'teacher' ? 'Teacher' : 'Learner')}</p>
                  </div>
                </button>
              ))
            )
          ) : loading ? (
            <p className="p-4 text-xs text-slate-500">Loading…</p>
          ) : filteredThreads.length === 0 ? (
            <div className="p-4 text-xs text-slate-500">
              No conversations yet. Tap <span className="text-brand-200 font-semibold">+ New</span> to message a tutor or buddy.
            </div>
          ) : (
            filteredThreads.map((t) => (
              <button
                key={t.thread.id}
                onClick={() => setActiveId(t.thread.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left transition border-l-2',
                  activeId === t.thread.id ? 'bg-brand-500/10 border-brand-400' : 'border-transparent hover:bg-white/[0.04]'
                )}
              >
                <div className="relative shrink-0">
                  <AvatarCircle name={t.other?.name} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white truncate">{t.other?.name ?? 'Unknown'}</p>
                    {t.other?.role === 'teacher' && (
                      <span className="text-[9px] uppercase font-bold tracking-wider bg-violet-500/20 text-violet-200 rounded px-1 py-0.5">T</span>
                    )}
                  </div>
                  <p className={cn('text-[11px] truncate', t.unread > 0 ? 'text-slate-200 font-medium' : 'text-slate-400')}>{t.lastText}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-500">{timeAgo(t.lastAt)}</p>
                  {t.unread > 0 && (
                    <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-brand-500 text-[9px] font-bold text-white mt-0.5">
                      {t.unread}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex-1 flex flex-col min-w-0">
        {active ? (
          <>
            <header className="px-5 py-3 border-b border-white/[0.07] flex items-center gap-3">
              <AvatarCircle name={otherName} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{otherName}</p>
                <p className="text-[11px] text-slate-400">
                  {active.other?.role === 'teacher' ? 'Tutor' : 'Learner'}
                  {active.other?.country ? ` · ${active.other.country}` : ''}
                </p>
              </div>
              <button
                onClick={() => navigate('/meet')}
                className="btn-ghost text-xs px-3 py-1.5"
                title="Start a video call"
              >
                Video call
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
              {messages.length === 0 ? (
                <p className="m-auto text-xs text-slate-500">No messages yet — say hello 👋</p>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === me
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
                          mine
                            ? 'bg-grad-brand text-white rounded-br-md'
                            : 'bg-white/[0.06] border border-white/10 text-slate-100 rounded-bl-md'
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p className={cn('text-[10px] mt-1', mine ? 'text-white/70' : 'text-slate-500')}>{clockTime(m.createdAt)}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <footer className="px-5 py-3 border-t border-white/[0.07]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send()
                    }
                  }}
                  placeholder={`Message ${otherName.split(' ')[0]}…`}
                  className="input flex-1 text-sm"
                />
                <button onClick={() => void send()} className="btn-primary px-4 py-2.5 text-sm" disabled={draft.trim().length === 0 || sending}>
                  Send
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-3xl mb-4">💬</div>
            <p className="text-slate-300 font-semibold">Your messages</p>
            <p className="text-sm text-slate-500 max-w-xs mt-1">
              Pick a conversation, or tap <span className="text-brand-200 font-semibold">+ New</span> to message a tutor or study buddy.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
