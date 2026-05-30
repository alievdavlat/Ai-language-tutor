import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader, Tabs, type TabItem } from '../../components/ui'
import { IconLive, IconSearch, IconStar, IconUsers } from '../../components/icons'
import { social, meId } from '../../services/backend/social'
import { backend } from '../../services/backend/useBackend'
import { dateTime, timeAgo } from '../../lib/time'
import type { Booking, TutorProfile, TutorReview } from '@shared/types'

type Tab = 'pro' | 'community'
const TABS: TabItem<Tab>[] = [
  { id: 'pro', label: 'Professional · $20-40/h' },
  { id: 'community', label: 'Community · $5-15/h' }
]

type PriceTier = 'any' | 'low' | 'mid' | 'high'
const PRICE_RANGES: Record<PriceTier, (p: number) => boolean> = {
  any: () => true,
  low: (p) => p <= 15,
  mid: (p) => p > 15 && p <= 30,
  high: (p) => p > 30
}

export default function TutorsPage(): JSX.Element {
  const me = meId()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('pro')
  const [q, setQ] = useState('')
  const [language, setLanguage] = useState('any')
  const [price, setPrice] = useState<PriceTier>('any')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [tutors, setTutors] = useState<TutorProfile[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [openTutor, setOpenTutor] = useState<TutorProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const reloadBookings = useCallback(async () => {
    setBookings(await social.myBookings(me))
  }, [me])

  useEffect(() => {
    let alive = true
    void social.listTutors().then((list) => {
      if (alive) {
        setTutors(list)
        setLoading(false)
      }
    })
    void reloadBookings()
    return () => {
      alive = false
    }
  }, [reloadBookings])

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return tutors.filter((t) => {
      if (t.kind !== tab) return false
      if (onlineOnly && !t.online) return false
      if (!PRICE_RANGES[price](t.hourlyRateUsd)) return false
      if (language !== 'any' && !t.teaches.some((x) => x.toLowerCase().includes(language.toLowerCase()))) return false
      if (
        ql &&
        !(
          t.name.toLowerCase().includes(ql) ||
          t.headline.toLowerCase().includes(ql) ||
          t.tags.some((tag) => tag.toLowerCase().includes(ql))
        )
      )
        return false
      return true
    })
  }, [tutors, tab, onlineOnly, price, language, q])

  const onlineCount = tutors.filter((t) => t.online).length
  const upcoming = bookings.filter((b) => b.status !== 'cancelled' && new Date(b.startISO).getTime() > Date.now() - 60 * 60_000)

  const instantCall = async (): Promise<void> => {
    const target = filtered.find((t) => t.online) ?? tutors.find((t) => t.online)
    if (!target) return
    setOpenTutor(target)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-5">
        <PageHeader
          title="Tutors"
          subtitle="Live 1:1 lessons with native and certified tutors."
          back="/meet"
          crumbs={[{ label: 'Speaking partner', to: '/meet' }, { label: 'Tutors' }]}
          action={
            <button onClick={() => void instantCall()} className="btn-primary text-xs px-3 py-2">Instant call</button>
          }
        />

        {/* My upcoming lessons */}
        {upcoming.length > 0 && (
          <div className="rounded-card border border-emerald-400/20 bg-emerald-500/[0.07] p-4">
            <p className="text-xs uppercase tracking-widest text-emerald-200/80 font-bold mb-2">Your upcoming lessons</p>
            <div className="flex flex-col gap-2">
              {upcoming.map((b) => {
                const tutor = tutors.find((t) => t.id === b.tutorId)
                return (
                  <div key={b.id} className="flex items-center gap-3">
                    <AvatarCircle name={tutor?.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {tutor?.name ?? 'Tutor'} · <span className="capitalize text-slate-300">{b.kind}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">{dateTime(b.startISO)} · {b.durationMin} min</p>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1',
                        b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'
                      )}
                    >
                      {b.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by name, language, focus"
              className="input pl-9 text-sm"
            />
          </div>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input text-sm sm:w-44">
            <option value="any">Any language</option>
            <option value="english">English</option>
            <option value="italian">Italian</option>
            <option value="japanese">Japanese</option>
            <option value="chinese">Chinese</option>
            <option value="hindi">Hindi</option>
          </select>
          <select value={price} onChange={(e) => setPrice(e.target.value as PriceTier)} className="input text-sm sm:w-40">
            <option value="any">Any price</option>
            <option value="low">$5–15</option>
            <option value="mid">$15–30</option>
            <option value="high">$30+</option>
          </select>
          <button
            onClick={() => setOnlineOnly((v) => !v)}
            className={cn(
              'text-sm rounded-xl px-4 py-2 font-semibold border transition shrink-0',
              onlineOnly ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200' : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
            )}
          >
            ● Online now
          </button>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {/* Instant talk now */}
        <div className="rounded-card p-5 bg-gradient-to-br from-brand-500/15 to-violet-500/15 border border-brand-400/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <IconLive className="w-6 h-6 text-brand-200" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Talk to someone right now</p>
            <p className="text-xs text-slate-300">{onlineCount} tutors online · average wait under 1 min</p>
          </div>
          <button onClick={() => void instantCall()} className="btn-primary text-xs px-4 py-2" disabled={onlineCount === 0}>
            Find a tutor
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading tutors…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-card border border-white/10 bg-white/[0.025] p-8 text-center">
            <p className="text-sm font-semibold text-white">No tutors match your filters</p>
            <p className="text-xs text-slate-500 mt-1">Try widening the price range or clearing the search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TutorCard key={t.id} t={t} onOpen={() => setOpenTutor(t)} />
            ))}
          </div>
        )}

        {/* Become a tutor */}
        <div className="mt-4 rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
            <IconUsers className="w-7 h-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-bold text-white">Earn as a community tutor</p>
            <p className="text-xs text-slate-400">Set your own rates · keep 85% · cash out monthly.</p>
          </div>
          <button onClick={() => navigate('/teacher')} className="btn-ghost text-xs px-4 py-2 shrink-0">Apply to teach</button>
        </div>
      </div>

      {openTutor && (
        <TutorDetail
          tutor={openTutor}
          me={me}
          onClose={() => setOpenTutor(null)}
          onBooked={async () => {
            await reloadBookings()
            // Refresh tutor list so lessonsGiven/ratings update.
            setTutors(await social.listTutors())
          }}
          onMessage={async () => {
            await backend.getOrCreateThread(me, openTutor.userId)
            navigate('/inbox')
          }}
        />
      )}
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────

function TutorCard({ t, onOpen }: { t: TutorProfile; onOpen: () => void }): JSX.Element {
  return (
    <article className="rounded-card border border-white/10 bg-white/[0.025] overflow-hidden hover:border-white/20 transition flex flex-col">
      <button onClick={onOpen} className={cn('relative h-32 bg-gradient-to-br text-left', t.cover)}>
        <span className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center">
          <span className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[10px] border-l-white ml-1" />
        </span>
        {t.online && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Online now
          </span>
        )}
        {t.trial && (
          <span className="absolute top-2 right-2 rounded-full bg-amber-400/90 backdrop-blur text-amber-950 text-[10px] font-bold px-2 py-0.5">Free trial</span>
        )}
      </button>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start gap-3">
          <AvatarCircle name={t.name} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {t.name} <span className="text-base">{t.flag}</span>
            </p>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{t.headline}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {t.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] rounded-full bg-white/[0.06] text-slate-300 px-2 py-0.5">{tag}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="inline-flex items-center gap-1 text-xs text-amber-300">
            <IconStar className="w-3.5 h-3.5" /> <b className="text-white">{t.rating}</b>
            <span className="text-slate-500">({t.reviewCount})</span>
          </span>
          <span className="text-sm font-bold text-emerald-200">${t.hourlyRateUsd}<span className="text-[10px] text-slate-400">/h</span></span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button onClick={onOpen} className="btn-ghost text-xs py-2">Book</button>
          <button onClick={onOpen} className="text-xs py-2 rounded-xl font-semibold transition bg-grad-brand text-white hover:brightness-110">
            View
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── Detail / booking drawer ─────────────────────────────────────────────────

interface Slot {
  iso: string
  label: string
}

/** Build concrete bookable slots for the next 14 days from recurring weekly availability. */
function buildSlots(t: TutorProfile): Slot[] {
  const out: Slot[] = []
  const today = new Date()
  for (let d = 0; d < 14 && out.length < 24; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() + d)
    const wd = date.getDay()
    const day = t.availability.find((a) => a.weekday === wd)
    if (!day) continue
    for (const time of day.times) {
      const [h, m] = time.split(':').map(Number)
      const slot = new Date(date)
      slot.setHours(h, m, 0, 0)
      if (slot.getTime() <= Date.now()) continue
      out.push({
        iso: slot.toISOString(),
        label: slot.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      })
    }
  }
  return out
}

function TutorDetail({
  tutor,
  me,
  onClose,
  onBooked,
  onMessage
}: {
  tutor: TutorProfile
  me: string
  onClose: () => void
  onBooked: () => Promise<void>
  onMessage: () => Promise<void>
}): JSX.Element {
  const [reviews, setReviews] = useState<TutorReview[]>([])
  const [reviewerNames, setReviewerNames] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [showReview, setShowReview] = useState(false)
  const slots = useMemo(() => buildSlots(tutor), [tutor])

  const loadReviews = useCallback(async () => {
    const list = await social.listTutorReviews(tutor.id)
    setReviews(list)
    const ids = [...new Set(list.map((r) => r.studentId))]
    const users = await Promise.all(ids.map((id) => backend.getUser(id)))
    setReviewerNames(Object.fromEntries(ids.map((id, i) => [id, users[i]?.name ?? 'Student'])))
  }, [tutor.id])

  useEffect(() => {
    void loadReviews()
  }, [loadReviews])

  const book = async (kind: 'trial' | 'lesson' | 'instant'): Promise<void> => {
    if (booking) return
    setBooking(true)
    try {
      const startISO = kind === 'instant' ? new Date(Date.now() + 60_000).toISOString() : selected ?? slots[0]?.iso
      if (!startISO) return
      const price = kind === 'trial' ? 0 : Math.round((tutor.hourlyRateUsd * (kind === 'instant' ? 0.25 : 1)) * 100) / 100
      await social.createBooking({
        tutorId: tutor.id,
        studentId: me,
        startISO,
        durationMin: kind === 'instant' ? 15 : kind === 'trial' ? 30 : 60,
        kind,
        priceUsd: price
      })
      await onBooked()
      setConfirmation(
        kind === 'instant'
          ? `Connecting you with ${tutor.name} now…`
          : `${kind === 'trial' ? 'Free trial' : 'Lesson'} booked for ${new Date(startISO).toLocaleString()}`
      )
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <aside className="w-full max-w-md h-full bg-canvas border-l border-white/10 overflow-y-auto shadow-2xl">
        <div className={cn('relative h-36 bg-gradient-to-br', tutor.cover)}>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50">✕</button>
          {tutor.online && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Online now
            </span>
          )}
        </div>

        <div className="p-5 flex flex-col gap-5 -mt-10">
          <div className="flex items-end gap-3">
            <AvatarCircle name={tutor.name} size="lg" className="ring-4 ring-canvas" />
            <div className="flex-1 min-w-0 pb-1">
              <p className="text-lg font-bold text-white">{tutor.name} <span className="text-base">{tutor.flag}</span></p>
              <p className="text-xs text-slate-400">{tutor.headline}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1 text-amber-300"><IconStar className="w-4 h-4" /><b className="text-white">{tutor.rating}</b> ({tutor.reviewCount})</span>
            <span className="text-slate-400">{tutor.lessonsGiven.toLocaleString()} lessons</span>
            <span className="text-slate-400">{tutor.studentsCount} students</span>
            <span className="ml-auto text-sm font-bold text-emerald-200">${tutor.hourlyRateUsd}/h</span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{tutor.bio}</p>

          <div className="flex flex-wrap gap-1.5">
            {tutor.tags.map((tag) => (
              <span key={tag} className="text-[11px] rounded-full bg-brand-500/10 text-brand-200 px-2.5 py-1">{tag}</span>
            ))}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Speaks</p>
            <div className="flex flex-wrap gap-2">
              {tutor.speaks.map((s) => (
                <span key={s.language} className="text-xs text-slate-300">{s.language} <span className="text-slate-500">· {s.level}</span></span>
              ))}
            </div>
          </div>

          {confirmation ? (
            <div className="rounded-card border border-emerald-400/30 bg-emerald-500/10 p-4 text-center">
              <p className="text-3xl mb-1">✅</p>
              <p className="text-sm font-semibold text-white">{confirmation}</p>
              <button onClick={onClose} className="btn-ghost text-xs px-4 py-2 mt-3">Done</button>
            </div>
          ) : (
            <>
              {/* Availability calendar */}
              <div>
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-2">Pick a time</p>
                {slots.length === 0 ? (
                  <p className="text-xs text-slate-500">No open slots in the next two weeks — try an instant call.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {slots.map((s) => (
                      <button
                        key={s.iso}
                        onClick={() => setSelected(s.iso)}
                        className={cn(
                          'text-[11px] rounded-lg border px-2 py-2 text-left transition',
                          selected === s.iso ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                {tutor.trial && (
                  <button onClick={() => void book('trial')} disabled={booking} className="btn-ghost text-xs py-2.5 col-span-2">
                    🎁 Book a free trial (30 min)
                  </button>
                )}
                <button onClick={() => void book('lesson')} disabled={booking || (slots.length > 0 && !selected)} className="btn-primary text-xs py-2.5">
                  Book lesson {selected ? '' : '(pick a time)'}
                </button>
                <button
                  onClick={() => void book('instant')}
                  disabled={booking || !tutor.online}
                  className={cn('text-xs py-2.5 rounded-xl font-semibold transition', tutor.online ? 'bg-emerald-500/90 text-white hover:bg-emerald-500' : 'bg-white/[0.04] text-slate-500 border border-white/10 cursor-not-allowed')}
                >
                  {tutor.online ? '⚡ Talk now' : 'Offline'}
                </button>
                <button onClick={() => void onMessage()} className="btn-ghost text-xs py-2.5 col-span-2">💬 Message tutor</button>
              </div>
            </>
          )}

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Reviews ({reviews.length})</p>
              <button onClick={() => setShowReview((v) => !v)} className="text-[11px] text-brand-300 font-semibold">{showReview ? 'Cancel' : 'Write a review'}</button>
            </div>

            {showReview && (
              <TutorReviewComposer
                tutorId={tutor.id}
                me={me}
                onDone={async () => {
                  setShowReview(false)
                  await loadReviews()
                  await onBooked()
                }}
              />
            )}

            <div className="flex flex-col gap-3 mt-2">
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500">No reviews yet — be the first.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2">
                      <AvatarCircle name={reviewerNames[r.studentId]} size="sm" />
                      <p className="text-xs font-semibold text-white flex-1">{reviewerNames[r.studentId] ?? 'Student'}</p>
                      <span className="inline-flex items-center gap-0.5 text-amber-300">
                        {Array.from({ length: r.rating }).map((_, i) => <IconStar key={i} className="w-3 h-3" />)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">"{r.text}"</p>
                    <p className="text-[10px] text-slate-500 mt-1">{timeAgo(r.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

function TutorReviewComposer({ tutorId, me, onDone }: { tutorId: string; me: string; onDone: () => Promise<void> }): JSX.Element {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <div className="rounded-xl border border-brand-400/30 bg-brand-500/5 p-3 flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} className="p-0.5">
            <IconStar className={cn('w-5 h-5', n <= rating ? 'text-amber-300' : 'text-slate-600')} />
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[70px] resize-none text-sm" placeholder="How was the lesson?" />
      <button
        onClick={async () => {
          if (text.trim().length < 5 || saving) return
          setSaving(true)
          try {
            await social.createTutorReview({ tutorId, studentId: me, rating, text: text.trim() })
            await onDone()
          } finally {
            setSaving(false)
          }
        }}
        disabled={text.trim().length < 5 || saving}
        className="btn-primary text-xs py-2 self-end px-4"
      >
        {saving ? 'Posting…' : 'Post review'}
      </button>
    </div>
  )
}
