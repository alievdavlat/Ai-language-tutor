import { useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { IconHome, IconUsers, IconTrophy, IconSearch, type IconProps } from '../../components/icons'
import CommunityPage, { type CommunityView } from '../community/CommunityPage'
import ExplorePage from '../explore/ExplorePage'
import NowBar from './NowBar'

type Tab = CommunityView | 'explore'

const NAV: { id: Tab; label: string; Icon: (p: IconProps) => JSX.Element }[] = [
  { id: 'feed', label: 'Feed', Icon: IconHome },
  { id: 'groups', label: 'Groups & Clubs', Icon: IconUsers },
  { id: 'challenges', label: 'Challenges', Icon: IconTrophy },
  { id: 'explore', label: 'Discover', Icon: IconSearch }
]

/**
 * "Explore" — the unified social hub (the old Community + Explore + Live +
 * Study-Buddy surfaces), laid out like Instagram: a flush "Now" bar (live rooms
 * + online buddies) on top, then an icon nav (Feed · Groups & Clubs · Challenges
 * · Discover). Live is surfaced via the Now bar (not a tab); buddies too. Each
 * tab reuses the real existing page logic — no new mock data. Full-width.
 */
export default function SocialPage({ initialTab = 'feed' }: { initialTab?: Tab } = {}): JSX.Element {
  const [params, setParams] = useSearchParams()
  const tab = ((params.get('tab') as Tab) || initialTab) as Tab
  const setTab = (t: Tab): void => setParams(t === 'feed' ? {} : { tab: t }, { replace: true })

  return (
    <div className="h-full overflow-y-auto">
      {/* Flush header */}
      <div className="px-6 pt-5 pb-3">
        <h1 className="text-2xl font-black tracking-tight">Explore</h1>
      </div>

      {/* Instagram-style "Now" bar — live + online buddies (flush, not in a card) */}
      <NowBar />

      {/* Icon nav under the bar */}
      <div className="px-6 flex items-center gap-1 border-b border-white/10 overflow-x-auto sticky top-0 bg-canvas/80 backdrop-blur z-10">
        {NAV.map((n) => {
          const active = tab === n.id
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition',
                active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <n.Icon className="w-[18px] h-[18px]" />
              <span>{n.label}</span>
              {active && <span className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-brand-400" />}
            </button>
          )
        })}
      </div>

      {/* Content — real existing pages, embedded (full-width) */}
      <div className="px-6 py-5 w-full">
        {tab === 'explore'
          ? <ExplorePage embedded />
          : <CommunityPage view={tab} onViewChange={(v) => setTab(v)} embedded />}
      </div>
    </div>
  )
}
