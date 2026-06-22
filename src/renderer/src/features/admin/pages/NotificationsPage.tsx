import { useMemo, useState } from 'react'
import type { Notif } from '@shared/types'
import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { cn } from '../../../lib/classnames'
import { SchemaForm, type FieldDef, type FormValues } from '../../../components/forms'
import { useT } from '../../../i18n'

type Audience = 'all' | 'student' | 'teacher'

export default function NotificationsPage(): JSX.Element {
  const t = useT()
  const FIELDS: FieldDef[] = [
    { name: 'title', label: t('adm.notifTitleField'), type: 'text', required: true, full: true, placeholder: t('adm.notifTitlePlaceholder') },
    { name: 'body', label: t('adm.notifMessageField'), type: 'textarea', required: true, full: true, rows: 3 },
    { name: 'type', label: t('adm.notifCategoryField'), type: 'select', options: [
      { value: 'system', label: t('adm.notifCatSystem') }, { value: 'learning', label: t('adm.notifCatLearning') }, { value: 'social', label: t('adm.notifCatSocial') }
    ] },
    { name: 'link', label: t('adm.notifDeepLinkField'), type: 'text', placeholder: '/courses' }
  ]
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
      window.alert(e instanceof Error ? e.message : t('adm.sendFailed'))
    } finally {
      setSending(false)
    }
  }

  const AUD: { id: Audience; label: string; n: number }[] = [
    { id: 'all', label: t('adm.audEveryone'), n: teachers.data.length + students.data.length },
    { id: 'student', label: t('adm.audStudents'), n: students.data.length },
    { id: 'teacher', label: t('adm.audTeachers'), n: teachers.data.length }
  ]

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">{t('adm.broadcastTitle')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('adm.broadcastSubtitle')}</p>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">{t('adm.audience')}</p>
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
          {sending ? t('adm.sending') : `${t('adm.sendTo')} ${targets.length} ${targets.length === 1 ? t('adm.person') : t('adm.people')}`}
        </button>
        {sent !== null && <span className="text-sm text-emerald-300">{t('adm.deliveredTo')} {sent} {sent === 1 ? t('adm.recipientSingular') : t('adm.recipientPlural')}. ✓</span>}
      </div>
    </div>
  )
}
