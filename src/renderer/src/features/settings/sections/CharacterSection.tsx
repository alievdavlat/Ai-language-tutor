import type { Accent } from '@shared/types'
import { listCharacters } from '@shared/constants'
import { ACCENT_LABELS } from '@shared/constants'
import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'

interface CharacterSectionProps {
  currentId: string
  currentAccent: Accent
  onPick: (characterId: string, accent: Accent) => void
}

export default function CharacterSection({
  currentId,
  currentAccent,
  onPick
}: CharacterSectionProps): JSX.Element {
  const characters = listCharacters()

  return (
    <Card>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-semibold text-base">Your companion</h2>
          <p className="text-xs text-slate-500">
            Picking a character also sets the default accent and speaking style.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {characters.map((c) => {
          const active = currentId === c.id
          const accentMatches = currentAccent === c.accent
          return (
            <button
              key={c.id}
              onClick={() => onPick(c.id, c.accent)}
              className={cn(
                'group relative text-left rounded-card p-4 transition overflow-hidden',
                active
                  ? 'bg-grad-brand ring-2 ring-brand-300/60 shadow-glow text-white'
                  : 'bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-slate-200'
              )}
            >
              {active && (
                <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-white/30 rounded-pill px-2 py-0.5">
                  Active
                </span>
              )}
              <div className="text-4xl mb-2">{c.emoji}</div>
              <div className="font-bold text-base truncate">{c.name}</div>
              <div
                className={cn(
                  'text-xs mb-2',
                  active ? 'text-white/80' : 'text-slate-400'
                )}
              >
                {ACCENT_LABELS[c.accent]} · {c.age}
              </div>
              <div
                className={cn(
                  'text-[11px] leading-snug mb-2 line-clamp-2',
                  active ? 'text-white/90' : 'text-slate-400'
                )}
              >
                {c.headline}
              </div>
              <div className="flex flex-wrap gap-1">
                {c.traits.map((t) => (
                  <span
                    key={t}
                    className={cn(
                      'text-[9px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5',
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-white/[0.06] text-slate-400 border border-white/10'
                    )}
                  >
                    {t}
                  </span>
                ))}
              </div>
              {active && !accentMatches && (
                <p className="text-[10px] mt-2 text-white/70">
                  (Accent currently overridden — change in Accent section)
                </p>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
