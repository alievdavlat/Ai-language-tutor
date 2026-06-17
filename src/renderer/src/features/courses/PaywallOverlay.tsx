import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Course } from '@shared/types'
import type { PaymentProvider } from '@shared/types/studio.types'
import type { CourseAccess } from '../../services/access/entitlement'
import { studio } from '../../services/studio/store'
import { backend } from '../../services/backend/useBackend'
import { logActivity } from '../../services/activity'
import { isImageCover } from '../../lib/cover'
import { cn } from '../../lib/classnames'
import { AvatarCircle } from '../../components/ui'
import {
  IconBolt,
  IconCheck,
  IconDownload,
  IconLock,
  IconPlay,
  IconRefresh,
  IconStar,
  IconTrophy,
  IconX
} from '../../components/icons'

/** Region-aware default: UZ rails (Payme/Click) lead; cards/PayPal for the rest. */
const PROVIDERS: { id: PaymentProvider; label: string; tag: string }[] = [
  { id: 'payme', label: 'Payme', tag: 'UzCard · Humo' },
  { id: 'click', label: 'Click', tag: 'Click.uz' },
  { id: 'stripe', label: 'Card', tag: 'Visa · Mastercard' },
  { id: 'paypal', label: 'PayPal', tag: 'Worldwide' }
]

type Phase = 'review' | 'authorizing' | 'capturing' | 'success' | 'error'

interface PaywallOverlayProps {
  course: Course
  teacherName?: string
  access: CourseAccess
  lessonCount: number
  hasFinal: boolean
  /** Fired after access is granted (refresh enrolment + access). */
  onUnlocked: () => void
  onClose: () => void
}

/**
 * Course paywall. Models the full purchase lifecycle before unlock —
 * authorize → capture → grant — with a mock instant capture (studio.checkout
 * records a real Order/Subscription; real capture is the provider webhook,
 * see docs/PAYMENTS.md). Handles buy (one-off), subscribe, renew (re-lock
 * recovery) and the free-enrol path.
 */
export default function PaywallOverlay({
  course,
  teacherName,
  access,
  lessonCount,
  hasFinal,
  onUnlocked,
  onClose
}: PaywallOverlayProps): JSX.Element {
  const pricing = course.pricing
  const isFree = pricing.kind === 'free'
  const isSub = pricing.kind === 'sub'
  const isRenew = access.status === 'expired'
  const amountUsd = pricing.kind === 'one-off' ? pricing.usd : pricing.kind === 'sub' ? pricing.usdPerMo : 0

  const [provider, setProvider] = useState<PaymentProvider>('payme')
  const [referral, setReferral] = useState('')
  const [phase, setPhase] = useState<Phase>('review')
  const [error, setError] = useState<string | null>(null)

  // Lock background scroll + Esc to dismiss (only when not mid-capture).
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && (phase === 'review' || phase === 'success')) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, onClose])

  const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

  async function run(): Promise<void> {
    const userId = backend.currentUserId()
    if (!userId) {
      setError('Sign in to continue.')
      setPhase('error')
      return
    }
    setError(null)
    try {
      if (isFree) {
        await backend.enroll(userId, course.id)
        await logActivity({ userId, kind: 'course_enroll', meta: { courseId: course.id } }).catch(() => {})
        setPhase('success')
        return
      }

      // Authorize → capture (mock instant capture; real = provider webhook).
      setPhase('authorizing')
      await sleep(650)
      setPhase('capturing')

      if (isRenew && access.subscription) {
        await studio.renewSubscription(access.subscription.id)
        // A renewal also re-records the recurring charge.
        await studio.checkout({
          buyerId: userId,
          teacherId: course.teacherId,
          courseId: course.id,
          kind: 'subscription',
          amountUsd,
          provider,
          referralCode: referral.trim() || undefined,
          note: 'Subscription renewal'
        })
      } else {
        await studio.checkout({
          buyerId: userId,
          teacherId: course.teacherId,
          courseId: course.id,
          kind: isSub ? 'subscription' : 'course',
          amountUsd,
          provider,
          referralCode: referral.trim() || undefined
        })
      }
      await logActivity({ userId, kind: 'course_enroll', meta: { courseId: course.id, paid: true } }).catch(() => {})
      await sleep(550)
      setPhase('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment could not be completed.')
      setPhase('error')
    }
  }

  const priceLabel = isFree ? 'Free' : isSub ? `$${amountUsd}` : `$${amountUsd}`
  const ctaLabel = isFree
    ? 'Enrol free →'
    : isRenew
      ? `Renew · $${amountUsd}/mo →`
      : isSub
        ? `Subscribe · $${amountUsd}/mo →`
        : `Pay $${amountUsd} →`

  const perks: { icon: (p: { className?: string }) => JSX.Element; label: string }[] = [
    { icon: IconPlay, label: `All ${lessonCount} lessons unlocked` },
    { icon: IconStar, label: 'Practice, checkpoints & exercises' },
    { icon: IconTrophy, label: hasFinal ? 'Final exam + certificate' : 'Certificate on completion' },
    { icon: isSub ? IconRefresh : IconDownload, label: isSub ? 'Cancel anytime · keep access to period end' : 'Lifetime access — yours forever' }
  ]

  const working = phase === 'authorizing' || phase === 'capturing'

  const node = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Scrim */}
      <button
        aria-label="Close"
        onClick={() => (phase === 'review' || phase === 'success' || phase === 'error') && onClose()}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_.2s_ease]"
      />

      <div className="relative w-full max-w-lg rounded-card border border-white/10 bg-[#0d1018] shadow-2xl overflow-hidden animate-[popIn_.22s_cubic-bezier(.16,1,.3,1)]">
        {/* Header — course cover */}
        <div className={cn('relative px-6 pt-6 pb-5 overflow-hidden', !isImageCover(course.bannerUrl) && `bg-gradient-to-br ${course.cover}`)}>
          {isImageCover(course.bannerUrl) && (
            <>
              <img src={course.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0d1018] via-[#0d1018]/70 to-black/40" />
            </>
          )}
          <button
            onClick={onClose}
            disabled={working}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white/90 flex items-center justify-center transition disabled:opacity-40"
            aria-label="Close"
          >
            <IconX className="w-4 h-4" />
          </button>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-black/35 rounded-full px-2.5 py-1">
              <IconLock className="w-3 h-3" /> {isRenew ? 'Subscription expired' : isSub ? 'Subscription' : isFree ? 'Free course' : 'Premium course'}
            </span>
            <h2 className="mt-2.5 text-2xl font-black tracking-tight text-white leading-tight">{course.title}</h2>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-white/85">
              <span className="font-bold uppercase tracking-wide bg-black/30 rounded px-1.5 py-0.5">{course.level}</span>
              <span>{lessonCount} lessons · {course.hours}h</span>
            </div>
            {teacherName && (
              <div className="mt-3 flex items-center gap-2">
                <AvatarCircle name={teacherName} size="sm" />
                <span className="text-sm text-white font-medium">{teacherName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {(phase === 'review' || phase === 'error') && (
            <>
              {isRenew && (
                <p className="mb-4 text-sm text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2.5">
                  Your subscription lapsed{access.expiresAt ? ` on ${new Date(access.expiresAt).toLocaleDateString()}` : ''}. Renew to unlock the course again.
                </p>
              )}

              {/* Perks */}
              <ul className="flex flex-col gap-2.5 mb-5">
                {perks.map((p) => {
                  const Icon = p.icon
                  return (
                    <li key={p.label} className="flex items-center gap-2.5 text-sm text-slate-200">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {p.label}
                    </li>
                  )
                })}
              </ul>

              {/* Payment (paid only) */}
              {!isFree && (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">Pay with</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setProvider(p.id)}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-left transition',
                          provider === p.id
                            ? 'border-brand-400/60 bg-brand-500/15 ring-1 ring-brand-400/40'
                            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                        )}
                      >
                        <span className="block text-sm font-bold text-white">{p.label}</span>
                        <span className="block text-[11px] text-slate-400">{p.tag}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    placeholder="Referral code (optional)"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 mb-4 focus:outline-none focus:border-brand-400/50"
                  />
                </>
              )}

              {error && <p className="text-sm text-rose-300 mb-3">{error}</p>}

              {/* Price + CTA */}
              <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                  <span className="text-3xl font-black text-white">{priceLabel}</span>
                  {isSub && <span className="text-sm text-slate-400 font-medium">/mo</span>}
                  {!isFree && !isSub && <span className="ml-1.5 text-xs text-slate-400">one-time</span>}
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <IconBolt className="w-3.5 h-3.5 text-amber-300" /> Instant access
                </span>
              </div>
              <button onClick={run} className="btn-primary w-full py-3 text-base font-bold">{ctaLabel}</button>
              <p className="mt-3 text-[11px] text-center text-slate-500">
                {isSub ? 'Recurring monthly · cancel anytime from this page.' : isFree ? 'No payment needed.' : 'Secure checkout · instant lifetime access.'}
              </p>
            </>
          )}

          {working && (
            <div className="py-8 flex flex-col items-center text-center gap-5">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-brand-400/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-brand-300">
                  <IconLock className="w-6 h-6" />
                </div>
              </div>
              <Steps phase={phase} provider={PROVIDERS.find((p) => p.id === provider)?.label ?? 'provider'} />
            </div>
          )}

          {phase === 'success' && (
            <div className="py-6 flex flex-col items-center text-center gap-4 animate-[fadeIn_.25s_ease]">
              <span className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center ring-4 ring-emerald-400/20">
                <IconCheck className="w-8 h-8" />
              </span>
              <div>
                <h3 className="text-xl font-black text-white">{isFree ? "You're enrolled!" : isRenew ? 'Subscription renewed!' : 'Unlocked!'}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {isSub
                    ? 'Your subscription is active. The whole course is open.'
                    : 'The whole course is now open. Time to learn.'}
                </p>
              </div>
              <button onClick={onUnlocked} className="btn-primary w-full py-3 font-bold inline-flex items-center justify-center gap-2">
                <IconPlay className="w-4 h-4" /> Start learning
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

function Steps({ phase, provider }: { phase: Phase; provider: string }): JSX.Element {
  const steps = [
    { key: 'authorizing', label: `Contacting ${provider}` },
    { key: 'capturing', label: 'Confirming payment' }
  ] as const
  const order: Phase[] = ['authorizing', 'capturing']
  const currentIdx = order.indexOf(phase)
  return (
    <div className="flex flex-col gap-2 w-full max-w-[220px]">
      {steps.map((s, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={s.key} className="flex items-center gap-2.5 text-sm">
            <span
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition',
                done ? 'bg-emerald-500/20 text-emerald-300' : active ? 'bg-brand-500/20 text-brand-300' : 'bg-white/5 text-slate-600'
              )}
            >
              {done ? <IconCheck className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            </span>
            <span className={cn(done ? 'text-slate-400' : active ? 'text-white font-medium' : 'text-slate-600')}>{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}
