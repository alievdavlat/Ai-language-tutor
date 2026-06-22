import { useBackendQuery } from '../../../services/backend/useBackend'
import { studio } from '../../../services/studio/store'
import { cn } from '../../../lib/classnames'
import { IconTrophy } from '../../../components/icons'
import { useT } from '../../../i18n'

export default function FeaturedPage(): JSX.Element {
  const t = useT()
  const featured = useBackendQuery(() => studio.listFeatured(), [], [])

  const addSlot = async (): Promise<void> => {
    await studio.upsertFeatured({
      id: `feat_${Math.random().toString(36).slice(2, 8)}`,
      kind: 'ad',
      title: 'New ad campaign',
      cover: 'from-amber-500 to-orange-700',
      position: featured.data.length,
      active: false,
      sponsor: 'Sponsor',
      priceWeekUsd: 99
    })
    featured.refresh()
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">{t('adm.featuredTitle')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t('adm.featuredSubtitle')}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {featured.data.map((f) => (
          <div key={f.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 flex items-center gap-3">
            <div className={cn('w-14 h-9 rounded-md bg-gradient-to-br shrink-0', f.cover)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{f.title}</p>
              <p className="text-[11px] text-slate-500">{f.kind === 'ad' ? `${t('adm.sponsored')} · ${f.sponsor} · $${f.priceWeekUsd}/wk` : t('adm.courseOrganic')}</p>
            </div>
            <button onClick={() => void studio.toggleFeatured(f.id).then(() => featured.refresh())} className={cn('relative w-11 h-6 rounded-full transition shrink-0', f.active ? 'bg-emerald-500' : 'bg-white/15')}>
              <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition', f.active ? 'left-[22px]' : 'left-0.5')} />
            </button>
            <button onClick={() => void studio.removeFeatured(f.id).then(() => featured.refresh())} className="text-[11px] font-bold text-slate-500 hover:text-rose-300 px-1">{t('adm.remove')}</button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.015] p-5 flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center"><IconTrophy className="w-5 h-5" /></span>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{t('adm.sellSponsoredSlot')}</p>
          <p className="text-xs text-slate-500">{t('adm.sponsoredSlotBlurb')}</p>
        </div>
        <button onClick={() => void addSlot()} className="rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold px-4 py-2">{t('adm.addSlot')}</button>
      </div>
    </div>
  )
}
