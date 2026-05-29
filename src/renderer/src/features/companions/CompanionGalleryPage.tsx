import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHARACTERS, ACCENT_LABELS, type CharacterInfo } from '@shared/constants'
import { characterAvatarUrl } from '@shared/utils/avatar'
import { useAppStore } from '../../store/useAppStore'
import { cn } from '../../lib/classnames'
import PageHeader from '../../components/layout/PageHeader'
import BackButton from '../../components/layout/BackButton'
import { AgeGate } from '../../components/ui'

type Filter = 'all' | 'english' | 'spanish' | 'french' | 'german' | 'italian' | 'portuguese' | 'asian' | 'arabic'

const LANGUAGE_GROUPS: Record<Filter, (c: CharacterInfo) => boolean> = {
  all: () => true,
  english: (c) => c.language?.startsWith('en') ?? false,
  spanish: (c) => c.language?.startsWith('es') ?? false,
  french: (c) => c.language?.startsWith('fr') ?? false,
  german: (c) => c.language?.startsWith('de') ?? false,
  italian: (c) => c.language?.startsWith('it') ?? false,
  portuguese: (c) => c.language?.startsWith('pt') ?? false,
  asian: (c) => ['ko', 'ja', 'zh'].some((p) => c.language?.startsWith(p)),
  arabic: (c) => c.language?.startsWith('ar') ?? false
}

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  english: 'English',
  spanish: 'Español',
  french: 'Français',
  german: 'Deutsch',
  italian: 'Italiano',
  portuguese: 'Português',
  asian: 'East Asian',
  arabic: 'العربية'
}

export default function CompanionGalleryPage(): JSX.Element {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const characters = useMemo(() => {
    const presets = Object.values(CHARACTERS)
    const customs = profile?.customCharacters ?? []
    return [...presets, ...customs]
  }, [profile])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return characters.filter((c) => {
      if (!LANGUAGE_GROUPS[filter](c)) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.bio.toLowerCase().includes(q) ||
        (c.interests ?? []).some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [characters, filter, query])

  const activeId = profile?.settings.characterId

  const pickCompanion = async (c: CharacterInfo): Promise<void> => {
    if (!profile) return
    const next = {
      ...profile,
      settings: { ...profile.settings, characterId: c.id, accent: c.accent }
    }
    await window.api.profile.save(next)
    setProfile(next)
    navigate('/speaking')
  }

  return (
    <AgeGate featureName="Companions" required="teen">
    <div className="h-full overflow-y-auto bg-slate-950">
      <PageHeader
        left={<BackButton to="/speaking" />}
        title="Companions"
        subtitle="Pick a partner for your next conversation. Diverse voices, accents, registers."
      />

      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, interest, accent…"
            className="input flex-1"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition border',
                filter === f
                  ? 'bg-brand-500/20 border-brand-400/40 text-brand-100'
                  : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
              )}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-500 shrink-0">{filtered.length} companions</span>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((c) => {
            const active = activeId === c.id
            return (
              <article
                key={c.id}
                className={cn(
                  'rounded-3xl border overflow-hidden transition cursor-pointer flex flex-col',
                  active
                    ? 'border-brand-400/60 ring-2 ring-brand-400/30 bg-white/[0.04]'
                    : 'border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]'
                )}
                onClick={() => void pickCompanion(c)}
              >
                {/* Portrait */}
                <div
                  className="aspect-square w-full relative"
                  style={{
                    background: c.cardTint
                      ? `radial-gradient(circle at 50% 50%, #${c.cardTint} 0%, rgba(15,23,42,0.6) 90%)`
                      : 'rgba(255,255,255,0.05)'
                  }}
                >
                  {c.avatarSeed ? (
                    <img
                      src={characterAvatarUrl(c, 320)}
                      alt={c.name}
                      className="w-full h-full p-3"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-7xl">{c.emoji}</div>
                  )}
                  {active && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-widest bg-brand-500 text-white rounded-full px-2 py-0.5">
                      Active
                    </span>
                  )}
                  {c.language && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-mono uppercase bg-black/40 backdrop-blur rounded-full px-2 py-0.5 text-white/90">
                      {c.language}
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="p-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-sm text-white truncate">{c.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono">{c.age}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{c.origin}</p>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">{c.headline}</p>
                  <div className="flex flex-wrap gap-1 mt-auto pt-2">
                    {(c.traits ?? []).slice(0, 3).map((t) => (
                      <span key={t} className="text-[9px] font-bold uppercase tracking-widest rounded-full px-1.5 py-0.5 bg-white/[0.05] text-slate-400 border border-white/10">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">{ACCENT_LABELS[c.accent]}</p>
                </div>
              </article>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-slate-400 text-sm py-12">
            No companions match this filter. Try clearing the search.
          </div>
        )}

        <p className="text-[10px] text-slate-600 text-center pt-4">
          Portraits generated with DiceBear (MIT / CC0 art). No real people depicted.
        </p>
      </div>
    </div>
    </AgeGate>
  )
}
