import { useCallback, useEffect, useRef, useState } from 'react'
import type { DmMessage, DmThread, PlatformUser } from '@shared/types'
import { cn } from '../../lib/classnames'
import { backend } from '../../services/backend'
import { subscribeTable, emitLocalChange } from '../../services/backend/realtime'
import { IconChat, IconChevronLeft, IconPlus, IconX } from '../icons'

function initials(name: string): string {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}
function Avatar({ name }: { name: string }): JSX.Element {
  return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">{initials(name)}</div>
}

type View = 'list' | 'thread' | 'new'

/**
 * Global Instagram/Facebook-style docked messenger (bottom-right). Real DM
 * backend: listThreads / listMessages / sendMessage / getOrCreateThread.
 * Collapsed by default; expand → thread list → conversation with a Send button;
 * "New message" picks any user to start a thread.
 */
export default function DockedChat(): JSX.Element | null {
  const me = backend.currentUserId()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('list')
  const [threads, setThreads] = useState<DmThread[]>([])
  const [users, setUsers] = useState<Record<string, PlatformUser>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<DmMessage[]>([])
  const [draft, setDraft] = useState('')
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([])
  const endRef = useRef<HTMLDivElement>(null)

  const otherId = (t: DmThread): string => t.participantIds.find((p) => p !== me) ?? t.participantIds[0]

  const loadThreads = useCallback(async () => {
    if (!me) return
    const ts = await backend.listThreads(me)
    setThreads(ts)
    const ids = Array.from(new Set(ts.map(otherId)))
    const map: Record<string, PlatformUser> = {}
    for (const id of ids) { const u = await backend.getUser(id); if (u) map[u.id] = u }
    setUsers(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me])

  const loadMsgs = useCallback(async (threadId: string) => {
    setMsgs(await backend.listMessages(threadId))
  }, [])

  useEffect(() => { if (open) void loadThreads() }, [open, loadThreads])
  useEffect(() => { if (activeId) void loadMsgs(activeId) }, [activeId, loadMsgs])
  useEffect(() => {
    const unsub = subscribeTable('messages', () => { if (activeId) void loadMsgs(activeId); void loadThreads() })
    return unsub
  }, [activeId, loadMsgs, loadThreads])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs])

  if (!me) return null

  const openThread = (id: string): void => { setActiveId(id); setView('thread') }
  const startNew = async (): Promise<void> => {
    if (allUsers.length === 0) setAllUsers((await backend.listUsers({ limit: 30 })).filter((u) => u.id !== me))
    setView('new')
  }
  const pickUser = async (uid: string): Promise<void> => {
    const t = await backend.getOrCreateThread(me, uid)
    await loadThreads()
    openThread(t.id)
  }
  const send = async (): Promise<void> => {
    const text = draft.trim()
    if (!text || !activeId) return
    setDraft('')
    const saved = await backend.sendMessage({ threadId: activeId, senderId: me, text })
    emitLocalChange({ event: 'INSERT', table: 'messages', new: saved as unknown as Record<string, unknown>, old: null })
    void loadMsgs(activeId)
    void loadThreads()
  }

  const activeThread = threads.find((t) => t.id === activeId)
  const activeName = activeThread ? users[otherId(activeThread)]?.name ?? 'Chat' : 'Chat'

  // Collapsed launcher
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed bottom-4 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-brand-500 hover:bg-brand-400 text-white pl-3 pr-4 py-2.5 shadow-xl shadow-brand-500/30">
        <IconChat className="w-5 h-5" /> <span className="text-sm font-bold">Messages</span>
        {threads.length > 0 && <span className="ml-0.5 text-[11px] bg-white/25 rounded-full px-1.5">{threads.length}</span>}
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-5 z-50 w-80 rounded-t-2xl border border-white/10 border-b-0 bg-canvas-soft shadow-2xl flex flex-col" style={{ height: '420px', maxHeight: '80vh' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 shrink-0">
        {view === 'thread' || view === 'new'
          ? <button onClick={() => setView('list')} className="text-slate-300 hover:text-white"><IconChevronLeft className="w-5 h-5" /></button>
          : null}
        <span className="text-sm font-bold text-white flex-1 truncate">{view === 'thread' ? activeName : view === 'new' ? 'New message' : 'Messages'}</span>
        {view === 'list' && <button onClick={() => void startNew()} title="New message" className="text-brand-300 hover:text-brand-200"><IconPlus className="w-5 h-5" /></button>}
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white"><IconX className="w-5 h-5" /></button>
      </div>

      {/* Thread list */}
      {view === 'list' && (
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">No chats yet.<br /><button onClick={() => void startNew()} className="text-brand-300 font-semibold mt-2">Start a conversation</button></div>
          ) : threads.map((t) => (
            <button key={t.id} onClick={() => openThread(t.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 text-left">
              <Avatar name={users[otherId(t)]?.name ?? '?'} />
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white truncate">{users[otherId(t)]?.name ?? 'User'}</p><p className="text-xs text-slate-500 truncate">{t.lastMessageText ?? 'Say hi 👋'}</p></div>
            </button>
          ))}
        </div>
      )}

      {/* New message — pick a user */}
      {view === 'new' && (
        <div className="flex-1 overflow-y-auto">
          {allUsers.map((u) => (
            <button key={u.id} onClick={() => void pickUser(u.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 text-left">
              <Avatar name={u.name} />
              <div className="min-w-0"><p className="text-sm font-semibold text-white truncate">{u.name}</p><p className="text-[11px] text-slate-500">{u.role}{u.level ? ` · ${u.level}` : ''}</p></div>
            </button>
          ))}
        </div>
      )}

      {/* Conversation */}
      {view === 'thread' && (
        <>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {msgs.map((m) => (
              <div key={m.id} className={cn('max-w-[80%] rounded-2xl px-3 py-1.5 text-xs', m.senderId === me ? 'self-end bg-brand-500 text-white rounded-br-sm' : 'self-start bg-white/10 text-slate-200 rounded-bl-sm')}>{m.text}</div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-2 border-t border-white/10 flex items-center gap-2 shrink-0">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void send() }} placeholder="Message…" className="flex-1 bg-white/[0.05] rounded-full px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none" />
            <button onClick={() => void send()} disabled={!draft.trim()} className="rounded-full bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-white text-xs font-bold px-3.5 py-2">Send</button>
          </div>
        </>
      )}
    </div>
  )
}
