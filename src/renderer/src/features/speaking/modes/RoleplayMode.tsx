import { useState } from 'react'
import { IconBubble, type IconBubbleTone, Tabs, type TabItem } from '../../../components/ui'
import {
  IconArrowRight,
  IconChat,
  IconHeadphones,
  IconMasks,
  IconPhone,
  IconStar,
  type IconProps
} from '../../../components/icons'
import { cn } from '../../../lib/classnames'

type Category = 'all' | 'travel' | 'work' | 'daily' | 'social'

const FILTERS: TabItem<Category>[] = [
  { id: 'all', label: 'All' },
  { id: 'travel', label: 'Travel' },
  { id: 'work', label: 'Work' },
  { id: 'daily', label: 'Daily life' },
  { id: 'social', label: 'Social' }
]

interface Scenario {
  id: string
  title: string
  blurb: string
  level: string
  goals: number
  category: Exclude<Category, 'all'>
  tone: IconBubbleTone
  Icon: (p: IconProps) => JSX.Element
  prompt: string
}

const SCENARIOS: Scenario[] = [
  { id: 'restaurant', title: 'Ordering at a restaurant', blurb: 'Ask about the menu, order, and handle the bill.', level: 'A2', goals: 4, category: 'daily', tone: 'brand', Icon: IconChat, prompt: "Let's role-play ordering at a restaurant. You are the waiter; greet me and take my order." },
  { id: 'interview', title: 'Job interview', blurb: 'Answer common questions and talk about your strengths.', level: 'B1', goals: 6, category: 'work', tone: 'read', Icon: IconMasks, prompt: "Let's role-play a job interview. You are the interviewer; start by asking me to introduce myself." },
  { id: 'airport', title: 'At the airport', blurb: 'Check in, pass security, and find your gate.', level: 'A2', goals: 5, category: 'travel', tone: 'listen', Icon: IconPhone, prompt: "Let's role-play checking in at an airport. You are the check-in agent." },
  { id: 'doctor', title: "Doctor's visit", blurb: 'Describe symptoms and understand advice.', level: 'B1', goals: 5, category: 'daily', tone: 'grammar', Icon: IconHeadphones, prompt: "Let's role-play a doctor's visit. You are the doctor; ask me what's wrong." },
  { id: 'hotel', title: 'Hotel check-in', blurb: 'Reserve a room, ask about amenities, request help.', level: 'A2', goals: 4, category: 'travel', tone: 'vocab', Icon: IconStar, prompt: "Let's role-play a hotel check-in. You are the receptionist." },
  { id: 'friends', title: 'Making new friends', blurb: 'Introduce yourself and keep small talk going.', level: 'B1', goals: 5, category: 'social', tone: 'read', Icon: IconChat, prompt: "Let's role-play meeting someone new at a party. Start the small talk." },
  { id: 'meeting', title: 'Business meeting', blurb: 'Share an opinion, agree, disagree, and wrap up.', level: 'B2', goals: 7, category: 'work', tone: 'brand', Icon: IconMasks, prompt: "Let's role-play a business meeting. You chair it and ask for my opinion." },
  { id: 'shopping', title: 'Shopping for clothes', blurb: 'Ask for sizes, prices, and make a return.', level: 'A2', goals: 4, category: 'daily', tone: 'listen', Icon: IconStar, prompt: "Let's role-play shopping for clothes. You are the shop assistant." }
]

const LEVEL_TONE: Record<string, string> = {
  A2: 'bg-emerald-500/15 text-emerald-300',
  B1: 'bg-amber-500/15 text-amber-300',
  B2: 'bg-rose-500/15 text-rose-300'
}

interface RoleplayModeProps {
  onPick: (prompt: string) => void
}

export default function RoleplayMode({ onPick }: RoleplayModeProps): JSX.Element {
  const [filter, setFilter] = useState<Category>('all')
  const visible = filter === 'all' ? SCENARIOS : SCENARIOS.filter((s) => s.category === filter)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        <p className="text-sm text-slate-400">
          Pick a situation — the AI plays the other person and you complete the goals.
        </p>

        <Tabs items={FILTERS} active={filter} onChange={setFilter} className="self-start" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((s) => (
            <div
              key={s.id}
              onClick={() => onPick(s.prompt)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onPick(s.prompt) }}
              className="group rounded-card border border-white/[0.08] bg-white/[0.03] p-5 flex flex-col gap-3 cursor-pointer transition hover:bg-white/[0.06] hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <IconBubble tone={s.tone} size="lg">
                  <s.Icon className="w-6 h-6" />
                </IconBubble>
                <span className={cn('text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-1', LEVEL_TONE[s.level] ?? 'bg-white/10 text-slate-300')}>
                  {s.level}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">{s.title}</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">{s.blurb}</p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">{s.goals} goals</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-300 group-hover:gap-2 transition-all">
                  Start roleplay <IconArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
