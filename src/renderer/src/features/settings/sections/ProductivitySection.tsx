import { useEffect, useState } from 'react'
import { SectionHeading } from '../../../components/ui'
import { IconBolt, IconCheck, IconSearch, IconX } from '../../../components/icons'

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
        <h2 className="text-lg font-bold text-white">Productivity</h2>
        <p className="text-sm text-slate-400">A global lookup hotkey, a desktop widget, and a browser extension.</p>
      </div>

      {/* Quick lookup */}
      <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
        <SectionHeading title="Global quick-lookup" subtitle="Look up any word from anywhere on your computer" />
        <div className="flex items-center gap-3 mt-1">
          <span className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconSearch className="w-6 h-6" /></span>
          <div className="flex-1">
            <p className="text-sm text-slate-200">Press <kbd className="font-mono text-xs bg-white/10 border border-white/15 rounded px-1.5 py-0.5">Ctrl/⌘ + Shift + Space</kbd> any time — even while the app is in the background.</p>
            <p className="text-xs text-slate-500 mt-1">Inside the app you can also use <kbd className="font-mono text-[11px] bg-white/10 border border-white/15 rounded px-1 py-0.5">Ctrl/⌘ + K</kbd>.</p>
          </div>
          <button onClick={openLookup} className="btn-primary text-xs px-4 py-2 shrink-0">Try it</button>
        </div>
        {shortcutOk !== null && (
          <p className={`text-[11px] mt-3 inline-flex items-center gap-1.5 ${shortcutOk ? 'text-emerald-300' : 'text-amber-300'}`}>
            {shortcutOk ? <IconCheck className="w-3.5 h-3.5" /> : <IconX className="w-3.5 h-3.5" />}
            {shortcutOk ? 'Global shortcut is registered.' : 'Global shortcut could not register (another app may own it).'}
          </p>
        )}
        {shortcutOk === null && <p className="text-[11px] mt-3 text-slate-500">Global shortcut runs in the desktop app (not the browser preview).</p>}
      </div>

      {/* Widget */}
      <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
        <SectionHeading title="Desktop widget" subtitle="A floating word-of-the-day + lookup that stays on top" />
        <div className="flex items-center gap-3 mt-1">
          <span className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center shrink-0"><IconBolt className="w-6 h-6" /></span>
          <p className="text-sm text-slate-200 flex-1">Pin a small always-on-top widget to a corner of your screen.</p>
          <button onClick={() => void toggleWidget()} disabled={!api} className="btn-ghost text-xs px-4 py-2 shrink-0 disabled:opacity-50">
            {widgetOn ? 'Hide widget' : 'Show widget'}
          </button>
        </div>
        {!api && <p className="text-[11px] mt-3 text-slate-500">Available in the desktop app.</p>}
      </div>

      {/* Browser extension */}
      <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
        <SectionHeading title="Browser extension" subtitle="Look up & save words on any website" />
        <ol className="text-sm text-slate-300 flex flex-col gap-1.5 mt-1 list-decimal pl-5">
          <li>Open your browser's extensions page (<code className="text-xs">chrome://extensions</code>) and enable <b>Developer mode</b>.</li>
          <li>Click <b>Load unpacked</b> and select the <code className="text-xs">extension/</code> folder in this project.</li>
          <li>Select any word on a page → right-click → <b>Look up in SpeakAI</b>, or click the toolbar icon.</li>
        </ol>
        <p className="text-xs text-slate-500 mt-2">The extension uses the same free dictionary source and deep-links saved words back into the app.</p>
      </div>
    </div>
  )
}
