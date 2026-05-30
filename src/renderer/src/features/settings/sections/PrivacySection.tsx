/**
 * Settings → Privacy (Task #38 + #39). Interface language + content-safety +
 * incognito toggles + GDPR export / delete. Self-contained: reads/writes the
 * two privacy flags through the standard settings `patch`, and uses the privacy
 * service for the export/delete hooks.
 */
import { useState } from 'react'
import type { UserSettings } from '@shared/types'
import { cn } from '../../../lib/classnames'
import { useT } from '../../../i18n'
import UILanguageSwitch from '../../../components/ui/UILanguageSwitch'
import * as privacy from '../../../services/privacy'

function ToggleRow({
  label,
  hint,
  on,
  onToggle
}: {
  label: string
  hint?: string
  on: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 cursor-pointer hover:bg-white/[0.05] transition"
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

export default function PrivacySection({
  contentSafety,
  incognito,
  onChange
}: {
  contentSafety: boolean
  incognito: boolean
  onChange: (patch: Partial<UserSettings>) => void
}): JSX.Element {
  const t = useT()
  const [busy, setBusy] = useState<null | 'export' | 'delete'>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const doExport = async (): Promise<void> => {
    setBusy('export'); setMsg(null)
    try {
      await privacy.exportMyData()
      setMsg('Your data export has been downloaded.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setBusy(null)
    }
  }

  const doDelete = async (): Promise<void> => {
    if (!window.confirm('Permanently delete your account and all your data? This cannot be undone.')) return
    setBusy('delete'); setMsg(null)
    try {
      await privacy.deleteMyAccount()
      // signOut in the service resets the store → router sends to /signin.
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Delete failed.')
      setBusy(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 max-w-2xl">
      <section>
        <h2 className="text-sm font-bold text-white mb-2">{t('settings.uiLanguage')}</h2>
        <UILanguageSwitch variant="list" />
      </section>

      <section className="grid grid-cols-1 gap-2">
        <h2 className="text-sm font-bold text-white mb-1">{t('settings.privacy')}</h2>
        <ToggleRow
          label={t('privacy.contentSafety')}
          on={contentSafety}
          onToggle={() => onChange({ contentSafety: !contentSafety })}
        />
        <ToggleRow
          label={t('privacy.incognito')}
          hint={t('privacy.incognitoHint')}
          on={incognito}
          onToggle={() => onChange({ incognito: !incognito })}
        />
      </section>

      <section className="grid grid-cols-1 gap-2">
        <h2 className="text-sm font-bold text-white mb-1">Your data</h2>
        <button
          onClick={() => void doExport()}
          disabled={busy !== null}
          className="rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-4 py-3 text-left text-sm font-semibold text-white transition disabled:opacity-50"
        >
          {busy === 'export' ? `${t('common.loading')}` : `📦 ${t('privacy.exportData')}`}
        </button>
        <button
          onClick={() => void doDelete()}
          disabled={busy !== null}
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-3 text-left text-sm font-semibold text-rose-300 transition disabled:opacity-50"
        >
          {busy === 'delete' ? `${t('common.loading')}` : `🗑️ ${t('privacy.deleteAccount')}`}
        </button>
        {msg && <p className="text-[12px] text-slate-300 px-1">{msg}</p>}
      </section>
    </div>
  )
}
