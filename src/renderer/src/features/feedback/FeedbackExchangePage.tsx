import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader, SectionHeading, Tabs, type TabItem } from '../../components/ui'
import { IconBolt, IconHeart, IconMic, IconPencilEdit, IconStar, IconTrophy } from '../../components/icons'

type Tab = 'give' | 'received' | 'submit'
const TABS: TabItem<Tab>[] = [
  { id: 'give', label: 'Give feedback' },
  { id: 'received', label: 'Your submissions' },
  { id: 'submit', label: 'Submit new' }
]

interface Submission {
  who: string
  flag: string
  type: 'writing' | 'speaking'
  topic: string
  preview: string
  reward: number
  reviews?: number
  when: string
}

const OPEN_FOR_REVIEW: Submission[] = [
  { who: 'Wei Lin', flag: '🇨🇳', type: 'writing', topic: 'IELTS Task 2 — pros & cons of social media', preview: 'In the modern era, social media has become an essential part of our daily lives. While it offers many benefits…', reward: 15, when: '3h ago' },
  { who: 'Marco B.', flag: '🇮🇹', type: 'speaking', topic: 'Describe a city you visited', preview: '0:48 audio · waveform preview', reward: 20, when: '5h ago' },
  { who: 'Priya S.', flag: '🇮🇳', type: 'writing', topic: 'Email: requesting a refund', preview: 'Dear Sir/Madam, I am writing to express my disappointment regarding the recent product I purchased…', reward: 10, when: 'Yesterday' },
  { who: 'Sasha K.', flag: '🇺🇦', type: 'speaking', topic: 'Tell me about your hometown', preview: '1:12 audio', reward: 20, when: '2d ago' }
]

const RECEIVED: { topic: string; reviewer: string; rating: number; note: string; when: string }[] = [
  { topic: 'My essay on remote work', reviewer: 'Emma Carter', rating: 5, note: 'Great structure! Watch the article use in para 2.', when: '1h ago' },
  { topic: 'Speaking part 2 attempt', reviewer: 'James Lee', rating: 4, note: 'Strong vocabulary. Slow down on linking words.', when: 'Yesterday' }
]

export default function FeedbackExchangePage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('give')
  const navigate = useNavigate()

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Community"
          title="Feedback exchange"
          subtitle="Help others write & speak better — they help you back."
          back="/community"
          crumbs={[{ label: 'Community', to: '/community' }, { label: 'Feedback' }]}
          action={
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Your karma</p>
              <p className="text-2xl font-black text-amber-300 inline-flex items-center gap-1"><IconTrophy className="w-5 h-5" /> 248</p>
            </div>
          }
        />

        {/* Karma banner */}
        <div className="rounded-card p-5 bg-gradient-to-br from-amber-500/15 to-rose-500/15 border border-amber-400/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl">🧧</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">You can submit 2 free items today</p>
            <p className="text-xs text-amber-100/80">Each review you give earns 10-25 karma · spend karma to get reviewed faster.</p>
          </div>
          <button onClick={() => setTab('submit')} className="btn-primary text-xs px-4 py-2">Submit work</button>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'give' && (
          <div className="flex flex-col gap-3">
            {OPEN_FOR_REVIEW.map((s, i) => (
              <article key={i} className="rounded-card border border-white/10 bg-white/[0.025] p-4">
                <header className="flex items-center gap-3 mb-3">
                  <AvatarCircle name={s.who} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{s.who} <span className="text-base">{s.flag}</span></p>
                    <p className="text-[11px] text-slate-500">{s.when}</p>
                  </div>
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest', s.type === 'writing' ? 'bg-violet-500/15 text-violet-200' : 'bg-emerald-500/15 text-emerald-200')}>
                    {s.type === 'writing' ? <IconPencilEdit className="w-3 h-3" /> : <IconMic className="w-3 h-3" />}
                    {s.type}
                  </span>
                </header>
                <p className="text-sm font-semibold text-white">{s.topic}</p>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{s.preview}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-amber-200 font-bold">
                    <IconBolt className="w-3.5 h-3.5" /> Earn +{s.reward} karma
                  </span>
                  <button className="btn-primary text-xs px-4 py-1.5">Review</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === 'received' && (
          <div className="flex flex-col gap-3">
            {RECEIVED.map((r) => (
              <article key={r.topic} className="rounded-card border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-white">{r.topic}</p>
                  <span className="text-[11px] text-slate-500">{r.when}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <AvatarCircle name={r.reviewer} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300">
                      <b className="text-white">{r.reviewer}</b> <span className="inline-flex items-center gap-0.5 text-amber-300 ml-1">{Array.from({ length: r.rating }).map((_, j) => <IconStar key={j} className="w-3 h-3" />)}</span>
                    </p>
                    <p className="text-sm text-slate-200 mt-1">"{r.note}"</p>
                  </div>
                  <button title="Thank reviewer" className="inline-flex items-center gap-1 rounded-full bg-pink-500/15 text-pink-200 text-[11px] font-bold px-3 py-1 hover:bg-pink-500/25">
                    <IconHeart className="w-3.5 h-3.5" /> Thank
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === 'submit' && (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Type</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button className="rounded-xl border border-brand-400/40 bg-brand-500/10 px-4 py-3 text-left">
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-white"><IconPencilEdit className="w-4 h-4" /> Writing</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Essay, email, message</p>
                </button>
                <button className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.05]">
                  <p className="inline-flex items-center gap-2 text-sm font-bold text-white"><IconMic className="w-4 h-4" /> Speaking</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Audio up to 2 min</p>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Topic / context</label>
              <input className="input mt-1.5" placeholder="e.g. IELTS Task 2 — climate change" />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Your writing</label>
              <textarea className="input mt-1.5 min-h-[120px] resize-none" placeholder="Paste or type your work here…" />
              <p className="text-[10px] text-slate-500 mt-1">0/400 words</p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Cost: 5 karma · 2 free submissions left today</span>
              <button onClick={() => { setTab('received'); navigate('/feedback') }} className="btn-primary px-5 py-2 text-sm">Submit for review</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
