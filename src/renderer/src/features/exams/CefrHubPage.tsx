import { useNavigate } from 'react-router-dom'
import type { CEFRLevel } from '@shared/types'
import { CEFR_ORDER } from '@shared/types'
import { useT } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { cn } from '../../lib/classnames'
import { PageHeader, ProgressRing } from '../../components/ui'
import { backend } from '../../services/backend'
import { useBackendQuery } from '../../services/backend/useBackend'
import { useAppStore } from '../../store/useAppStore'
import {
  IconArrowRight,
  IconBook,
  IconHeadphones,
  IconMic,
  IconPencilEdit,
  type IconProps
} from '../../components/icons'

const LEVELS = [
  { code: 'A1', name: 'Beginner', cover: 'from-sky-500 to-blue-700' },
  { code: 'A2', name: 'Elementary', cover: 'from-emerald-500 to-teal-700' },
  { code: 'B1', name: 'Intermediate', cover: 'from-blue-500 to-indigo-700' },
  { code: 'B2', name: 'Upper-Int.', cover: 'from-violet-500 to-purple-700' },
  { code: 'C1', name: 'Advanced', cover: 'from-rose-500 to-pink-700' },
  { code: 'C2', name: 'Proficiency', cover: 'from-amber-500 to-orange-700' }
]

// Each skill routes to the feature that genuinely practises it. Writing maps to
// the grammar exercise player (the only place with gradable written drills);
// the other three go to their dedicated modules.
const SKILLS: {
  key: 'reading' | 'listening' | 'writing' | 'speaking'
  name: string
  meta: string
  Icon: (p: IconProps) => JSX.Element
}[] = [
  { key: 'reading', name: 'Reading', meta: 'Graded stories', Icon: IconBook },
  { key: 'listening', name: 'Listening', meta: 'Shadowing & audio', Icon: IconHeadphones },
  { key: 'writing', name: 'Writing', meta: 'Targeted grammar drills', Icon: IconPencilEdit },
  { key: 'speaking', name: 'Speaking', meta: 'AI examiner', Icon: IconMic }
]

export default function CefrHubPage(): JSX.Element {
  const navigate = useNavigate()
  const t = useT()
  const profile = useAppStore((s) => s.profile)

  // Most recent CEFR exam attempt wins; otherwise fall back to the saved
  // profile level (set by the level test) and finally A1 for a brand-new user.
  const { data: cefrAttempts } = useBackendQuery(
    () => backend.listExamAttempts(backend.currentUserId() ?? 'u_local', 'cefr'),
    [],
    []
  )
  const latestCefr = [...cefrAttempts]
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
    .find((a) => a.cefr)
  const current: CEFRLevel = latestCefr?.cefr ?? profile?.level ?? 'A1'
  const currentMeta = LEVELS.find((l) => l.code === current)
  // Ring fills as the learner climbs the A1→C2 ladder (B1 ≈ 50%, C2 = 100%).
  const ringValue = Math.round(((CEFR_ORDER.indexOf(current) + 1) / CEFR_ORDER.length) * 100)

  const onSkill = (key: 'reading' | 'listening' | 'writing' | 'speaking'): void => {
    if (key === 'writing') navigate(`/learn/exercise?skill=writing&level=${current}`)
    else if (key === 'reading') navigate('/stories')
    else if (key === 'listening') navigate('/shadowing')
    else navigate('/speaking')
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Exams · CEFR"
          title={t('exm.cefrTitle')}
          subtitle={t('exm.cefrSubtitle')}
          back="/exams"
          crumbs={[{ label: t('exm.crumbExams'), to: '/exams' }, { label: 'CEFR' }]}
        />

        {/* Hero — current level + take test */}
        <div className="rounded-card border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row items-center gap-6">
          <ProgressRing value={ringValue} size={120} stroke={11} tone="brand">
            <span className="text-2xl font-bold text-white">{current}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{t('exm.yourLevel')}</span>
          </ProgressRing>
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold">{currentMeta ? t(`exm.lvl.${currentMeta.code}` as StringKey) : t('exm.notTested')}</p>
            <h2 className="text-xl font-bold text-white mt-1">
              {latestCefr ? t('exm.retakeCefr') : t('exm.takeCefr')}
            </h2>
            <p className="text-sm text-slate-400 mt-1.5">
              {t('exm.cefrHeroDesc')}
            </p>
            <button onClick={() => navigate('/level-test')} className="btn-primary mt-3 px-6">{t('exm.startTest')}</button>
          </div>
        </div>

        {/* Practice by level */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">{t('exm.practiceByLevel')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LEVELS.map((l) => (
              <button key={l.code} onClick={() => navigate(`/learn/exercise?level=${l.code}`)} className={cn('rounded-2xl p-1 transition', l.code === current ? 'ring-2 ring-brand-400' : 'ring-1 ring-white/10 hover:ring-white/25')}>
                <div className={cn('rounded-xl bg-gradient-to-br h-20 flex items-center justify-center', l.cover)}>
                  <span className="text-2xl font-bold text-white">{l.code}</span>
                </div>
                <p className="text-sm font-semibold text-white mt-2">{t(`exm.lvl.${l.code}` as StringKey)}</p>
                <p className="text-[11px] text-slate-500 mb-1">{l.code === current ? t('exm.youAreHere') : t('exm.practiceSet')}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Practice by skill */}
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-3">{t('exm.practiceBySkill')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SKILLS.map((s) => (
              <button key={s.key} onClick={() => onSkill(s.key)} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06] transition">
                <span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><s.Icon className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{t(`exm.skill.${s.key}` as StringKey)}</p>
                  <p className="text-xs text-slate-500">{t(`exm.skillMeta.${s.key}` as StringKey)}</p>
                </div>
                <IconArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
