import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, Tabs, type TabItem } from '../../components/ui'
import {
  IconBolt,
  IconChat,
  IconFlame,
  IconHeart,
  IconLive,
  IconMedal,
  IconStar,
  IconTrophy,
  IconUsers,
  type IconProps
} from '../../components/icons'

type Filter = 'all' | 'social' | 'learning' | 'system'
const FILTERS: TabItem<Filter>[] = [
  { id: 'all', label: 'All' },
  { id: 'social', label: 'Social' },
  { id: 'learning', label: 'Learning' },
  { id: 'system', label: 'System' }
]

interface Notif {
  id: string
  type: Filter
  Icon: (p: IconProps) => JSX.Element
  tint: string
  title: string
  body: string
  who?: string
  when: string
  unread: boolean
  to?: string
}

const NOTIFS: Notif[] = [
  { id: '1', type: 'social', Icon: IconHeart, tint: 'bg-pink-500/15 text-pink-300', who: 'Emma W.', title: 'Emma liked your post', body: '"How I memorize 20 words/day"', when: '5m ago', unread: true, to: '/community' },
  { id: '2', type: 'learning', Icon: IconTrophy, tint: 'bg-amber-500/15 text-amber-300', title: 'New badge unlocked!', body: 'You earned the 7-day streak badge.', when: '1h ago', unread: true, to: '/achievements' },
  { id: '3', type: 'social', Icon: IconUsers, tint: 'bg-sky-500/15 text-sky-300', who: 'James Lee', title: 'James Lee followed you', body: 'Senior teacher · IELTS prep', when: '2h ago', unread: true, to: '/profile' },
  { id: '4', type: 'learning', Icon: IconBolt, tint: 'bg-brand-500/15 text-brand-300', title: 'Daily goal hit', body: 'Great job — you completed 30 XP today.', when: '3h ago', unread: false, to: '/progress' },
  { id: '5', type: 'system', Icon: IconLive, tint: 'bg-red-500/15 text-red-300', who: 'Marco B.', title: 'Marco is live now', body: 'Coffee chat & free talk · 124 watching', when: '4h ago', unread: false, to: '/live' },
  { id: '6', type: 'social', Icon: IconChat, tint: 'bg-violet-500/15 text-violet-300', who: 'Priya S.', title: 'Priya replied to your comment', body: '"Yes I agree — try recording yourself…"', when: 'Yesterday', unread: false, to: '/community' },
  { id: '7', type: 'learning', Icon: IconStar, tint: 'bg-emerald-500/15 text-emerald-300', title: 'New lesson available', body: 'Murphy "Past Perfect" is ready to study.', when: 'Yesterday', unread: false, to: '/courses' },
  { id: '8', type: 'system', Icon: IconMedal, tint: 'bg-amber-400/20 text-amber-200', title: 'You climbed to Sapphire league!', body: 'Stay in the top 30% to keep your tier.', when: '2d ago', unread: false, to: '/leaderboard' },
  { id: '9', type: 'learning', Icon: IconFlame, tint: 'bg-orange-500/15 text-orange-300', title: 'Streak at risk', body: 'You haven\'t practiced today. Don\'t lose it!', when: '2d ago', unread: false, to: '/home' }
]

export default function NotificationsPage(): JSX.Element {
  const [filter, setFilter] = useState<Filter>('all')
  const navigate = useNavigate()
  const list = filter === 'all' ? NOTIFS : NOTIFS.filter((n) => n.type === filter)
  const unread = NOTIFS.filter((n) => n.unread).length

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-3xl mx-auto w-full flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-sm text-slate-400 mt-1">{unread} unread</p>
          </div>
          <button className="text-xs font-semibold text-brand-300 hover:text-brand-200">Mark all read</button>
        </div>

        <Tabs items={FILTERS} active={filter} onChange={setFilter} className="self-start" />

        <div className="rounded-card border border-white/10 bg-white/[0.025] divide-y divide-white/[0.06]">
          {list.map((n) => (
            <button
              key={n.id}
              onClick={() => n.to && navigate(n.to)}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-3 text-left transition relative',
                n.unread ? 'bg-brand-500/[0.04] hover:bg-brand-500/[0.08]' : 'hover:bg-white/[0.04]'
              )}
            >
              {n.unread && <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-400" />}
              {n.who ? (
                <AvatarCircle name={n.who} size="sm" />
              ) : (
                <span className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', n.tint)}>
                  <n.Icon className="w-4 h-4" />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{n.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">{n.when}</span>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center">You're all caught up.</p>
      </div>
    </div>
  )
}
