import { useState } from 'react'
import type { Course } from '@shared/types'
import type { PaymentProvider } from '@shared/types/studio.types'
import { PageHeader, ProgressBar, SectionHeading, StatCard, Spinner } from '../../components/ui'
import { IconBolt, IconDownload, IconHeart, IconTrophy, IconUsers } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { studio } from '../../services/studio/store'
import { cn } from '../../lib/classnames'

const PROVIDER_LABEL: Record<PaymentProvider, string> = { payme: 'Payme', click: 'Click', stripe: 'Stripe', paypal: 'PayPal' }

export default function TeacherMonetizationPage(): JSX.Element {
  const me = backend.currentUserId()
  const balance = useBackendQuery(() => studio.teacherBalance(me ?? undefined), [me], null)
  const sources = useBackendQuery(() => studio.revenueSources(me ?? undefined), [me], [])
  const payouts = useBackendQuery(() => studio.listPayouts(me ?? undefined), [me], [])
  const referral = useBackendQuery(() => studio.getReferral(me ?? undefined), [me], null)
  const courses = useBackendQuery(() => (me ? backend.myCourses(me) : Promise.resolve([])), [me], [] as Course[])
  const orders = useBackendQuery(() => studio.listOrders(me ?? undefined), [me], [])
  const [requesting, setRequesting] = useState(false)
  const [copied, setCopied] = useState(false)

  const requestPayout = async (): Promise<void> => {
    if (!balance.data || balance.data.availableUsd <= 0) return
    setRequesting(true)
    await studio.requestPayout(balance.data.availableUsd, 'payme', me ?? undefined)
    setRequesting(false)
    payouts.refresh()
    balance.refresh()
  }

  const totalSources = sources.data.reduce((a, s) => a + s.amountUsd, 0)
  const payingStudents = new Set(orders.data.filter((o) => o.status === 'paid' && o.kind !== 'tip').map((o) => o.buyerId)).size
  const tipsThisMonth = orders.data.filter((o) => o.kind === 'tip' && o.status === 'paid').reduce((a, o) => a + o.amountUsd, 0)

  if (!balance.data) return <div className="h-full grid place-items-center"><Spinner /></div>
  const b = balance.data

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Teacher · Monetization"
          title="Earnings"
          subtitle="Course sales, subscriptions & tips — paid out via Payme / Click / Stripe."
          back="/teacher"
          crumbs={[{ label: 'Teacher', to: '/teacher' }, { label: 'Monetization' }]}
        />

        {/* Big balance card with payout */}
        <div className="rounded-card p-6 bg-gradient-to-br from-emerald-500/20 to-brand-500/20 border border-emerald-400/20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-emerald-200/80 font-bold">Available to withdraw</p>
            <p className="text-4xl font-bold text-white mt-1">${b.availableUsd.toLocaleString()}.00</p>
            <p className="text-xs text-emerald-200 mt-1">${b.pendingUsd.toLocaleString()} clearing · ${b.lifetimeUsd.toLocaleString()} lifetime</p>
          </div>
          <button onClick={() => void requestPayout()} disabled={requesting || b.availableUsd <= 0} className="btn-primary px-5 py-2.5 disabled:opacity-50 shrink-0">
            {requesting ? 'Requesting…' : b.availableUsd > 0 ? `Withdraw $${b.availableUsd.toLocaleString()}` : 'Nothing to withdraw'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={`$${b.lifetimeUsd.toLocaleString()}`} label="Lifetime" tone="brand" icon={<IconTrophy />} />
          <StatCard value={payingStudents.toString()} label="Paying students" tone="emerald" icon={<IconUsers />} />
          <StatCard value={payingStudents ? `$${Math.round(totalSources / payingStudents)}` : '$0'} label="Avg. per student" tone="amber" icon={<IconBolt />} />
          <StatCard value={`$${tipsThisMonth}`} label="Tips" tone="rose" icon={<IconHeart />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue sources */}
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <SectionHeading title="Revenue sources" subtitle="From paid orders" />
            <div className="flex flex-col gap-3">
              {sources.data.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-200">{s.label}</span>
                    <span className="text-sm font-bold text-emerald-200">${s.amountUsd.toLocaleString()}</span>
                  </div>
                  <ProgressBar value={s.pct} color="green" />
                </div>
              ))}
            </div>
          </div>

          {/* Payouts */}
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <SectionHeading title="Payouts" subtitle={`${payouts.data.length} requests`} />
            <div className="flex flex-col">
              {payouts.data.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No payouts yet.</p>}
              {payouts.data.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{new Date(p.requestedAt).toLocaleDateString()}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{p.status} · {PROVIDER_LABEL[p.provider]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-bold', p.status === 'paid' ? 'text-slate-200' : 'text-emerald-300')}>${p.amountUsd.toLocaleString()}</span>
                    {p.status === 'paid' && <button title="Download receipt" className="text-slate-500 hover:text-brand-300"><IconDownload className="w-4 h-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Referral */}
        {referral.data && (
          <div className="rounded-card border border-violet-400/20 bg-violet-500/[0.07] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <SectionHeading title="Referral program" subtitle={`Earn $${referral.data.rewardUsd} per signup · ${referral.data.conversions} conversions`} />
              <div className="flex items-center gap-2 mt-1">
                <code className="rounded-lg bg-black/30 border border-white/10 px-3 py-1.5 text-sm font-mono text-violet-200">{referral.data.code}</code>
                <button onClick={() => { void navigator.clipboard?.writeText(referral.data!.code); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="btn-ghost text-xs px-3 py-1.5">{copied ? 'Copied!' : 'Copy'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        <div>
          <SectionHeading title="Your products" subtitle="Manage pricing" />
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            {courses.data.length === 0 && <p className="text-sm text-slate-400 py-5 text-center">No products yet.</p>}
            {courses.data.map((c) => {
              const price = c.pricing.kind === 'free' ? 'Free' : c.pricing.kind === 'one-off' ? `$${c.pricing.usd}` : `$${c.pricing.usdPerMo}/mo`
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                    <p className="text-[11px] text-slate-400 capitalize">{c.pricing.kind} · {c.enrollmentCount.toLocaleString()} enrolled</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-200">{price}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
