import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { UserProfile } from '@shared/types'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { logActivity } from '../../services/activity'
import { backend } from '../../services/backend/useBackend'
import { IconTarget } from '../../components/icons'
import { CEFR_ORDER, MIN_ITEMS, MAX_ITEMS, type LevelEstimate } from './engine'
import AdaptiveQuiz from './AdaptiveQuiz'
import { useT } from '../../i18n'

type Phase = 'intro' | 'quiz' | 'result'

export default function LevelTestPage(): JSX.Element {
  const t = useT()
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)

  const [phase, setPhase] = useState<Phase>('intro')
  const [estimate, setEstimate] = useState<LevelEstimate | null>(null)
  const [saved, setSaved] = useState(false)

  const finish = (result: LevelEstimate): void => {
    setEstimate(result)
    setPhase('result')
    // Gamification — finishing logs to the backend activity log AND the progress
    // store via the mirror (#A49), so Home + Progress both update.
    const userId = backend.currentUserId()
    if (userId) {
      void logActivity({
        userId,
        kind: 'exam_attempt',
        xp: 20,
        meta: { progressKind: 'level_test', level: result.level, score: result.correct }
      }).catch(() => {})
    }
  }

  const saveLevel = async (): Promise<void> => {
    if (!profile || !estimate) return
    const updated: UserProfile = {
      ...profile,
      level: estimate.level,
      weakAreas: estimate.weakAreas,
      updatedAt: new Date().toISOString()
    }
    await window.api.profile.save(updated)
    setProfile(updated)
    setSaved(true)
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-grad-brand flex items-center justify-center shadow-glow mb-6">
          <IconTarget className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t('spk.levelTestTitle')}</h1>
        <p className="text-slate-400 mt-3 leading-relaxed">
          {t('spk.levelTestIntro')}
        </p>
        <div className="flex items-center gap-6 mt-6 text-sm text-slate-400">
          <span><b className="text-white">{MIN_ITEMS}–{MAX_ITEMS}</b> {t('spk.questions')}</span>
          <span><b className="text-white">~5</b> {t('spk.min')}</span>
          <span><b className="text-white">A1–C2</b> {t('spk.result')}</span>
        </div>
        <button onClick={() => setPhase('quiz')} className="btn-primary px-10 py-3 mt-8">
          {t('spk.startTest')}
        </button>
        <button onClick={() => navigate(-1)} className="text-xs text-slate-500 hover:text-slate-300 mt-4">
          {t('spk.maybeLater')}
        </button>
      </div>
    )
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (phase === 'result' && estimate) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-6 py-10 max-w-lg mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-brand-300 font-semibold">{t('spk.yourLevel')}</p>
          <div className="text-6xl font-bold tracking-tight mt-2 bg-grad-brand bg-clip-text text-transparent">
            {estimate.level}
          </div>
          <p className="text-lg font-semibold text-white mt-1">{estimate.label}</p>
          <p className="text-slate-400 mt-3 max-w-sm">{estimate.blurb}</p>

          {/* CEFR ladder */}
          <div className="flex items-center gap-1.5 mt-7 w-full">
            {CEFR_ORDER.map((lv) => {
              const active = lv === estimate.level
              const passed = CEFR_ORDER.indexOf(lv) < CEFR_ORDER.indexOf(estimate.level)
              return (
                <div key={lv} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'w-full h-2 rounded-full',
                      active ? 'bg-grad-brand' : passed ? 'bg-brand-500/40' : 'bg-white/[0.06]'
                    )}
                  />
                  <span className={cn('text-[10px] font-semibold', active ? 'text-brand-300' : 'text-slate-500')}>
                    {lv}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Score + IELTS */}
          <div className="flex items-center gap-3 mt-7 w-full">
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3">
              <p className="text-2xl font-bold text-white">{estimate.correct}/{estimate.total}</p>
              <p className="text-xs text-slate-400">{t('spk.correct')}</p>
            </div>
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] py-3">
              <p className="text-2xl font-bold text-brand-300">{estimate.ielts}</p>
              <p className="text-xs text-slate-400">{t('spk.ieltsEstimate')}</p>
            </div>
          </div>

          {estimate.weakAreas.length > 0 && (
            <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left">
              <p className="text-xs font-semibold text-slate-400 mb-2">{t('spk.areasToFocus')}</p>
              <div className="flex flex-wrap gap-1.5">
                {estimate.weakAreas.map((a) => (
                  <span key={a} className="text-xs rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-slate-200">
                    {a.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => void saveLevel()}
            disabled={saved}
            className="btn-primary w-full py-3 mt-7 disabled:opacity-60"
          >
            {saved ? t('spk.savedAsLevel') : t('spk.useAsLevel')}
          </button>
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => { setEstimate(null); setSaved(false); setPhase('intro') }}
              className="text-sm text-slate-400 hover:text-white"
            >
              {t('spk.retake')}
            </button>
            <button onClick={() => navigate('/home')} className="text-sm text-slate-400 hover:text-white">
              {t('spk.done')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Quiz (adaptive) ──────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-6 py-6">
      <AdaptiveQuiz onComplete={finish} onExit={() => navigate(-1)} />
    </div>
  )
}
