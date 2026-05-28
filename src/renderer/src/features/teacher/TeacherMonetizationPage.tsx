import { ProgressBar, SectionHeading, StatCard } from '../../components/ui'
import { IconBolt, IconDownload, IconHeart, IconTrophy, IconUsers } from '../../components/icons'

const SOURCES = [
  { label: 'Course sales', amount: 1840, pct: 65 },
  { label: 'Subscriptions', amount: 720, pct: 25 },
  { label: 'Tips', amount: 180, pct: 7 },
  { label: 'Sponsorships', amount: 80, pct: 3 }
]

const PAYOUTS = [
  { date: '2026-05-01', amount: 2210, status: 'paid' },
  { date: '2026-04-01', amount: 1860, status: 'paid' },
  { date: '2026-03-01', amount: 1640, status: 'paid' },
  { date: '2026-06-01', amount: 2820, status: 'pending' }
]

const PRODUCTS = [
  { name: 'IELTS Speaking Bootcamp', price: '$29', enrolled: 84, kind: 'one-off' },
  { name: 'Monthly Coaching', price: '$15/mo', enrolled: 48, kind: 'subscription' },
  { name: 'Past Tenses Deep Dive', price: '$12', enrolled: 56, kind: 'one-off' },
  { name: 'Free Foundations', price: 'Free', enrolled: 1820, kind: 'free' }
]

export default function TeacherMonetizationPage(): JSX.Element {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-violet-300 font-bold">Teacher · Monetization</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">Earnings</h1>
            <p className="text-sm text-slate-400 mt-1">This month → next payout 2026-06-01</p>
          </div>
          <button className="btn-ghost text-xs px-4 py-2">Payout settings</button>
        </div>

        {/* Big balance card */}
        <div className="rounded-card p-6 bg-gradient-to-br from-emerald-500/20 to-brand-500/20 border border-emerald-400/20">
          <p className="text-[11px] uppercase tracking-widest text-emerald-200/80 font-bold">Pending balance</p>
          <p className="text-4xl font-bold text-white mt-1">$2,820.00</p>
          <p className="text-xs text-emerald-200 mt-1">+34% vs. last month</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value="$8,540" label="Lifetime" tone="brand" icon={<IconTrophy />} />
          <StatCard value="188" label="Paying students" tone="emerald" icon={<IconUsers />} />
          <StatCard value="$22.60" label="Avg. per student" tone="amber" icon={<IconBolt />} />
          <StatCard value="$120" label="Tips this mo." tone="rose" icon={<IconHeart />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue sources */}
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <SectionHeading title="Revenue sources" subtitle="This month" />
            <div className="flex flex-col gap-3">
              {SOURCES.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-200">{s.label}</span>
                    <span className="text-sm font-bold text-emerald-200">${s.amount.toLocaleString()}</span>
                  </div>
                  <ProgressBar value={s.pct} color="green" />
                </div>
              ))}
            </div>
          </div>

          {/* Payouts */}
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
            <SectionHeading title="Payouts" subtitle="Last 4 months" />
            <div className="flex flex-col">
              {PAYOUTS.map((p) => (
                <div key={p.date} className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-white">{p.date}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{p.status}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${p.status === 'paid' ? 'text-slate-200' : 'text-emerald-300'}`}>${p.amount.toLocaleString()}</span>
                    {p.status === 'paid' && (
                      <button title="Download receipt" className="text-slate-500 hover:text-brand-300"><IconDownload className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <SectionHeading title="Your products" subtitle="Manage pricing" />
          <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{p.kind} · {p.enrolled.toLocaleString()} enrolled</p>
                </div>
                <span className="text-sm font-bold text-emerald-200">{p.price}</span>
                <button className="btn-ghost text-xs px-3 py-1.5">Edit</button>
              </div>
            ))}
            <button className="w-full text-sm font-semibold text-brand-300 hover:text-brand-200 py-3">+ Add product</button>
          </div>
        </div>
      </div>
    </div>
  )
}
