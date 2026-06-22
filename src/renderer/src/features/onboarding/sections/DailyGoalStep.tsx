import { Button, Card } from '../../../components/ui'
import { DAILY_GOALS } from '../../../services/progress/catalog'
import type { DailyGoalId } from '../../../services/progress/types'
import { cn } from '../../../lib/classnames'
import { useT } from '../../../i18n'
import type { StringKey } from '../../../i18n/strings'

interface DailyGoalStepProps {
  value: DailyGoalId
  onChange: (id: DailyGoalId) => void
  onNext: () => void
  onBack: () => void
}

export default function DailyGoalStep({
  value,
  onChange,
  onNext,
  onBack
}: DailyGoalStepProps): JSX.Element {
  const t = useT()
  return (
    <Card>
      <h2 className="text-2xl font-bold mb-2">{t('ob.daily.title')}</h2>
      <p className="text-slate-400 mb-6 text-sm">
        {t('ob.daily.subtitle')}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {DAILY_GOALS.map((goal) => {
          const active = value === goal.id
          return (
            <button
              key={goal.id}
              onClick={() => onChange(goal.id)}
              className={cn(
                'text-left rounded-xl border p-4 transition',
                active
                  ? 'border-brand-400 bg-brand-500/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              )}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="font-semibold text-lg">{t(`ob.dg.${goal.id}.l` as StringKey)}</span>
                <span className="text-xs text-brand-300">{goal.xp} XP</span>
              </div>
              <p className="text-xs text-slate-400">{t(`ob.dg.${goal.id}.b` as StringKey)}</p>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← {t('common.back')}
        </Button>
        <Button onClick={onNext}>{t('common.continue')} →</Button>
      </div>
    </Card>
  )
}
