import { useEffect, useState } from 'react'
import { SectionHeading } from '../../../components/ui'
import { IconBolt, IconCheck, IconSearch, IconX } from '../../../components/icons'
import { useT } from '../../../i18n'

interface ProductivityApi {
  toggleWidget: () => Promise<boolean>
  shortcutStatus: () => Promise<boolean>
}
function getApi(): ProductivityApi | null {
  return (window as unknown as { api?: { productivity?: ProductivityApi } }).api?.productivity ?? null
}

/** Productivity tools, moved into Settings: global lookup hotkey, desktop
 *  widget, browser extension. */
export default function ProductivitySection(): JSX.Element {
  const t = useT()
  const api = getApi()
  const [shortcutOk, setShortcutOk] = useState<boolean | null>(null)
  const [widgetOn, setWidgetOn] = useState(false)

  useEffect(() => {
    if (api) void api.shortcutStatus().then(setShortcutOk)
    else setShortcutOk(null)
  }, [api])

  const toggleWidget = async (): Promise<void> => {
    if (!api) return
    setWidgetOn(await api.toggleWidget())
  }
  const openLookup = (): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-white">{t('setb.productivityTitle')}</h2>
        <p className="text-sm text-slate-400">{t('setb.productivitySubtitle')}</p>
      </div>

      {/* Quick lookup */}
      <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
        <SectionHeading title={t('setb.quickLookupTitle')} subtitle={t('setb.quickLookupSubtitle')} />
        <div className="flex items-center gap-3 mt-1">
          <span className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconSearch className="w-6 h-6" /></span>
          <div className="flex-1">
            <p className="text-sm text-slate-200">{t('setb.quickLookupPressPre')} <kbd className="font-mono text-xs bg-white/10 border border-white/15 rounded px-1.5 py-0.5">Ctrl/⌘ + Shift + Space</kbd> {t('setb.quickLookupPressPost')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('setb.quickLookupInAppPre')} <kbd className="font-mono text-[11px] bg-white/10 border border-white/15 rounded px-1 py-0.5">Ctrl/⌘ + K</kbd>.</p>
          </div>
          <button onClick={openLookup} className="btn-primary text-xs px-4 py-2 shrink-0">{t('setb.tryIt')}</button>
        </div>
        {shortcutOk !== null && (
          <p className={`text-[11px] mt-3 inline-flex items-center gap-1.5 ${shortcutOk ? 'text-emerald-300' : 'text-amber-300'}`}>
            {shortcutOk ? <IconCheck className="w-3.5 h-3.5" /> : <IconX className="w-3.5 h-3.5" />}
            {shortcutOk ? t('setb.shortcutRegistered') : t('setb.shortcutFailed')}
          </p>
        )}
        {shortcutOk === null && <p className="text-[11px] mt-3 text-slate-500">{t('setb.shortcutDesktopOnly')}</p>}
      </div>

      {/* Widget */}
      <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
        <SectionHeading title={t('setb.widgetTitle')} subtitle={t('setb.widgetSubtitle')} />
        <div className="flex items-center gap-3 mt-1">
          <span className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center shrink-0"><IconBolt className="w-6 h-6" /></span>
          <p className="text-sm text-slate-200 flex-1">{t('setb.widgetDesc')}</p>
          <button onClick={() => void toggleWidget()} disabled={!api} className="btn-ghost text-xs px-4 py-2 shrink-0 disabled:opacity-50">
            {widgetOn ? t('setb.hideWidget') : t('setb.showWidget')}
          </button>
        </div>
        {!api && <p className="text-[11px] mt-3 text-slate-500">{t('setb.availableInDesktop')}</p>}
      </div>

      {/* Browser extension */}
      <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
        <SectionHeading title={t('setb.extensionTitle')} subtitle={t('setb.extensionSubtitle')} />
        <ol className="text-sm text-slate-300 flex flex-col gap-1.5 mt-1 list-decimal pl-5">
          <li>{t('setb.extStep1Pre')} (<code className="text-xs">chrome://extensions</code>) {t('setb.extStep1Mid')} <b>{t('setb.extDeveloperMode')}</b>.</li>
          <li>{t('setb.extStep2Pre')} <b>{t('setb.extLoadUnpacked')}</b> {t('setb.extStep2Mid')} <code className="text-xs">extension/</code> {t('setb.extStep2Post')}</li>
          <li>{t('setb.extStep3Pre')} <b>{t('setb.extLookUpAction')}</b>{t('setb.extStep3Post')}</li>
        </ol>
        <p className="text-xs text-slate-500 mt-2">{t('setb.extensionNote')}</p>
      </div>
    </div>
  )
}
