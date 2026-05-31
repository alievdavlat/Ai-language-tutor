import { useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { IconHome, IconUsers, IconTrophy, IconSearch, type IconProps } from '../../components/icons'
import CommunityPage, { type CommunityView } from '../community/CommunityPage'
import ExplorePage from '../explore/ExplorePage'

type Tab = CommunityView | 'explore'

const NAV: { id: Tab; label: string; Icon: (p: IconProps) => JSX.Element }[] = [
  { id: 'feed', label: 'Feed', Icon: IconHome },
  { id: 'groups', label: 'Groups & Clubs', Icon: IconUsers },
  { id: 'challenges', label: 'Challenges', Icon: IconTrophy },
  { id: 'explore', label: 'Explore', Icon: IconSearch }
]

/**
 * "Connect" — the unified social hub (merges the old Community + Explore pages),
 * laid out like Instagram: an icon nav switches between Feed, Groups & Clubs,
 * Challenges and Explore (tapping Explore = the search/discover surface).
 * Each tab reuses the real, existing page logic (no new mock data).
 */
export default function SocialPage({ initialTab = 'feed' }: { initialTab?: Tab } = {}): JSX.Element {
  const [params, setParams] = useSearchParams()
  const tab = ((params.get('tab') as Tab) || initialTab) as Tab
  const setTab = (t: Tab): void => setParams(t === 'feed' ? {} : { tab: t }, { replace: true })

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-black tracking-tight">Connect</h1>
          <p className="text-sm text-slate-400 mt-1">Your feed, groups & clubs, challenges, and everything to discover — in one place.</p>
        </div>

        {/* Instagram-style icon nav */}
        <div className="flex items-center gap-1 mb-6 border-b border-white/10 -mx-1 px-1 overflow-x-auto">
          {NAV.map((n) => {
            const active = tab === n.id
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={cn(
                  'relative flex items-center gap-2 px-4 py-2.5 text-sm font-bold whitespace-nowrap transition',
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <n.Icon className="w-[18px] h-[18px]" />
                <span>{n.label}</span>
                {active && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-brand-400" />}
              </button>
            )
          })}
        </div>

        {/* Content — real existing pages, embedded */}
        {tab === 'explore'
          ? <ExplorePage embedded />
          : <CommunityPage view={tab} onViewChange={(v) => setTab(v)} embedded />}
      </div>
    </div>
  )
}
