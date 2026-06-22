import { useState } from 'react'
import { Input } from '../../components/ui'
import { cn } from '../../lib/classnames'
import { backend } from '../../services/backend'
import { NOTIF_EVENT } from '../../services/notifications'
import { IconX } from '../../components/icons'
import { useT } from '../../i18n'
import type { StringKey } from '../../i18n/strings'

type Audience = 'all' | 'students' | 'teachers'
type NType = 'system' | 'learning' | 'social'

const TYPES: { id: NType; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'learning', label: 'Learning' },
  { id: 'social', label: 'Social' }
]
const AUDIENCES: { id: Audience; label: string }[] = [
  { id: 'all', label: 'Everyone' },
  { id: 'students', label: 'Students' },
  { id: 'teachers', label: 'Teachers' }
]

interface ComposerProps {
  /** Teachers can only target students; admins/owners can target anyone. */
  teacherOnly?: boolean
  onClose: () => void
  onSent: (count: number) => void
}

/** Broadcast a notification to a real audience (admin) or to students (teacher). #A34 */
export default function NotificationComposer({ teacherOnly, onClose, onSent }: ComposerProps): JSX.Element {
  const t = useT()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<NType>('system')
  const [link, setLink] = useState('')
  const [audience, setAudience] = useState<Audience>(teacherOnly ? 'students' : 'all')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<number | null>(null)

  const canSend = !!title.trim() && !!body.trim()
  const audiences = teacherOnly ? AUDIENCES.filter((a) => a.id === 'students') : AUDIENCES

  const send = async (): Promise<void> => {
    if (!canSend) return
    setBusy(true)
    const filter = audience === 'all' ? {} : { role: audience === 'students' ? ('student' as const) : ('teacher' as const) }
    const users = await backend.listUsers(filter)
    let n = 0
    for (const u of users) {
      try {
        await backend.createNotif({ userId: u.id, type, kind: 'announcement', title: title.trim(), body: body.trim(), link: link.trim() || undefined })
        n++
      } catch { /* skip */ }
    }
    setBusy(false)
    setSent(n)
    onSent(n)
    // Refresh the sender's own bell if they were in the audience.
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="border border-white/10 rounded-3xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(to bottom, #14182a, #0c0f1a)' }}>
        <header className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-white">{t('soc.sendNotification')}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-5 h-5" /></button>
        </header>

        {sent !== null ? (
          <div className="px-6 py-8 text-center">
            <p className="text-3xl">📣</p>
            <p className="text-sm text-white font-bold mt-2">{t('soc.sentTo')} {sent} {sent === 1 ? t('soc.personOne') : t('soc.personMany')}.</p>
            <button onClick={onClose} className="btn-primary px-5 py-2 text-sm mt-4">{t('soc.done')}</button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" autoFocus />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message *" rows={3} className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 resize-none" />
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (optional, e.g. /courses)" />
              <div>
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Type</p>
                <div className="flex gap-2">{TYPES.map((t) => <button key={t.id} onClick={() => setType(t.id)} className={cn('rounded-pill border px-3 py-1.5 text-xs font-bold', type === t.id ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300')}>{t.label}</button>)}</div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Audience</p>
                <div className="flex gap-2">{audiences.map((a) => <button key={a.id} onClick={() => setAudience(a.id)} className={cn('rounded-pill border px-3 py-1.5 text-xs font-bold', audience === a.id ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300')}>{a.label}</button>)}</div>
              </div>
            </div>
            <footer className="px-6 py-4 border-t border-white/[0.07] flex justify-end gap-2">
              <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
              <button onClick={() => void send()} disabled={!canSend || busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">{busy ? 'Sending…' : 'Send'}</button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
