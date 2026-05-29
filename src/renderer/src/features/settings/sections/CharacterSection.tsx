import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Accent, CharacterInfo, UserProfile } from '@shared/types'
import {
  ACCENT_LABELS,
  listAllCharacters,
  relationshipScore,
  relationshipTier
} from '@shared/constants'
import { characterAvatarUrl } from '@shared/utils/avatar'
import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'

interface CharacterSectionProps {
  profile: UserProfile
  onPick: (characterId: string, accent: Accent) => void
  onCustomsChange: (next: CharacterInfo[]) => void
  /** Phase 8 (2.15) — persist the starred-character list. */
  onFavoritesChange: (next: string[]) => void
}

export default function CharacterSection({
  profile,
  onPick,
  onFavoritesChange
}: CharacterSectionProps): JSX.Element {
  const navigate = useNavigate()
  const favorites = useMemo(() => profile.favoriteCharacterIds ?? [], [profile.favoriteCharacterIds])
  const characters = useMemo(() => {
    const all = listAllCharacters(profile)
    // Favorites float to the front; everything else keeps its natural order.
    return [...all].sort(
      (a, b) => (favorites.includes(b.id) ? 1 : 0) - (favorites.includes(a.id) ? 1 : 0)
    )
  }, [profile, favorites])

  const toggleFavorite = (id: string): void => {
    onFavoritesChange(
      favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id]
    )
  }

  const currentId = profile.settings.characterId

  // Create + edit both happen in the Avatar Studio builder now (type picker,
  // file/link upload, full parameters) — no inline modal.
  const startEdit = (character: CharacterInfo): void => navigate(`/avatar-studio?id=${encodeURIComponent(character.id)}`)
  const startNew = (): void => navigate('/avatar-studio')

  return (
    <>
      <Card>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="font-semibold text-base">Your companion</h2>
            <p className="text-xs text-slate-500">
              Picking a character also sets the accent and avatar. Tap ✏️ Edit to open the
              Avatar Studio, or “Create companion” to build a new one.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {characters.map((c) => {
            const active = currentId === c.id
            const isCustom = !!c.isCustom
            const isFav = favorites.includes(c.id)
            const relScore = relationshipScore(profile.relationships, c.id)
            const rel = relScore > 0 ? relationshipTier(relScore) : null
            return (
              <div
                key={c.id}
                className={cn(
                  'group relative rounded-card overflow-hidden transition flex flex-col',
                  active ? 'ring-2 ring-brand-300/60 shadow-glow' : 'border border-white/10 hover:border-white/25'
                )}
              >
                <button onClick={() => onPick(c.id, c.accent)} className="block text-left">
                  {/* Full portrait */}
                  <div
                    className="relative w-full aspect-square"
                    style={{
                      background: c.cardTint
                        ? `radial-gradient(circle at 50% 38%, #${c.cardTint} 0%, rgba(15,23,42,0.7) 92%)`
                        : 'rgba(255,255,255,0.05)'
                    }}
                  >
                    {c.avatarSeed ? (
                      <img
                        src={characterAvatarUrl(c, 320)}
                        alt={c.name}
                        className="w-full h-full object-contain p-3"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-7xl">{c.emoji}</div>
                    )}
                    {active && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-brand-500 text-white rounded-pill px-2 py-0.5">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className={cn('p-3', active ? 'bg-grad-brand text-white' : 'bg-white/[0.03] text-slate-200')}>
                    <div className="font-bold text-base truncate flex items-center gap-1.5">
                      {c.name}
                      {isCustom && (
                        <span
                          title="Custom character"
                          className={cn(
                            'text-[9px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5',
                            active ? 'bg-white/25 text-white' : 'bg-emerald-500/20 text-emerald-200'
                          )}
                        >
                          custom
                        </span>
                      )}
                    </div>
                    <div className={cn('text-xs mt-0.5 flex items-center gap-1.5 flex-wrap', active ? 'text-white/80' : 'text-slate-400')}>
                      <span>{ACCENT_LABELS[c.accent]} · {c.age}</span>
                      {rel && (
                        <span
                          title={`Relationship: ${rel.label} (${relScore}/100)`}
                          className={cn(
                            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                            active ? 'bg-white/20 text-white' : 'bg-brand-500/15 text-brand-100 border border-brand-400/20'
                          )}
                        >
                          {rel.emoji} {rel.label}
                        </span>
                      )}
                    </div>
                    <div className={cn('text-[11px] leading-snug mt-1.5 line-clamp-2', active ? 'text-white/90' : 'text-slate-400')}>
                      {c.headline || <span className="italic text-slate-500">No headline yet.</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(c.traits ?? []).map((t) => (
                        <span
                          key={t}
                          className={cn(
                            'text-[9px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5',
                            active ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-slate-400 border border-white/10'
                          )}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>

                {/* Favorite star (2.15) */}
                <button
                  type="button"
                  aria-pressed={isFav}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(c.id)
                  }}
                  className={cn(
                    'absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-base transition',
                    isFav ? 'bg-amber-400/90 text-amber-950 shadow' : 'bg-black/40 backdrop-blur text-white/80 hover:bg-black/60'
                  )}
                >
                  {isFav ? '★' : '☆'}
                </button>

                {/* Edit → Avatar Studio */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    startEdit(c)
                  }}
                  className="absolute bottom-2 right-2 z-10 text-[10px] font-semibold rounded-pill px-2 py-1 bg-black/40 backdrop-blur text-white/90 hover:bg-black/60 transition"
                >
                  ✏️ Edit
                </button>
              </div>
            )
          })}

          {/* Create — opens the Avatar Studio builder */}
          <button
            type="button"
            onClick={startNew}
            className="flex flex-col items-center justify-center text-center rounded-card p-4 min-h-[180px] bg-white/[0.02] border border-dashed border-white/15 hover:bg-white/[0.06] hover:border-brand-400/50 text-slate-400 hover:text-slate-200 transition"
          >
            <div className="text-4xl mb-2">➕</div>
            <div className="font-semibold text-sm">Create companion</div>
            <div className="text-[11px] text-slate-500 mt-1 px-2">
              Avatar Studio — pick 2D / 3D / VRM, upload a model, set the personality.
            </div>
          </button>
        </div>
      </Card>
    </>
  )
}
