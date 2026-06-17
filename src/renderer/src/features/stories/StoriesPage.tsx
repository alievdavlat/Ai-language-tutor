import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader, SectionHeading, Tabs, type TabItem } from '../../components/ui'
import { IconBolt, IconPlus } from '../../components/icons'
import { type Story } from '../../services/content/stories'
import { useStories } from '../../services/stories/store'
import { useLevels } from '../../services/levels/store'
import { useAppStore } from '../../store/useAppStore'
import { canAuthorContent } from '@shared/constants'
import StoryEditor from './StoryEditor'
import { useContentState, getStoryProgress } from '../../services/content/progress'
import { useT } from '../../i18n'

type Tab = 'mixed' | 'reading' | 'listening'

function StoryCard({ s, onOpen }: { s: Story; onOpen: () => void }): JSX.Element {
  const t = useT()
  const prog = getStoryProgress(s.id)
  const isDone = prog?.completed
  return (
    <button onClick={onOpen} className="group text-left rounded-card border border-white/10 bg-white/[0.025] overflow-hidden hover:border-white/20 transition">
      <div className={cn('relative h-36 bg-gradient-to-br flex items-center justify-center text-6xl', s.cover)}>
        <span className="absolute top-3 left-3 rounded-full bg-black/30 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">{s.level}</span>
        {isDone && <span className="absolute top-3 right-3 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5">{t('stories.done')}</span>}
        {s.emoji}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-white">{s.title}</h3>
        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{s.blurb}</p>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
          <span>{t('stories.parts', { n: s.parts.length })}</span>
          <span className="capitalize">· {s.kind}</span>
          <span className="inline-flex items-center gap-1 ml-auto text-amber-200"><IconBolt className="w-3 h-3" /> +{s.xp}</span>
        </div>
        {prog && !isDone && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-brand-500" style={{ width: `${((prog.part + 1) / s.parts.length) * 100}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{t('stories.partOf', { n: prog.part + 1, total: s.parts.length })}</p>
          </div>
        )}
      </div>
    </button>
  )
}

export default function StoriesPage(): JSX.Element {
  const navigate = useNavigate()
  const t = useT()
  const TABS: TabItem<Tab>[] = [
    { id: 'mixed', label: t('common.all') },
    { id: 'reading', label: t('stories.tab.reading') },
    { id: 'listening', label: t('stories.tab.listening') }
  ]
  const [tab, setTab] = useState<Tab>('mixed')
  const [level, setLevel] = useState('All')
  const { list: levelDefs } = useLevels()
  const levelFilters = ['All', ...levelDefs.map((l) => l.code)]
  const role = useAppStore((s) => s.role)
  const canAuthor = canAuthorContent(role)
  const [editing, setEditing] = useState(false)
  const { list: allStories, refresh } = useStories()
  useContentState()

  const resume = allStories.map((s) => ({ s, p: getStoryProgress(s.id) }))
    .filter((x) => x.p && !x.p.completed)
    .sort((a, b) => (b.p!.lastAt).localeCompare(a.p!.lastAt))[0]

  const filtered = allStories.filter((s) => {
    if (level !== 'All' && s.level !== level) return false
    if (tab === 'mixed') return true
    return s.kind === tab || s.kind === 'mixed'
  })

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow={t('stories.eyebrow')}
          title={t('stories.title')}
          subtitle={t('stories.subtitle')}
          back="/library"
          crumbs={[{ label: t('nav.library'), to: '/library' }, { label: t('stories.title') }]}
          action={canAuthor ? <button onClick={() => setEditing(true)} className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-1.5"><IconPlus className="w-4 h-4" /> {t('stories.createStory')}</button> : undefined}
        />

        {resume && (
          <div className="rounded-card p-5 bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-400/20 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl">{resume.s.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-widest text-brand-200/80 font-bold">{t('common.continue')}</p>
              <p className="text-sm font-bold text-white">{resume.s.title} · {t('stories.partOf', { n: resume.p!.part + 1, total: resume.s.parts.length })}</p>
            </div>
            <button onClick={() => navigate(`/stories/${resume.s.id}`)} className="btn-primary text-xs px-4 py-2">{t('stories.resume')}</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {levelFilters.map((l) => (
              <button key={l} onClick={() => setLevel(l)} className={cn('rounded-full text-[11px] font-bold px-3 py-1 transition border', level === l ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <SectionHeading title={tab === 'reading' ? t('stories.readingStories') : tab === 'listening' ? t('stories.listeningStories') : t('stories.allStories')} subtitle={t('stories.countOf', { n: filtered.length, total: allStories.length })} />
        {filtered.length === 0 ? (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-8 text-center">
            <p className="text-sm text-slate-400">{t('stories.noMatch')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => <StoryCard key={s.id} s={s} onOpen={() => navigate(`/stories/${s.id}`)} />)}
          </div>
        )}
      </div>

      {editing && (
        <StoryEditor onClose={() => setEditing(false)} onSaved={() => { setEditing(false); refresh() }} />
      )}
    </div>
  )
}
