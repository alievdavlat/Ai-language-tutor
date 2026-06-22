/**
 * Settings → Notifications (task #17). Per-type toggles grouped by area, an OS
 * (system) delivery switch, and quiet hours. All preferences persist locally
 * via the notification prefs store; the {@link notify} pipeline reads them.
 */
import { cn } from '../../../lib/classnames'
import { useT } from '../../../i18n'
import type { StringKey } from '../../../i18n/strings'
import { IconBell, IconMoon } from '../../../components/icons'
import {
  NOTIF_CATALOG,
  NOTIF_KINDS,
  ensureSystemPermission,
  useNotifPrefs,
  type NotifGroup
} from '../../../services/notifications'
import type { NotifKind } from '@shared/types'

const GROUPS: { id: NotifGroup }[] = [
  { id: 'learning' },
  { id: 'social' },
  { id: 'system' }
]

const groupLabelKey = (id: NotifGroup): StringKey =>
  ({
    learning: 'setb.notifGroupLearning',
    social: 'setb.notifGroupSocial',
    system: 'setb.notifGroupSystem'
  }[id] as StringKey)

const HOURS = Array.from({ length: 24 }, (_, h) => h)
const hourLabel = (h: number): string => {
  const ampm = h < 12 ? 'AM' : 'PM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}:00 ${ampm}`
}

function Switch({ on, onToggle, label, hint, Icon, tint }: {
  on: boolean
  onToggle: () => void
  label: string
  hint?: string
  Icon?: (p: { className?: string }) => JSX.Element
  tint?: string
}): JSX.Element {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 cursor-pointer hover:bg-white/[0.05] transition"
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', tint)}>
            <Icon className="w-4 h-4" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{label}</p>
          {hint && <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{hint}</p>}
        </div>
      </div>
      <span className={cn('w-10 h-6 rounded-full p-0.5 transition shrink-0', on ? 'bg-brand-500' : 'bg-white/15')}>
        <span className={cn('block w-5 h-5 rounded-full bg-white transition-transform', on && 'translate-x-4')} />
      </span>
    </div>
  )
}

export default function NotificationsSection(): JSX.Element {
  const t = useT()
  const { perKind, systemDelivery, quietHours, setKind, setAllKinds, setSystemDelivery, setQuietHours } = useNotifPrefs()

  const enabled = (k: NotifKind): boolean => perKind[k] !== false
  const allOn = NOTIF_KINDS.every(enabled)

  const handleSystemToggle = (): void => {
    if (!systemDelivery) ensureSystemPermission()
    setSystemDelivery(!systemDelivery)
  }

  return (
    <div className="grid grid-cols-1 gap-6 max-w-2xl">
      {/* Delivery */}
      <section className="grid grid-cols-1 gap-2">
        <h2 className="text-sm font-bold text-white mb-1">{t('setb.notifDelivery')}</h2>
        <Switch
          label={t('setb.desktopNotifications')}
          hint={t('setb.desktopNotificationsHint')}
          Icon={IconBell}
          tint="bg-brand-500/15 text-brand-300"
          on={systemDelivery}
          onToggle={handleSystemToggle}
        />
        <p className="text-[11px] text-slate-500 px-1">
          {t('setb.notifDeliveryNote')}
        </p>
      </section>

      {/* Quiet hours */}
      <section className="grid grid-cols-1 gap-2">
        <h2 className="text-sm font-bold text-white mb-1">{t('setb.quietHours')}</h2>
        <Switch
          label={t('setb.quietHoursLabel')}
          hint={t('setb.quietHoursHint')}
          Icon={IconMoon}
          tint="bg-indigo-500/15 text-indigo-300"
          on={quietHours.enabled}
          onToggle={() => setQuietHours({ enabled: !quietHours.enabled })}
        />
        {quietHours.enabled && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              {t('setb.from')}
              <select
                value={quietHours.start}
                onChange={(e) => setQuietHours({ start: Number(e.target.value) })}
                className="rounded-lg bg-white/[0.06] border border-white/10 px-2 py-1.5 text-sm text-white"
              >
                {HOURS.map((h) => <option key={h} value={h} className="bg-canvas-soft">{hourLabel(h)}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              {t('setb.to')}
              <select
                value={quietHours.end}
                onChange={(e) => setQuietHours({ end: Number(e.target.value) })}
                className="rounded-lg bg-white/[0.06] border border-white/10 px-2 py-1.5 text-sm text-white"
              >
                {HOURS.map((h) => <option key={h} value={h} className="bg-canvas-soft">{hourLabel(h)}</option>)}
              </select>
            </label>
          </div>
        )}
      </section>

      {/* Per-type toggles */}
      <section className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">{t('setb.notifWhatTitle')}</h2>
          <button
            onClick={() => setAllKinds(!allOn)}
            className="text-[11px] font-semibold text-brand-300 hover:text-brand-200"
          >
            {allOn ? t('setb.turnAllOff') : t('setb.turnAllOn')}
          </button>
        </div>
        {GROUPS.map((g) => {
          const kinds = NOTIF_KINDS.filter((k) => NOTIF_CATALOG[k].group === g.id)
          if (kinds.length === 0) return null
          return (
            <div key={g.id} className="grid grid-cols-1 gap-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mt-1">{t(groupLabelKey(g.id))}</p>
              {kinds.map((k) => {
                const meta = NOTIF_CATALOG[k]
                return (
                  <Switch
                    key={k}
                    label={meta.label}
                    hint={meta.hint}
                    Icon={meta.Icon}
                    tint={meta.tint}
                    on={enabled(k)}
                    onToggle={() => setKind(k, !enabled(k))}
                  />
                )
              })}
            </div>
          )
        })}
      </section>
    </div>
  )
}
