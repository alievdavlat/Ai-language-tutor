/**
 * Course access (entitlement) — the single source of truth for "may this
 * learner open the full curriculum of this course?".
 *
 * Access depends on the course's author-chosen pricing
 * (see feedback_course_pricing_policy: default FREE, author may charge):
 *   • free      → unlocked once the learner is enrolled
 *   • one-off   → unlocked once a paid `course` order exists (lifetime access)
 *   • sub       → unlocked while a subscription is active (or canceled but
 *                 still inside the paid period); re-locks when it expires
 *
 * Preview lessons (`lesson.preview`) are always openable on paid courses even
 * without access — they are the free taster. That gate lives in CoursePath,
 * not here; this module only answers the full-access question.
 */
import type { Course, ID } from '@shared/types'
import type { Order, Subscription } from '@shared/types/studio.types'
import { studio } from '../studio/store'

export type AccessStatus =
  | 'free' // free course (unlocked iff enrolled)
  | 'owned' // one-off purchase — lifetime access
  | 'subscribed' // active subscription
  | 'expired' // subscription lapsed — needs renewal
  | 'locked' // paid, never purchased

export interface CourseAccess {
  /** True when the learner may open every (non-preview) lesson. */
  unlocked: boolean
  status: AccessStatus
  /** Subscription row backing a subscribed/expired status. */
  subscription?: Subscription
  /** One-off purchase order backing an owned status. */
  order?: Order
  /** When subscription access ends / renews (ISO). */
  expiresAt?: string
  /** Subscriber canceled — keeps access until expiresAt, then re-locks. */
  canceling?: boolean
}

/**
 * Resolve a learner's access to a course. `enrolled` only matters for free
 * courses (their unlock is enrolment); paid courses derive access from the
 * orders/subscriptions ledger so cancellation/expiry can re-lock independently
 * of the enrolment row.
 */
export async function courseAccess(
  userId: ID | null,
  course: Pick<Course, 'id' | 'pricing'>,
  enrolled: boolean
): Promise<CourseAccess> {
  const kind = course.pricing.kind

  if (kind === 'free') {
    return { unlocked: enrolled, status: 'free' }
  }

  // Paid courses require a signed-in buyer.
  if (!userId) return { unlocked: false, status: 'locked' }

  if (kind === 'one-off') {
    const order = await studio.coursePurchase(userId, course.id)
    return order
      ? { unlocked: true, status: 'owned', order }
      : { unlocked: false, status: 'locked' }
  }

  // Subscription.
  const sub = await studio.courseSubscription(userId, course.id)
  if (!sub) return { unlocked: false, status: 'locked' }

  const periodActive = new Date(sub.renewsAt).getTime() > Date.now()
  // Active = currently billing; canceled-but-still-in-period also grants access.
  const hasAccess = sub.status === 'active' || (sub.status === 'canceled' && periodActive)

  if (hasAccess) {
    return {
      unlocked: true,
      status: 'subscribed',
      subscription: sub,
      expiresAt: sub.renewsAt,
      canceling: sub.status === 'canceled'
    }
  }
  return { unlocked: false, status: 'expired', subscription: sub, expiresAt: sub.renewsAt }
}
