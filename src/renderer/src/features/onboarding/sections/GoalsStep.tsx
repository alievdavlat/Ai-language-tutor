import type { LearningGoal } from '@shared/types'
import { Button, Card } from '../../../components/ui'
import { GOAL_OPTIONS } from '../constants/goals'
import { cn } from '../../../lib/classnames'
import { useT } from '../../../i18n'
import type { StringKey } from '../../../i18n/strings'

interface GoalsStepProps {
  goals: LearningGoal[]
  onChange: (goals: LearningGoal[]) => void
  onNext: () => void
  onBack: () => void
}

export default function GoalsStep({
  goals,
  onChange,
  onNext,
  onBack
}: GoalsStepProps): JSX.Element {
  const t = useT()
  const toggle = (goal: LearningGoal): void => {
    onChange(goals.includes(goal) ? goals.filter((g) => g !== goal) : [...goals, goal])
  }

  return (
    <Card>
      <h2 className="text-2xl font-bold mb-2">{t('ob.goals.title')}</h2>
      <p className="text-slate-400 mb-6 text-sm">
        {t('ob.goals.subtitle')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {GOAL_OPTIONS.map((option) => {
          const active = goals.includes(option.id)
          return (
            <button
              key={option.id}
              onClick={() => toggle(option.id)}
              className={cn(
                'text-left rounded-xl border p-4 transition',
                active
                  ? 'border-brand-400 bg-brand-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              )}
            >
              <div className="text-lg mb-1">
                {option.emoji} <span className="font-semibold">{t(`ob.goal.${option.id}.t` as StringKey)}</span>
              </div>
              <p className="text-xs text-slate-400">{t(`ob.goal.${option.id}.d` as StringKey)}</p>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← {t('common.back')}
        </Button>
        <Button onClick={onNext} disabled={goals.length === 0}>
          {t('common.continue')} →
        </Button>
      </div>
    </Card>
  )
}
