/**
 * Settings → Desktop (#16). Toggles for the OS-level integration owned by the
 * Electron main process: tray icon, minimize/close-to-tray, launch-on-login,
 * and start-minimized. State lives main-side (a JSON file in userData) and is
 * read/patched over the `window.api.desktop` bridge — so these flags survive
 * restarts and drive the login item even before the renderer loads.
 *
 * Gracefully degrades in the browser preview (no `window.api`): the section
 * still renders but explains the controls only work in the desktop app.
 */
import { useEffect, useState } from 'react'
import { SectionHeading } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { IconBolt, IconCheck } from '../../../components/icons'
import { useT } from '../../../i18n'

interface DesktopSettings {
  showTrayIcon: boolean
  minimizeToTray: boolean
  closeToTray: boolean
  launchOnStartup: boolean
  startMinimized: boolean
}

interface DesktopApi {
  getSettings: () => Promise<DesktopSettings>
  setSettings: (patch: Partial<DesktopSettings>) => Promise<DesktopSettings>
}

function getApi(): DesktopApi | null {
  return (window as unknown as { api?: { desktop?: DesktopApi } }).api?.desktop ?? null
}

function ToggleRow({
  label,
  hint,
  on,
  disabled,
  onToggle
}: {
  label: string
  hint?: string
  on: boolean
  disabled?: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <div
      role="button"
      aria-pressed={on}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onToggle()}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.05]'
      )}
    >
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <span className={cn('w-10 h-6 rounded-full p-0.5 transition shrink-0', on ? 'bg-brand-500' : 'bg-white/15')}>
        <span className={cn('block w-5 h-5 rounded-full bg-white transition-transform', on && 'translate-x-4')} />
      </span>
    </div>
  )
}

export default function DesktopSection(): JSX.Element {
  const api = getApi()
  const t = useT()
  const [settings, setSettings] = useState<DesktopSettings | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (api) void api.getSettings().then(setSettings)
  }, [api])

  const update = async (patch: Partial<DesktopSettings>): Promise<void> => {
    if (!api) return
    const next = await api.setSettings(patch)
    setSettings(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-white">{t('seta.desktop')}</h2>
        <p className="text-sm text-slate-400">
          {t('seta.desktopDesc')}
        </p>
      </div>

      {!api && (
        <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
          <p className="text-sm text-slate-300">
            {t('seta.desktopBrowserNote')}
          </p>
        </div>
      )}

      {api && settings && (
        <>
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <SectionHeading
              title={t('seta.systemTray')}
              subtitle={t('seta.systemTraySub')}
            />
            <div className="flex items-center gap-3 mb-4 mt-1">
              <span className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0">
                <IconBolt className="w-6 h-6" />
              </span>
              <p className="text-sm text-slate-300 flex-1">
                {t('seta.trayHint')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <ToggleRow
                label={t('seta.showTrayIcon')}
                hint={t('seta.showTrayIconHint')}
                on={settings.showTrayIcon}
                onToggle={() => void update({ showTrayIcon: !settings.showTrayIcon })}
              />
              <ToggleRow
                label={t('seta.minimizeToTray')}
                hint={t('seta.minimizeToTrayHint')}
                on={settings.minimizeToTray}
                disabled={!settings.showTrayIcon}
                onToggle={() => void update({ minimizeToTray: !settings.minimizeToTray })}
              />
              <ToggleRow
                label={t('seta.closeToTray')}
                hint={t('seta.closeToTrayHint')}
                on={settings.closeToTray}
                disabled={!settings.showTrayIcon}
                onToggle={() => void update({ closeToTray: !settings.closeToTray })}
              />
            </div>
          </div>

          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <SectionHeading title={t('seta.launchOnLogin')} subtitle={t('seta.launchOnLoginSub')} />
            <div className="flex flex-col gap-3 mt-1">
              <ToggleRow
                label={t('seta.startAtLogin')}
                hint={t('seta.startAtLoginHint')}
                on={settings.launchOnStartup}
                onToggle={() => void update({ launchOnStartup: !settings.launchOnStartup })}
              />
              <ToggleRow
                label={t('seta.startMinimized')}
                hint={t('seta.startMinimizedHint')}
                on={settings.startMinimized}
                disabled={!settings.launchOnStartup}
                onToggle={() => void update({ startMinimized: !settings.startMinimized })}
              />
            </div>
          </div>

          {saved && (
            <p className="text-[11px] text-emerald-300 inline-flex items-center gap-1.5">
              <IconCheck className="w-3.5 h-3.5" /> {t('seta.saved')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
