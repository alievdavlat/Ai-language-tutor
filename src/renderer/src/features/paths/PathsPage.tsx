import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading } from '../../components/ui'
import { IconBook, IconClipboard, IconStar, IconTrophy, IconUsers } from '../../components/icons'
import { usePaths, type LearningPath } from '../../services/paths/store'

function PathCard({ p }: { p: LearningPath }): JSX.Element {
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
          {p.rating > 0 && <span className="inline-flex items-center gap-1 text-amber-300"><IconStar className="w-3.5 h-3.5" /> <b className="text-white">{p.rating.toFixed(1)}</b></span>}
          <span className="inline-flex items-center gap-1"><IconUsers className="w-3.5 h-3.5" /> {p.enrolled > 0 ? p.enrolled.toLocaleString() : 'Be the first'}</span>
        </div>

        <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/10 p-3 flex items-start gap-2.5">
          <IconTrophy className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold">Capstone</p>
            <p className="text-xs text-slate-200 mt-0.5 leading-snug">{p.capstone}</p>
          </div>
        </div>

        <button onClick={() => navigate('/courses')} className="btn-primary w-full mt-4 text-sm py-2">
          Explore path courses
        </button>
      </div>
    </article>
  )
}

export default function PathsPage(): JSX.Element {
  const navigate = useNavigate()
  const { list } = usePaths()
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Career tracks"
          title="Learning paths"
          subtitle="Multi-course specializations that end with a capstone project and a certificate."
          back="/courses"
          crumbs={[{ label: 'Courses', to: '/courses' }, { label: 'Paths' }]}
        />

        {/* Banner */}
        <div className="rounded-card p-5 bg-gradient-to-br from-brand-500/15 to-violet-500/15 border border-brand-400/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center"><IconClipboard className="w-7 h-7 text-brand-200" /></div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Not sure where to start?</p>
            <p className="text-xs text-slate-300">Take a quick placement test and we'll recommend the right path.</p>
          </div>
          <button onClick={() => navigate('/level-test')} className="btn-primary text-xs px-4 py-2">Take quiz</button>
        </div>

        <SectionHeading title="Featured tracks" subtitle={`${list.length} specializations · curated by us`} />
        {list.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-12">No learning paths yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {list.map((p) => <PathCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
