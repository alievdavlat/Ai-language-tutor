import { useCallback, useEffect, useState } from 'react'
import { cn } from '../../lib/classnames'
import { AvatarCircle, PageHeader, Tabs, type TabItem } from '../../components/ui'
import { IconBolt, IconHeart, IconMic, IconPencilEdit, IconStar, IconTrophy } from '../../components/icons'
import { backend } from '../../services/backend/useBackend'
import { social, meId } from '../../services/backend/social'
import { useAppStore } from '../../store/useAppStore'
import { timeAgo } from '../../lib/time'
import { useT } from '../../i18n'
import type { FeedbackSubmission, KarmaWallet, PeerReview, PlatformUser } from '@shared/types'

type Tab = 'give' | 'received' | 'submit'

const FREE_PER_DAY = 2
const SUBMIT_COST = 5

export default function FeedbackExchangePage(): JSX.Element {
  const t = useT()
  const me = meId()
  const profile = useAppStore((s) => s.profile)
  const [tab, setTab] = useState<Tab>('give')
  const [karma, setKarma] = useState<KarmaWallet | null>(null)
  const [open, setOpen] = useState<FeedbackSubmission[]>([])
  const [mine, setMine] = useState<FeedbackSubmission[]>([])
  const [received, setReceived] = useState<{ review: PeerReview; submission: FeedbackSubmission }[]>([])
  const [authors, setAuthors] = useState<Record<string, PlatformUser | null>>({})
  const [reviewers, setReviewers] = useState<Record<string, PlatformUser | null>>({})

  const reload = useCallback(async () => {
    const [wallet, openList, myList, rec] = await Promise.all([
      social.getKarma(me),
      social.listFeedback({ status: 'open', excludeAuthor: me }),
      social.myFeedback(me),
      social.reviewsForMe(me)
    ])
    setKarma(wallet)
    setOpen(openList)
    setMine(myList)
    setReceived(rec)
    // Resolve author + reviewer names.
    const authorIds = [...new Set(openList.map((s) => s.authorId))]
    const reviewerIds = [...new Set(rec.map((r) => r.review.reviewerId))]
    const [as, rs] = await Promise.all([
      Promise.all(authorIds.map((id) => backend.getUser(id))),
      Promise.all(reviewerIds.map((id) => backend.getUser(id)))
    ])
    setAuthors(Object.fromEntries(authorIds.map((id, i) => [id, as[i]])))
    setReviewers(Object.fromEntries(reviewerIds.map((id, i) => [id, rs[i]])))
  }, [me])

  useEffect(() => {
    void reload()
  }, [reload])

  const freeLeft = karma ? Math.max(0, FREE_PER_DAY - karma.submittedToday) : FREE_PER_DAY

  const localizedTabs: TabItem<Tab>[] = [
    { id: 'give', label: t('soc.fbTabGive') },
    { id: 'received', label: t('soc.fbTabReceived') },
    { id: 'submit', label: t('soc.fbTabSubmit') }
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow={t('soc.community')}
          title={t('soc.feedbackExchange')}
          subtitle={t('soc.feedbackSubtitle')}
          back="/community"
          crumbs={[{ label: t('soc.community'), to: '/community' }, { label: t('soc.feedback') }]}
          action={
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">{t('soc.yourKarma')}</p>
              <p className="text-2xl font-black text-amber-300 inline-flex items-center gap-1">
                <IconTrophy className="w-5 h-5" /> {karma?.balance ?? '—'}
              </p>
            </div>
          }
        />

        {/* Karma banner */}
        <div className="rounded-card p-5 bg-gradient-to-br from-amber-500/15 to-rose-500/15 border border-amber-400/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl">🧧</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">
              {freeLeft > 0 ? `${t('soc.youCanSubmit')} ${freeLeft} ${freeLeft === 1 ? t('soc.freeItemOne') : t('soc.freeItemMany')} ${t('soc.today')}` : `${t('soc.submissionsCostPrefix')} ${SUBMIT_COST} ${t('soc.karmaToday')}`}
            </p>
            <p className="text-xs text-amber-100/80">
              {t('soc.eachReviewEarns')} · {t('soc.earned')} {karma?.earnedTotal ?? 0} {t('soc.allTime')}.
            </p>
          </div>
          <button onClick={() => setTab('submit')} className="btn-primary text-xs px-4 py-2">{t('soc.submitWork')}</button>
        </div>

        <Tabs items={localizedTabs} active={tab} onChange={setTab} className="self-start" />

        {tab === 'give' && (
          <GiveTab
            items={open}
            authors={authors}
            me={me}
            onReviewed={reload}
          />
        )}

        {tab === 'received' && (
          <ReceivedTab mine={mine} received={received} reviewers={reviewers} onThanked={reload} />
        )}

        {tab === 'submit' && (
          <SubmitTab
            me={me}
            language={profile?.targetLanguage ?? 'en'}
            level={profile?.level ?? 'B1'}
            freeLeft={freeLeft}
            balance={karma?.balance ?? 0}
            onSubmitted={async () => {
              await reload()
              setTab('received')
            }}
          />
        )}
      </div>
    </div>
  )
}

// ─── Give feedback tab ───────────────────────────────────────────────────────

function GiveTab({
  items,
  authors,
  me,
  onReviewed
}: {
  items: FeedbackSubmission[]
  authors: Record<string, PlatformUser | null>
  me: string
  onReviewed: () => Promise<void>
}): JSX.Element {
  const t = useT()
  const [reviewing, setReviewing] = useState<string | null>(null)

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-white/10 bg-white/[0.025] p-8 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-sm font-semibold text-white">{t('soc.nothingToReview')}</p>
        <p className="text-xs text-slate-500 mt-1">{t('soc.checkBackSoon')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((s) => {
        const author = authors[s.authorId]
        return (
          <article key={s.id} className="rounded-card border border-white/10 bg-white/[0.025] p-4">
            <header className="flex items-center gap-3 mb-3">
              <AvatarCircle name={author?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">
                  {author?.name ?? t('soc.aLearner')} <span className="text-xs text-slate-500">· {s.level}</span>
                </p>
                <p className="text-[11px] text-slate-500">{timeAgo(s.createdAt)} · {s.reviewCount} {s.reviewCount === 1 ? t('soc.reviewOne') : t('soc.reviewMany')}</p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest',
                  s.kind === 'writing' ? 'bg-violet-500/15 text-violet-200' : 'bg-emerald-500/15 text-emerald-200'
                )}
              >
                {s.kind === 'writing' ? <IconPencilEdit className="w-3 h-3" /> : <IconMic className="w-3 h-3" />}
                {s.kind === 'writing' ? t('soc.kindWriting') : t('soc.kindSpeaking')}
              </span>
            </header>
            <p className="text-sm font-semibold text-white">{s.topic}</p>
            <p className={cn('text-xs text-slate-400 mt-1', reviewing === s.id ? '' : 'line-clamp-2')}>{s.content}</p>

            {reviewing === s.id ? (
              <ReviewComposer
                submission={s}
                me={me}
                onCancel={() => setReviewing(null)}
                onDone={async () => {
                  setReviewing(null)
                  await onReviewed()
                }}
              />
            ) : (
              <div className="flex items-center justify-between mt-3">
                <span className="inline-flex items-center gap-1 text-xs text-amber-200 font-bold">
                  <IconBolt className="w-3.5 h-3.5" /> {t('soc.earnPlus')} +{s.reward} {t('soc.karma')}
                </span>
                <button onClick={() => setReviewing(s.id)} className="btn-primary text-xs px-4 py-1.5">{t('soc.review')}</button>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}

function ReviewComposer({
  submission,
  me,
  onCancel,
  onDone
}: {
  submission: FeedbackSubmission
  me: string
  onCancel: () => void
  onDone: () => Promise<void>
}): JSX.Element {
  const t = useT()
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (): Promise<void> => {
    if (text.trim().length < 10 || saving) return
    setSaving(true)
    try {
      await social.createPeerReview({ submissionId: submission.id, reviewerId: me, rating, text: text.trim() })
      await onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-brand-400/30 bg-brand-500/5 p-3 flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mr-2">{t('soc.rating')}</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} title={`${n} ${t('soc.stars')}`} className="p-0.5">
            <IconStar className={cn('w-5 h-5', n <= rating ? 'text-amber-300' : 'text-slate-600')} />
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="input min-h-[90px] resize-none text-sm"
        placeholder={t('soc.reviewPlaceholder')}
      />
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="btn-ghost text-xs px-3 py-1.5">{t('soc.cancel')}</button>
        <button onClick={() => void submit()} disabled={text.trim().length < 10 || saving} className="btn-primary text-xs px-4 py-1.5">
          {saving ? t('soc.posting') : `${t('soc.postReview')} · +${submission.reward} ${t('soc.karma')}`}
        </button>
      </div>
    </div>
  )
}

// ─── Your work tab ───────────────────────────────────────────────────────────

function ReceivedTab({
  mine,
  received,
  reviewers,
  onThanked
}: {
  mine: FeedbackSubmission[]
  received: { review: PeerReview; submission: FeedbackSubmission }[]
  reviewers: Record<string, PlatformUser | null>
  onThanked: () => Promise<void>
}): JSX.Element {
  const t = useT()
  const thank = async (id: string): Promise<void> => {
    await social.thankReview(id)
    await onThanked()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Reviews received */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">{t('soc.feedbackReceived')}</p>
        {received.length === 0 ? (
          <p className="text-xs text-slate-500">{t('soc.noReviewsYet')}</p>
        ) : (
          received.map(({ review, submission }) => {
            const reviewer = reviewers[review.reviewerId]
            return (
              <article key={review.id} className="rounded-card border border-white/10 bg-white/[0.025] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-white">{submission.topic}</p>
                  <span className="text-[11px] text-slate-500">{timeAgo(review.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <AvatarCircle name={reviewer?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300">
                      <b className="text-white">{reviewer?.name ?? t('soc.aPeer')}</b>
                      <span className="inline-flex items-center gap-0.5 text-amber-300 ml-1">
                        {Array.from({ length: review.rating }).map((_, j) => (
                          <IconStar key={j} className="w-3 h-3" />
                        ))}
                      </span>
                    </p>
                    <p className="text-sm text-slate-200 mt-1">"{review.text}"</p>
                  </div>
                  <button
                    onClick={() => void thank(review.id)}
                    disabled={review.thanked}
                    title={t('soc.thankReviewer')}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full text-[11px] font-bold px-3 py-1',
                      review.thanked ? 'bg-pink-500/25 text-pink-200 cursor-default' : 'bg-pink-500/15 text-pink-200 hover:bg-pink-500/25'
                    )}
                  >
                    <IconHeart className="w-3.5 h-3.5" /> {review.thanked ? t('soc.thanked') : t('soc.thank')}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* My submissions */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">{t('soc.yourSubmissions')}</p>
        {mine.length === 0 ? (
          <p className="text-xs text-slate-500">{t('soc.noSubmissionsYet')}</p>
        ) : (
          mine.map((s) => (
            <article key={s.id} className="rounded-card border border-white/10 bg-white/[0.025] p-4 flex items-center gap-3">
              <span
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  s.kind === 'writing' ? 'bg-violet-500/15 text-violet-200' : 'bg-emerald-500/15 text-emerald-200'
                )}
              >
                {s.kind === 'writing' ? <IconPencilEdit className="w-4 h-4" /> : <IconMic className="w-4 h-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{s.topic}</p>
                <p className="text-[11px] text-slate-500">{timeAgo(s.createdAt)}</p>
              </div>
              <span
                className={cn(
                  'text-[11px] font-bold rounded-full px-2.5 py-1',
                  s.reviewCount > 0 ? 'bg-emerald-500/15 text-emerald-200' : 'bg-white/[0.06] text-slate-400'
                )}
              >
                {s.reviewCount > 0 ? `${s.reviewCount} ${s.reviewCount === 1 ? t('soc.reviewOne') : t('soc.reviewMany')}` : t('soc.awaitingReview')}
              </span>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Submit new tab ──────────────────────────────────────────────────────────

function SubmitTab({
  me,
  language,
  level,
  freeLeft,
  balance,
  onSubmitted
}: {
  me: string
  language: FeedbackSubmission['language']
  level: string
  freeLeft: number
  balance: number
  onSubmitted: () => Promise<void>
}): JSX.Element {
  const t = useT()
  const [kind, setKind] = useState<'writing' | 'speaking'>('writing')
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const canAfford = freeLeft > 0 || balance >= SUBMIT_COST
  const valid = topic.trim().length > 2 && words >= 5 && canAfford

  const submit = async (): Promise<void> => {
    if (!valid || saving) return
    setSaving(true)
    setError(null)
    try {
      await social.createFeedback({
        authorId: me,
        kind,
        topic: topic.trim(),
        content: content.trim(),
        language,
        level,
        reward: kind === 'speaking' ? 20 : 15
      })
      setTopic('')
      setContent('')
      await onSubmitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('soc.couldNotSubmit'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-card border border-white/10 bg-white/[0.025] p-5 flex flex-col gap-4">
      <div>
        <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{t('soc.type')}</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {(['writing', 'speaking'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition',
                kind === k ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
              )}
            >
              <p className="inline-flex items-center gap-2 text-sm font-bold text-white">
                {k === 'writing' ? <IconPencilEdit className="w-4 h-4" /> : <IconMic className="w-4 h-4" />}
                {k === 'writing' ? t('soc.kindWriting') : t('soc.kindSpeaking')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{k === 'writing' ? t('soc.writingHint') : t('soc.speakingHint')}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{t('soc.topicContext')}</label>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="input mt-1.5" placeholder={t('soc.topicPlaceholder')} />
      </div>

      <div>
        <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
          {kind === 'writing' ? t('soc.yourWriting') : t('soc.yourTranscript')}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input mt-1.5 min-h-[120px] resize-none"
          placeholder={kind === 'writing' ? t('soc.writingPlaceholder') : t('soc.transcriptPlaceholder')}
        />
        <p className="text-[10px] text-slate-500 mt-1">{words} {t('soc.words')}</p>
      </div>

      {error && <p className="text-xs text-rose-300">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {freeLeft > 0 ? `${t('soc.free')} · ${freeLeft} ${t('soc.leftToday')}` : `${t('soc.cost')}: ${SUBMIT_COST} ${t('soc.karma')} (${t('soc.balance')} ${balance})`}
        </span>
        <button onClick={() => void submit()} disabled={!valid || saving} className="btn-primary px-5 py-2 text-sm">
          {saving ? t('soc.submitting') : t('soc.submitForReview')}
        </button>
      </div>
    </div>
  )
}
