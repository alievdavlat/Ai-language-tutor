import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader, Tabs, type TabItem } from '../../components/ui'
import { IconLive, IconSearch, IconStar, IconUsers } from '../../components/icons'

type Tab = 'pro' | 'community'
const TABS: TabItem<Tab>[] = [
  { id: 'pro', label: 'Professional · $20-40/h' },
  { id: 'community', label: 'Community · $5-15/h' }
]

interface Tutor {
  name: string
  flag: string
  tagline: string
  rating: number
  reviews: number
  pricePerHour: number
  langsSpoken: string[]
  online: boolean
  trial: boolean
  videoBg: string
}

const TUTORS: Tutor[] = [
  { name: 'James Lee', flag: '🇬🇧', tagline: 'IELTS specialist · 8 yrs', rating: 4.9, reviews: 412, pricePerHour: 28, langsSpoken: ['English', 'French'], online: true, trial: true, videoBg: 'from-rose-500 to-pink-700' },
  { name: 'Emma Carter', flag: '🇺🇸', tagline: 'Conversational English, business', rating: 4.8, reviews: 286, pricePerHour: 32, langsSpoken: ['English', 'Spanish'], online: true, trial: true, videoBg: 'from-violet-500 to-purple-700' },
  { name: 'Marco Bianchi', flag: '🇮🇹', tagline: 'Pronunciation coach', rating: 4.7, reviews: 198, pricePerHour: 24, langsSpoken: ['English', 'Italian'], online: false, trial: true, videoBg: 'from-emerald-500 to-teal-700' },
  { name: 'Priya Sharma', flag: '🇮🇳', tagline: 'Beginners · patient & encouraging', rating: 4.9, reviews: 521, pricePerHour: 18, langsSpoken: ['English', 'Hindi'], online: true, trial: false, videoBg: 'from-amber-500 to-orange-700' }
]

const COMMUNITY: Tutor[] = [
  { name: 'Yui Tanaka', flag: '🇯🇵', tagline: 'Native speaker · casual chats', rating: 4.8, reviews: 64, pricePerHour: 10, langsSpoken: ['English', 'Japanese'], online: true, trial: true, videoBg: 'from-pink-500 to-rose-700' },
  { name: 'Liam O\'Connor', flag: '🇮🇪', tagline: 'Friendly student of linguistics', rating: 4.7, reviews: 41, pricePerHour: 8, langsSpoken: ['English'], online: false, trial: true, videoBg: 'from-sky-500 to-blue-700' },
  { name: 'Nadia Reyes', flag: '🇵🇭', tagline: 'Conversation practice · roleplay', rating: 4.9, reviews: 102, pricePerHour: 12, langsSpoken: ['English', 'Tagalog'], online: true, trial: true, videoBg: 'from-fuchsia-500 to-violet-700' },
  { name: 'Sasha Kovalenko', flag: '🇺🇦', tagline: 'Travel & survival English', rating: 4.6, reviews: 28, pricePerHour: 7, langsSpoken: ['English', 'Russian'], online: false, trial: true, videoBg: 'from-cyan-500 to-teal-700' }
]

function TutorCard({ t }: { t: Tutor }): JSX.Element {
  return (
    <article className="rounded-card border border-white/10 bg-white/[0.025] overflow-hidden hover:border-white/20 transition">
      <div className={cn('relative h-32 bg-gradient-to-br', t.videoBg)}>
        <button className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center hover:bg-white/40 transition">
          <span className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[10px] border-l-white ml-1" />
        </button>
        {t.online && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Online now
          </span>
        )}
        {t.trial && (
          <span className="absolute top-2 right-2 rounded-full bg-amber-400/90 backdrop-blur text-amber-950 text-[10px] font-bold px-2 py-0.5">Free trial</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AvatarCircle name={t.name} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {t.name} <span className="text-base">{t.flag}</span>
            </p>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{t.tagline}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="inline-flex items-center gap-1 text-xs text-amber-300">
            <IconStar className="w-3.5 h-3.5" /> <b className="text-white">{t.rating}</b>
            <span className="text-slate-500">({t.reviews})</span>
          </span>
          <span className="text-sm font-bold text-emerald-200">${t.pricePerHour}<span className="text-[10px] text-slate-400">/h</span></span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button className="btn-ghost text-xs py-2">Book</button>
          <button className={cn('text-xs py-2 rounded-xl font-semibold transition', t.online ? 'bg-grad-brand text-white hover:brightness-110' : 'bg-white/[0.04] text-slate-400 border border-white/10 cursor-not-allowed')} disabled={!t.online}>
            {t.online ? 'Talk now' : 'Offline'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function TutorsPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('pro')
  const list = tab === 'pro' ? TUTORS : COMMUNITY

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-6xl mx-auto w-full flex flex-col gap-5">
        <PageHeader
          title="Tutors"
          subtitle="Live 1:1 lessons with native and certified tutors."
          back="/meet"
          crumbs={[{ label: 'Speaking partner', to: '/meet' }, { label: 'Tutors' }]}
          action={
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-xs px-3 py-2">Calendar</button>
              <button className="btn-primary text-xs px-3 py-2">Instant call</button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" placeholder="Filter by name, language, focus" className="input pl-9 text-sm" />
          </div>
          <select className="input text-sm sm:w-44"><option>Any language</option><option>English</option><option>Spanish</option></select>
          <select className="input text-sm sm:w-40"><option>Any price</option><option>$5–15</option><option>$15–30</option><option>$30+</option></select>
          <select className="input text-sm sm:w-40"><option>Any time</option><option>Now</option><option>Today</option><option>This week</option></select>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {/* Featured / Instant talk now */}
        <div className="rounded-card p-5 bg-gradient-to-br from-brand-500/15 to-violet-500/15 border border-brand-400/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <IconLive className="w-6 h-6 text-brand-200" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Talk to someone right now</p>
            <p className="text-xs text-slate-300">22 tutors online · average wait under 1 min</p>
          </div>
          <button className="btn-primary text-xs px-4 py-2">Find a tutor</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((t) => <TutorCard key={t.name} t={t} />)}
        </div>

        {/* Become a tutor */}
        <div className="mt-4 rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
            <IconUsers className="w-7 h-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-bold text-white">Earn as a community tutor</p>
            <p className="text-xs text-slate-400">Set your own rates · keep 85% · cash out monthly.</p>
          </div>
          <button className="btn-ghost text-xs px-4 py-2 shrink-0">Apply to teach</button>
        </div>
      </div>
    </div>
  )
}
