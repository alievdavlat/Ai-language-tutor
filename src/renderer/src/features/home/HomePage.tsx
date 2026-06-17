import { useAppStore } from '../../store/useAppStore'
import { useT } from '../../i18n'
import { goalDef, useStats, useProgressStore, weekDays } from '../../services/progress'
import GreetingHeader from './sections/GreetingHeader'
import MegaSearch from './sections/MegaSearch'
import HeroCarousel from './sections/HeroCarousel'
import DailyProgressCard from './sections/DailyProgressCard'
import WeekStreakCard from './sections/WeekStreakCard'
import DailyQuestCard from './sections/DailyQuestCard'
import FeaturedRail from './sections/FeaturedRail'
import FeedRails from './sections/FeedRails'

// ─── AI setup status banner ───────────────────────────────────────────────────

function AISetupBanner(): JSX.Element | null {
  const t = useT()
  const autoSetup = useAppStore((s) => s.autoSetup)

  if (!autoSetup.phase || autoSetup.phase === 'ready') return null

  const messages: Record<string, string> = {
    starting: t('home.aiStarting'),
    pulling: t('home.aiDownloading', { pct: autoSetup.pullPct }),
    failed: t('home.aiFailed')
  }

  const msg = messages[autoSetup.phase] ?? ''
  const isFailed = autoSetup.phase === 'failed'

  return (
    <div
      className={[
        'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs',
        isFailed
          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
          : 'bg-brand-500/10 border border-brand-400/20 text-brand-200'
      ].join(' ')}
    >
      {!isFailed && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse shrink-0" />}
      {isFailed && <span className="shrink-0">⚠</span>}
      <span>{msg}</span>
      {autoSetup.phase === 'pulling' && (
        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden ml-2">
          <div className="h-full rounded-full bg-brand-400 transition-all duration-500" style={{ width: `${autoSetup.pullPct}%` }} />
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage(): JSX.Element {
  const t = useT()
  const profile = useAppStore((s) => s.profile)
  const stats = useStats()
  const dailyGoalId = useProgressStore((s) => s.dailyGoalId)
  const events = useProgressStore((s) => s.events)
  const frozenDates = useProgressStore((s) => s.frozenDates)
  const goalXp = goalDef(dailyGoalId).xp
  const practisedDays = weekDays(events, frozenDates, new Date())
    .map((d, i) => (d.state === 'done' ? i : -1))
    .filter((i) => i >= 0)

  if (!profile) {
    return <div className="h-full flex items-center justify-center text-slate-400 text-sm">{t('common.loading')}</div>
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 flex flex-col gap-6 w-full">
        {/* Greeting + search */}
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-4">
          <div className="flex-1 min-w-0">
            <GreetingHeader profile={profile} />
          </div>
          <div className="lg:self-center">
            <MegaSearch />
          </div>
        </div>

        <AISetupBanner />

        {/* Featured / live announcements */}
        <HeroCarousel />

        {/* Today — keep the learner's daily loop */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DailyProgressCard current={stats.todayXp} goal={goalXp} />
          <DailyQuestCard />
          <WeekStreakCard streak={stats.streak} practisedDays={practisedDays} />
        </div>

        {/* Featured & sponsored slots (Admin → Featured & promotions) */}
        <FeaturedRail />

        {/* Content feed */}
        <FeedRails />
      </div>
    </div>
  )
}
