import { useEffect, useMemo, useRef, useState } from 'react'
import type { Accent, UserProfile } from '@shared/types'
import {
  ACCENT_LABELS,
  companionCategory,
  dailyMood,
  listAllCharacters,
  resolveCharacter
} from '@shared/constants'
import { characterAvatarUrl } from '@shared/utils/avatar'
import { cn } from '../../../lib/classnames'

interface CompanionSwitcherProps {
  profile: UserProfile
  /** Switch the active companion mid-conversation (feature 2.14). */
  onSwitch: (characterId: string, accent: Accent) => void
}

/**
 * Phase 9 (2.14) — a compact header control that shows the active companion
 * and opens a popover to swap to another one without leaving the chat.
 * Favorites float to the top of the list.
 */
export default function CompanionSwitcher({ profile, onSwitch }: CompanionSwitcherProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const active = resolveCharacter(profile, profile.settings.characterId)
  const favorites = profile.favoriteCharacterIds ?? []

  const list = useMemo(() => {
    const all = listAllCharacters(profile)
    return [...all].sort(
      (a, b) => (favorites.includes(b.id) ? 1 : 0) - (favorites.includes(a.id) ? 1 : 0)
    )
  }, [profile, favorites])

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const label = active?.name ?? 'Companion'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-2xl px-2.5 py-1.5 hover:bg-white/[0.06] transition text-left"
        title="Switch companion"
      >
        {active?.avatarSeed ? (
          <span
            className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-white/15 shrink-0"
            style={{ background: active.cardTint ? `#${active.cardTint}` : 'rgba(255,255,255,0.06)' }}
          >
            <img src={characterAvatarUrl(active, 72)} alt={label} className="w-full h-full" referrerPolicy="no-referrer" />
          </span>
        ) : (
          <span className="text-2xl">{active?.emoji ?? '🗣️'}</span>
        )}
        <span>
          <span className="block text-lg font-bold tracking-tight leading-none">{label}</span>
          <span className="block text-[11px] text-slate-400 mt-0.5">
            {active
              ? `${ACCENT_LABELS[active.accent]} · ${dailyMood(active.id).emoji} ${dailyMood(active.id).label}`
              : 'Tap to choose'}{' '}
            ▾
          </span>
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-72 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/98 backdrop-blur-xl shadow-2xl p-2 animate-fade-in">
          {list.map((c) => {
            const isActive = c.id === active?.id
            const isFav = favorites.includes(c.id)
            const cat = companionCategory(c.category)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSwitch(c.id, c.accent)
                  setOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition',
                  isActive ? 'bg-brand-500/20 ring-1 ring-brand-400/40' : 'hover:bg-white/[0.06]'
                )}
              >
                {c.avatarSeed ? (
                  <span
                    className="w-9 h-9 rounded-lg overflow-hidden ring-1 ring-white/10 shrink-0"
                    style={{ background: c.cardTint ? `#${c.cardTint}` : 'rgba(255,255,255,0.06)' }}
                  >
                    <img src={characterAvatarUrl(c, 72)} alt={c.name} className="w-full h-full" referrerPolicy="no-referrer" />
                  </span>
                ) : (
                  <span className="text-xl w-9 text-center shrink-0">{c.emoji}</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                    {isFav && <span className="text-amber-300 text-xs">★</span>}
                  </span>
                  <span className="block text-[11px] text-slate-400 truncate">
                    {cat ? `${cat.emoji} ${cat.label}` : ACCENT_LABELS[c.accent]}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
