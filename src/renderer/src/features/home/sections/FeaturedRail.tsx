import { useNavigate } from 'react-router-dom'
import { cn } from '../../../lib/classnames'
import { IconArrowRight } from '../../../components/icons'
import { useBackendQuery } from '../../../services/backend/useBackend'
import { studio } from '../../../services/studio/store'
import { SectionHeading } from '../../../components/ui'

/**
 * Featured rail (#A35). Renders the active featured/sponsored slots authored in
 * Admin → Featured & promotions (studio.listFeatured), which previously had no
 * learner-facing surface. Organic course slots link to the course; sponsored
 * ("ad") slots are clearly labelled and are NOT clickable navigations.
 *
 * Only rendered when at least one slot is active — Home stays clean otherwise.
 */
export default function FeaturedRail(): JSX.Element | null {
  const navigate = useNavigate()
  const featured = useBackendQuery(() => studio.listFeatured(), [], [])

  const active = featured.data.filter((f) => f.active)
  if (active.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading title="Featured" subtitle="Hand-picked courses and partners" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((f) => {
          const isAd = f.kind === 'ad'
          const go = (): void => { if (!isAd && f.refId) navigate(`/course/${f.refId}`) }
          return (
            <div
              key={f.id}
              onClick={go}
              className={cn(
                'group relative overflow-hidden rounded-card ring-1 ring-white/10 p-5 min-h-[140px] flex flex-col justify-end',
                `bg-gradient-to-br ${f.cover}`,
                !isAd && f.refId ? 'cursor-pointer' : ''
              )}
            >
              <div aria-hidden className="pointer-events-none absolute -top-12 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <span className={cn(
                'absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1',
                isAd ? 'bg-white/90 text-slate-900' : 'bg-black/35 text-white backdrop-blur'
              )}>
                {isAd ? 'Sponsored' : 'Featured'}
              </span>
              <div className="relative">
                <h3 className="text-lg font-bold text-white tracking-tight">{f.title}</h3>
                {isAd
                  ? <p className="text-white/80 text-xs mt-1">{f.sponsor ? `By ${f.sponsor}` : 'Partner offer'}</p>
                  : f.refId && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/course/${f.refId}`) }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white text-slate-900 font-semibold text-xs px-3.5 py-1.5 hover:bg-white/90 transition"
                    >
                      View course <IconArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
