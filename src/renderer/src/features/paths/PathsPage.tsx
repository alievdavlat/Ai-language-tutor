import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { ProgressBar, SectionHeading } from '../../components/ui'
import { IconBook, IconClipboard, IconStar, IconTrophy, IconUsers } from '../../components/icons'

interface Path {
  id: string
  title: string
  subtitle: string
  courses: number
  hours: number
  level: string
  enrolled: number
  rating: number
  progress?: number
  cover: string
  capstone: string
}

const PATHS: Path[] = [
  {
    id: 'ielts-7',
    title: 'IELTS 7.0 Track',
    subtitle: '4-course specialization · designed by James Lee',
    courses: 4,
    hours: 28,
    level: 'B1 → C1',
    enrolled: 8420,
    rating: 4.8,
    progress: 32,
    cover: 'from-rose-500 to-pink-700',
    capstone: 'Full IELTS mock exam + Band-7 portfolio review'
  },
  {
    id: 'business',
    title: 'Business English Career',
    subtitle: 'Negotiations, meetings, emails',
    courses: 5,
    hours: 36,
    level: 'B1 → C1',
    enrolled: 5210,
    rating: 4.7,
    cover: 'from-sky-500 to-blue-700',
    capstone: 'Stakeholder presentation + business email portfolio'
  },
  {
    id: 'travel',
    title: 'Travel & Survival English',
    subtitle: 'Restaurant, taxi, hotel, emergencies',
    courses: 3,
    hours: 14,
    level: 'A1 → A2',
    enrolled: 12_400,
    rating: 4.9,
    cover: 'from-emerald-500 to-teal-700',
    capstone: 'Real-life roleplay marathon'
  },
  {
    id: 'foundations',
    title: 'English Foundations',
    subtitle: 'Build your A1→B1 base in 90 days',
    courses: 6,
    hours: 48,
    level: 'A1 → B1',
    enrolled: 21_800,
    rating: 4.8,
    cover: 'from-amber-500 to-orange-700',
    capstone: 'CEFR placement test + skill diploma'
  }
]

function PathCard({ p }: { p: Path }): JSX.Element {
  const navigate = useNavigate()
  return (
    <article className="rounded-card border border-white/10 bg-white/[0.025] overflow-hidden hover:border-white/20 transition group">
      <div className={cn('relative h-32 bg-gradient-to-br', p.cover)}>
        <div className="absolute inset-0 bg-black/20" />
        <span className="absolute top-3 left-3 rounded-full bg-white/15 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">Specialization</span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-white">
          <IconBook className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{p.courses} courses · {p.hours}h</span>
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/30 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5">{p.level}</span>
      </div>
      <div className="p-5">
        <h3 className="text-base font-bold text-white">{p.title}</h3>
        <p className="text-xs text-slate-400 mt-1">{p.subtitle}</p>

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1 text-amber-300"><IconStar className="w-3.5 h-3.5" /> <b className="text-white">{p.rating}</b></span>
          <span className="inline-flex items-center gap-1"><IconUsers className="w-3.5 h-3.5" /> {p.enrolled.toLocaleString()}</span>
        </div>

        {p.progress != null && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Your progress</span>
              <span className="text-[11px] font-bold text-brand-200">{p.progress}%</span>
            </div>
            <ProgressBar value={p.progress} color="brand" />
          </div>
        )}

        <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3 flex items-start gap-2.5">
          <IconTrophy className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold">Capstone</p>
            <p className="text-xs text-slate-200 mt-0.5 leading-snug">{p.capstone}</p>
          </div>
        </div>

        <button onClick={() => navigate(`/courses`)} className="btn-primary w-full mt-4 text-sm py-2">
          {p.progress != null ? 'Continue path' : 'Enroll in path'}
        </button>
      </div>
    </article>
  )
}

export default function PathsPage(): JSX.Element {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 max-w-6xl mx-auto w-full flex flex-col gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">Career tracks</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Learning paths</h1>
          <p className="text-sm text-slate-400 mt-1">Multi-course specializations that end with a capstone project and a certificate.</p>
        </div>

        {/* Banner */}
        <div className="rounded-card p-5 bg-gradient-to-br from-brand-500/15 to-violet-500/15 border border-brand-400/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center"><IconClipboard className="w-7 h-7 text-brand-200" /></div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Not sure where to start?</p>
            <p className="text-xs text-slate-300">Take a 5-min quiz and we'll recommend the right path.</p>
          </div>
          <button className="btn-primary text-xs px-4 py-2">Take quiz</button>
        </div>

        <SectionHeading title="Featured tracks" subtitle={`${PATHS.length} specializations · curated by us`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PATHS.map((p) => <PathCard key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  )
}
