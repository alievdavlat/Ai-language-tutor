import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { useNavigate } from 'react-router-dom'
import { AvatarCircle } from '../../components/ui'
import { IconChevronLeft, IconSearch } from '../../components/icons'

interface Thread {
  id: string
  name: string
  last: string
  when: string
  unread: number
  online?: boolean
  role?: 'teacher' | 'student'
}

interface Msg {
  from: 'me' | 'them'
  text: string
  when: string
}

const THREADS: Thread[] = [
  { id: 't1', name: 'James Lee', last: "Sure — let's review your Speaking part 2 next session.", when: '5m', unread: 2, online: true, role: 'teacher' },
  { id: 't2', name: 'Emma W.', last: 'Did you see the new IELTS mock? 🔥', when: '1h', unread: 0, online: true, role: 'student' },
  { id: 't3', name: 'Priya S.', last: 'Voice note', when: '3h', unread: 1, online: false, role: 'student' },
  { id: 't4', name: 'Marco B.', last: "I'm going live in 10 min — join!", when: 'Yest.', unread: 0, online: false, role: 'teacher' },
  { id: 't5', name: 'Yui T.', last: 'Thanks for the feedback on my essay 🙏', when: '2d', unread: 0, online: true, role: 'student' },
  { id: 't6', name: 'Study group · A2 Squad', last: 'Wei: Anyone here?', when: '3d', unread: 0, online: false }
]

const MSGS: Record<string, Msg[]> = {
  t1: [
    { from: 'them', text: 'Hey Aziz! How did the practice go?', when: '14:02' },
    { from: 'me', text: 'Pretty good. I think Part 2 is still my weakest.', when: '14:04' },
    { from: 'them', text: 'Send me a recording and I\'ll mark it tonight.', when: '14:05' },
    { from: 'me', text: 'Will do — thanks 🙏', when: '14:06' },
    { from: 'them', text: "Sure — let's review your Speaking part 2 next session.", when: '14:30' }
  ],
  t2: [{ from: 'them', text: 'Did you see the new IELTS mock? 🔥', when: '13:10' }]
}

export default function InboxPage(): JSX.Element {
  const [active, setActive] = useState<string>('t1')
  const [draft, setDraft] = useState('')
  const msgs = MSGS[active] ?? []
  // Guard with a fallback so a future feature (URL-param active id, dynamic
  // thread list, etc.) cannot crash the page with a stale id.
  const thread = THREADS.find((t) => t.id === active) ?? THREADS[0]
  const navigate = useNavigate()

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
          </div>
          <div className="relative mt-3">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search people"
              className="input pl-9 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {THREADS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-left transition border-l-2',
                active === t.id
                  ? 'bg-brand-500/10 border-brand-400'
                  : 'border-transparent hover:bg-white/[0.04]'
              )}
            >
              <div className="relative shrink-0">
                <AvatarCircle name={t.name} size="sm" />
                {t.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-canvas" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                  {t.role === 'teacher' && (
                    <span className="text-[9px] uppercase font-bold tracking-wider bg-violet-500/20 text-violet-200 rounded px-1 py-0.5">T</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">{t.last}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-500">{t.when}</p>
                {t.unread > 0 && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-500 text-[9px] font-bold text-white mt-0.5">
                    {t.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex-1 flex flex-col min-w-0">
        <header className="px-5 py-3 border-b border-white/[0.07] flex items-center gap-3">
          <AvatarCircle name={thread.name} size="sm" />
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{thread.name}</p>
            <p className="text-[11px] text-slate-400">{thread.online ? 'Online now' : 'Last seen 1h ago'}</p>
          </div>
          <button className="btn-ghost text-xs px-3 py-1.5">Video call</button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2.5">
          {msgs.map((m, i) => (
            <div key={i} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
                  m.from === 'me'
                    ? 'bg-grad-brand text-white rounded-br-md'
                    : 'bg-white/[0.06] border border-white/10 text-slate-100 rounded-bl-md'
                )}
              >
                <p>{m.text}</p>
                <p className={cn('text-[10px] mt-1', m.from === 'me' ? 'text-white/70' : 'text-slate-500')}>{m.when}</p>
              </div>
            </div>
          ))}
        </div>

        <footer className="px-5 py-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message ${thread.name.split(' ')[0]}…`}
              className="input flex-1 text-sm"
            />
            <button className="btn-primary px-4 py-2.5 text-sm" disabled={draft.trim().length === 0}>
              Send
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}
