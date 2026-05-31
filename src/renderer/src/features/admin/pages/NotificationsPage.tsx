import { useMemo, useState } from 'react'
import type { Notif } from '@shared/types'
import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { cn } from '../../../lib/classnames'
import { SchemaForm, type FieldDef, type FormValues } from '../../../components/forms'

type Audience = 'all' | 'student' | 'teacher'

const FIELDS: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, full: true, placeholder: 'New courses just dropped' },
  { name: 'body', label: 'Message', type: 'textarea', required: true, full: true, rows: 3 },
  { name: 'type', label: 'Category', type: 'select', options: [
    { value: 'system', label: 'System' }, { value: 'learning', label: 'Learning' }, { value: 'social', label: 'Social' }
  ] },
  { name: 'link', label: 'Deep link (optional)', type: 'text', placeholder: '/courses' }
]

export default function NotificationsPage(): JSX.Element {
  const [audience, setAudience] = useState<Audience>('all')
  const [form, setForm] = useState<FormValues>({ title: '', body: '', type: 'system', link: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<number | null>(null)

  const teachers = useBackendQuery(() => backend.listUsers({ role: 'teacher' }), [], [])
  const students = useBackendQuery(() => backend.listUsers({ role: 'student' }), [], [])

  const targets = useMemo(() => {
    if (audience === 'teacher') return teachers.data
    if (audience === 'student') return students.data
    return [...teachers.data, ...students.data]
  }, [audience, teachers.data, students.data])

  const ok = String(form.title || '').trim() && String(form.body || '').trim()

  const send = async (): Promise<void> => {
    if (!ok || targets.length === 0) return
    setSending(true)
    setSent(null)
    try {
      let n = 0
      for (const u of targets) {
        await backend.createNotif({
          userId: u.id,
          type: (form.type as Notif['type']) || 'system',
          title: String(form.title).trim(),
          body: String(form.body).trim(),
          link: (form.link as string) || undefined
        })
        n++
      }
      setSent(n)
      setForm({ title: '', body: '', type: 'system', link: '' })
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const AUD: { id: Audience; label: string; n: number }[] = [
    { id: 'all', label: 'Everyone', n: teachers.data.length + students.data.length },
    { id: 'student', label: 'Students', n: students.data.length },
    { id: 'teacher', label: 'Teachers', n: teachers.data.length }
  ]

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Broadcast notification</h1>
        <p className="text-sm text-slate-500 mt-0.5">Send a real in-app notification to a whole audience. Each recipient gets their own record.</p>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Audience</p>
        <div className="flex gap-2">
          {AUD.map((a) => (
            <button key={a.id} onClick={() => setAudience(a.id)} className={cn('rounded-lg border px-3 py-2 text-sm font-semibold transition', audience === a.id ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]')}>
              {a.label} <span className="text-slate-500 tabular-nums">· {a.n}</span>
            </button>
          ))}
        </div>
      </div>

      <SchemaForm fields={FIELDS} value={form} onChange={setForm} />

      <div className="flex items-center gap-3">
        <button onClick={() => void send()} disabled={!ok || sending || targets.length === 0} className="rounded-lg bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {sending ? 'Sending…' : `Send to ${targets.length} ${targets.length === 1 ? 'person' : 'people'}`}
        </button>
        {sent !== null && <span className="text-sm text-emerald-300">Delivered to {sent} recipient{sent === 1 ? '' : 's'}. ✓</span>}
      </div>
    </div>
  )
}
