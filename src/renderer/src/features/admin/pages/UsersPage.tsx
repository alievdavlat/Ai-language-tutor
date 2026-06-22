/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import type { ActivityEvent, PlatformUser, UserStats } from '@shared/types'
import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { studio } from '../../../services/studio/store'
import { cn } from '../../../lib/classnames'
import { IconSearch, IconUsers } from '../../../components/icons'
import DataTable from '../components/DataTable'
import Drawer from '../components/Drawer'
import { SchemaForm, type FieldDef, type FormValues } from '../../../components/forms'
import { SUPPORTED_LANGUAGES } from '@shared/constants'
import { levels } from '../../../services/levels/store'
import { useT } from '../../../i18n'

type Filter = 'all' | 'student' | 'teacher' | 'banned'

export default function UsersPage(): JSX.Element {
  const t = useT()
  const EDIT_FIELDS: FieldDef[] = [
    { name: 'name', label: t('adm.userName'), type: 'text', required: true, full: true },
    { name: 'role', label: t('adm.userRole'), type: 'select', options: [{ value: 'student', label: t('adm.roleStudent') }, { value: 'teacher', label: t('adm.roleTeacher') }] },
    { name: 'level', label: t('adm.userLevel'), type: 'select', options: () => [{ value: '', label: '—' }, ...levels.list().map((l) => ({ value: l.code, label: l.name }))] },
    { name: 'targetLanguage', label: t('adm.userLearning'), type: 'select', options: () => SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: `${l.flag} ${l.name}` })) },
    { name: 'country', label: t('adm.userCountry'), type: 'text' },
    { name: 'bio', label: t('adm.userBio'), type: 'textarea', full: true, rows: 2 }
  ]
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<PlatformUser | null>(null)
  const [form, setForm] = useState<FormValues>({})
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [saving, setSaving] = useState(false)

  const teachers = useBackendQuery(() => backend.listUsers({ role: 'teacher' }), [], [])
  const students = useBackendQuery(() => backend.listUsers({ role: 'student' }), [], [])
  const all = useMemo(() => [...teachers.data, ...students.data], [teachers.data, students.data])

  const banned = useBackendQuery(async () => {
    const states = await Promise.all(all.map((u) => studio.getUserModeration(u.id)))
    return states
  }, [all], [] as { userId: string; banned: boolean; warnings: number }[])
  const bannedMap = useMemo(() => new Map(banned.data.map((s) => [s.userId, s])), [banned.data])

  const refresh = (): void => { teachers.refresh(); students.refresh(); banned.refresh() }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return all.filter((u) => {
      if (filter === 'banned' && !bannedMap.get(u.id)?.banned) return false
      if ((filter === 'student' || filter === 'teacher') && u.role !== filter) return false
      if (term && !(`${u.name} ${u.email}`.toLowerCase().includes(term))) return false
      return true
    })
  }, [all, q, filter, bannedMap])

  // Load profile detail when a user is opened.
  useEffect(() => {
    if (!open) return
    setForm({ name: open.name, role: open.role, level: open.level ?? '', targetLanguage: open.targetLanguage, country: open.country ?? '', bio: open.bio ?? '' })
    setStats(null)
    setActivity([])
    void backend.getStats(open.id).then(setStats).catch(() => undefined)
    void backend.listActivity(open.id, { limit: 8 }).then(setActivity).catch(() => undefined)
  }, [open])

  const saveUser = async (): Promise<void> => {
    if (!open) return
    setSaving(true)
    try {
      await backend.updateUser(open.id, {
        name: String(form.name || '').trim() || open.name,
        role: (form.role as PlatformUser['role']) || open.role,
        level: (form.level as any) || undefined,
        targetLanguage: (form.targetLanguage as any) || open.targetLanguage,
        country: (form.country as string) || undefined,
        bio: (form.bio as string) || undefined
      })
      setOpen(null)
      refresh()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : t('adm.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const toggleBan = async (u: PlatformUser): Promise<void> => {
    const state = await studio.getUserModeration(u.id)
    await studio.moderateUser(u.id, state.banned ? 'unban' : 'ban')
    banned.refresh()
  }
  const warn = async (u: PlatformUser): Promise<void> => {
    await studio.moderateUser(u.id, 'warn')
    banned.refresh()
  }

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: t('adm.filterAll') },
    { id: 'student', label: t('adm.filterStudents') },
    { id: 'teacher', label: t('adm.filterTeachers') },
    { id: 'banned', label: t('adm.filterBanned') }
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2"><IconUsers className="w-5 h-5 text-slate-400" /> {t('adm.usersTitle')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('adm.usersSubtitle')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('adm.searchNameEmail')} className="w-full rounded-lg bg-white/[0.04] border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none" />
        </div>
        <div className="inline-flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition', filter === f.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200')}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 tabular-nums">{filtered.length} {t('adm.ofCount')} {all.length}</span>
      </div>

      <DataTable
        rows={filtered}
        rowId={(u) => u.id}
        onRowClick={(u) => setOpen(u)}
        empty={t('adm.noUsersMatch')}
        columns={[
          { key: 'name', label: t('adm.colMember'), render: (u) => (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-slate-300 shrink-0">{u.name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <span className="block truncate font-semibold text-white">{u.name}</span>
                <span className="block truncate text-[11px] text-slate-500">{u.email}</span>
              </div>
            </div>
          ) },
          { key: 'role', label: t('adm.colRole'), cls: 'w-24', render: (u) => (
            <span className={cn('inline-flex rounded-md text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5', u.role === 'teacher' ? 'bg-violet-500/15 text-violet-200' : 'bg-brand-500/15 text-brand-200')}>{u.role}</span>
          ) },
          { key: 'joined', label: t('adm.colJoined'), cls: 'w-28', render: (u) => <span className="text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span> },
          { key: 'status', label: t('adm.colStatus'), cls: 'w-28', render: (u) => {
            const s = bannedMap.get(u.id)
            if (s?.banned) return <span className="inline-flex rounded-md text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-rose-500/15 text-rose-200">{t('adm.statusBanned')}</span>
            if (s && s.warnings > 0) return <span className="inline-flex rounded-md text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/15 text-amber-200">{s.warnings} {s.warnings === 1 ? t('adm.warningSingular') : t('adm.warningPlural')}</span>
            return <span className="text-emerald-300/80 text-[11px] font-semibold">{t('adm.statusActive')}</span>
          } }
        ]}
        actions={(u) => {
          const isBanned = bannedMap.get(u.id)?.banned
          return (
            <button onClick={() => void toggleBan(u)} className={cn('rounded-md px-2 py-1 text-[11px] font-bold', isBanned ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200 hover:bg-rose-500/25')}>
              {isBanned ? t('adm.unban') : t('adm.ban')}
            </button>
          )
        }}
      />

      {open && (
        <Drawer
          open
          title={open.name}
          subtitle={open.email}
          onClose={() => setOpen(null)}
          width="lg"
          footer={
            <>
              <button onClick={() => void warn(open)} className="rounded-lg px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/10">{t('adm.warn')}</button>
              <button onClick={() => void toggleBan(open)} className="rounded-lg px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/10">
                {bannedMap.get(open.id)?.banned ? t('adm.unbanUser') : t('adm.banUser')}
              </button>
              <div className="flex-1" />
              <button onClick={() => setOpen(null)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.06]">{t('adm.cancel')}</button>
              <button onClick={() => void saveUser()} disabled={saving} className="rounded-lg px-5 py-2 text-sm font-bold bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-50">{saving ? t('adm.saving') : t('adm.save')}</button>
            </>
          }
        >
          {/* Stats strip */}
          {stats && (
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { v: stats.xp, l: 'XP' },
                { v: stats.streak, l: t('adm.statStreak') },
                { v: stats.lessonsCompleted, l: t('adm.statLessons') },
                { v: stats.wordsLearned, l: t('adm.statWords') }
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5 text-center">
                  <p className="text-lg font-bold text-white tabular-nums">{s.v}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{s.l}</p>
                </div>
              ))}
            </div>
          )}

          <SchemaForm fields={EDIT_FIELDS} value={form} onChange={setForm} />

          {/* Recent activity */}
          <div className="mt-6">
            <h3 className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">{t('adm.recentActivity')}</h3>
            {activity.length === 0 ? (
              <p className="text-sm text-slate-500">{t('adm.noActivityYet')}</p>
            ) : (
              <div className="rounded-lg border border-white/[0.07] divide-y divide-white/[0.05]">
                {activity.map((a) => (
                  <div key={a.id} className="px-3 py-2 flex items-center gap-2 text-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-32 shrink-0">{a.kind.replace(/_/g, ' ')}</span>
                    <span className="text-slate-400 flex-1 truncate">{a.xp ? `+${a.xp} XP` : ''} {a.minutes ? `· ${a.minutes}m` : ''}</span>
                    <span className="text-[11px] text-slate-600">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  )
}
