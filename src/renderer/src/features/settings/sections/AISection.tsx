import { useEffect, useState } from 'react'
import { AI_PROVIDERS, type AIProvider, type AIProviderId } from '@shared/constants'
import type { AIConfig } from '@shared/types'
import { useAppStore } from '../../../store/useAppStore'
import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { IconArrowRight, IconCheck, IconLock } from '../../../components/icons'
import { testProvider, type TestResult } from '../../../services/ai/test'
import { useT } from '../../../i18n'
import type { StringKey } from '../../../i18n/strings'

interface AISectionProps {
  ai: AIConfig | undefined
  onChange: (ai: AIConfig) => void
}

type TierFilter = 'all' | 'free' | 'paid'

const TIER_TINT: Record<string, string> = {
  flagship: 'bg-amber-500/20 text-amber-200',
  reasoning: 'bg-violet-500/20 text-violet-200',
  fast: 'bg-emerald-500/20 text-emerald-200',
  free: 'bg-sky-500/20 text-sky-200'
}

function pricingLabel(
  t: ReturnType<typeof useT>,
  input: number | null,
  output: number | null
): string {
  if (input === 0 && output === 0) return t('seta.free')
  if (input == null || output == null) return '—'
  return `$${input.toFixed(2)} / $${output.toFixed(2)} ${t('seta.per1mTokens')}`
}

interface CardProps {
  p: AIProvider
  ai: AIConfig
  open: boolean
  onToggleOpen: () => void
  /** Apply a change against the freshest AIConfig (avoids stale-prop clobbering). */
  mutate: (fn: (cur: AIConfig) => AIConfig) => void
}

function ProviderCard({ p, ai, open, onToggleOpen, mutate }: CardProps): JSX.Element {
  const t = useT()
  const isActive = ai.activeProviderId === p.id
  const persistedToken = ai.tokens?.[p.id] ?? ''
  const modelId = ai.models?.[p.id] ?? p.defaultModelId ?? p.models[0].id
  // Local mirror so the field never blanks during the async profile.save and
  // the pasted value can't be lost to a controlled-input round-trip race.
  const [token, setTokenLocal] = useState(persistedToken)
  useEffect(() => {
    setTokenLocal(persistedToken)
  }, [persistedToken])
  const hasToken = token.trim().length > 0
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)

  const runTest = async (): Promise<void> => {
    if (!hasToken || testing) return
    setTesting(true)
    setResult(null)
    const res = await testProvider({ provider: p.id, model: modelId, apiKey: token.trim() })
    setResult(res)
    setTesting(false)
    // Auto-activate on a successful test if no provider is active yet.
    if (res.ok) mutate((cur) => (cur.activeProviderId ? cur : { ...cur, activeProviderId: p.id }))
  }

  const setToken = (next: string): void => {
    setTokenLocal(next)
    mutate((cur) => ({ ...cur, tokens: { ...(cur.tokens ?? {}), [p.id]: next } }))
  }
  const setModel = (id: string): void => {
    mutate((cur) => ({ ...cur, models: { ...(cur.models ?? {}), [p.id]: id } }))
  }
  const setActive = (): void => {
    mutate((cur) => ({ ...cur, activeProviderId: p.id }))
  }

  return (
    <article
      className={cn(
        'rounded-card border bg-white/[0.025] overflow-hidden transition',
        isActive ? 'border-brand-400/50 ring-2 ring-brand-400/20' : 'border-white/10 hover:border-white/20'
      )}
    >
      {/* Header */}
      <button onClick={onToggleOpen} className={cn('w-full text-left bg-gradient-to-br p-4 flex items-center gap-4', p.cover)}>
        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl">{p.flag}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-white">{p.name}</h3>
            {p.hasFreeTier && <span className="inline-flex items-center rounded-full bg-emerald-500/80 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">{t('seta.free')}</span>}
            {isActive && <span className="inline-flex items-center rounded-full bg-white/30 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">{t('seta.active')}</span>}
          </div>
          <p className="text-xs text-white/90 mt-0.5 line-clamp-1">{p.tagline}</p>
        </div>
        <span className={cn('text-white/80 text-xs', open && 'rotate-90')} aria-hidden>→</span>
      </button>

      {/* Expanded */}
      {open && (
        <div className="p-5 flex flex-col gap-5 bg-black/20">
          {/* Strengths / weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">{t('seta.strengths')}</p>
              <ul className="text-xs text-slate-300 mt-1.5 flex flex-col gap-1">
                {p.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-1.5"><span className="text-emerald-400 mt-0.5">✓</span><span>{s}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-rose-300 font-bold">{t('seta.watchOutFor')}</p>
              <ul className="text-xs text-slate-300 mt-1.5 flex flex-col gap-1">
                {p.weaknesses.map((s) => (
                  <li key={s} className="flex items-start gap-1.5"><span className="text-rose-400 mt-0.5">•</span><span>{s}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pricing table */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">{t('seta.modelsPricing')} · {t('seta.verified')} {p.verifiedOn}</p>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] overflow-hidden">
              {p.models.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-white/[0.06] last:border-0',
                    modelId === m.id ? 'bg-brand-500/10' : 'hover:bg-white/[0.03]'
                  )}
                >
                  <input
                    type="radio"
                    name={`model-${p.id}`}
                    checked={modelId === m.id}
                    onChange={() => setModel(m.id)}
                    className="accent-brand-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{m.label}</p>
                    <p className="text-[11px] text-slate-400">{m.contextK}K {t('seta.context')}</p>
                  </div>
                  <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full', TIER_TINT[m.tier])}>
                    {t(`seta.tier_${m.tier}` as StringKey)}
                  </span>
                  <span className="text-xs text-slate-300 font-mono shrink-0">{pricingLabel(t, m.inputUsdPerM, m.outputUsdPerM)}</span>
                </label>
              ))}
            </div>
            {p.freeTier && (
              <p className="text-[11px] text-emerald-300 mt-2">🎁 {p.freeTier}</p>
            )}
          </div>

          {/* Token steps */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">{t('seta.howToGetToken')}</p>
            <ol className="flex flex-col gap-1.5 text-sm text-slate-200">
              {p.tokenSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="inline-flex shrink-0 w-5 h-5 rounded-full bg-white/[0.06] text-[11px] font-bold text-slate-300 items-center justify-center mt-0.5">{i + 1}</span>
                  {step.url ? (
                    <a href={step.url} target="_blank" rel="noreferrer" className="text-brand-300 hover:text-brand-200 inline-flex items-center gap-1">
                      {step.label} <IconArrowRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span>{step.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Token input */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{p.tokenLabel}</label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={t('seta.pasteApiKey')}
                className="input flex-1 font-mono text-xs"
              />
              {hasToken && (
                <>
                  <button
                    onClick={() => void runTest()}
                    disabled={testing}
                    className="rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-xs px-3 py-2.5 text-slate-200 disabled:opacity-60"
                  >
                    {testing ? t('seta.testing') : t('seta.test')}
                  </button>
                  <button
                    onClick={setActive}
                    disabled={isActive}
                    className={cn(
                      'btn-primary text-xs px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-60',
                      isActive && '!bg-white/[0.06] !text-emerald-300 !shadow-none'
                    )}
                  >
                    {isActive ? `✓ ${t('seta.active')}` : t('seta.useThisAi')}
                  </button>
                </>
              )}
            </div>
            {result && (
              <p className={cn(
                'text-[11px] mt-2 font-mono',
                result.ok ? 'text-emerald-300' : 'text-rose-300'
              )}>
                {result.ok ? '✓' : '✗'} {result.detail} <span className="text-slate-500">· {result.ms}ms</span>
              </p>
            )}
            <p className="text-[10px] text-slate-500 mt-1.5">{t('seta.storedLocally')}</p>
          </div>
        </div>
      )}
    </article>
  )
}

export default function AISection({ ai, onChange }: AISectionProps): JSX.Element {
  const t = useT()
  const cfg = ai ?? { activeProviderId: null, tokens: {}, models: {} }
  const [tier, setTier] = useState<TierFilter>('all')
  const [openId, setOpenId] = useState<AIProviderId | null>(cfg.activeProviderId as AIProviderId | null)

  // Apply every change against the freshest AIConfig in the store so a later
  // edit (model pick, activate) can't overwrite an earlier one (the token).
  const mutate = (fn: (cur: AIConfig) => AIConfig): void => {
    const live = useAppStore.getState().profile?.settings.ai ?? { activeProviderId: null, tokens: {}, models: {} }
    onChange(fn(live))
  }

  const filtered = AI_PROVIDERS.filter((p) => {
    if (tier === 'free') return p.hasFreeTier
    if (tier === 'paid') return !p.hasFreeTier
    return true
  })

  const isReady = cfg.activeProviderId && cfg.tokens?.[cfg.activeProviderId]

  return (
    <div className="flex flex-col gap-5">
      {/* Status banner */}
      {!isReady ? (
        <Card>
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0">
              <IconLock className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{t('seta.aiLocked')}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('seta.aiLockedDesc')}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0">
              <IconCheck className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{t('seta.aiUnlocked')}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('seta.activeProvider')} <b className="text-white">{AI_PROVIDERS.find((p) => p.id === cfg.activeProviderId)?.name}</b>
                {' · '}{t('seta.model')} <span className="font-mono text-slate-300">{cfg.models?.[cfg.activeProviderId!] ?? AI_PROVIDERS.find((p) => p.id === cfg.activeProviderId)?.defaultModelId}</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        {(['all', 'free', 'paid'] as TierFilter[]).map((tt) => (
          <button
            key={tt}
            onClick={() => setTier(tt)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-bold capitalize transition border',
              tier === tt ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
            )}
          >
            {tt === 'all'
              ? t('seta.allProviders')
              : tt === 'free'
                ? `🎁 ${t('seta.freeTierAvailable')}`
                : `💳 ${t('seta.paidOnly')}`}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-500">{filtered.length} {t('seta.ofWord')} {AI_PROVIDERS.length} {t('seta.shown')}</span>
      </div>

      {/* Provider cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((p) => (
          <ProviderCard
            key={p.id}
            p={p}
            ai={cfg}
            open={openId === p.id}
            onToggleOpen={() => setOpenId((cur) => cur === p.id ? null : p.id)}
            mutate={mutate}
          />
        ))}
      </div>

      <p className="text-[11px] text-slate-500 text-center">
        {t('seta.tokensFooter')}
      </p>
    </div>
  )
}
