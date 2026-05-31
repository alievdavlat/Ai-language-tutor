/**
 * Seed data for the social slice (tutors, tutor reviews, feedback submissions,
 * peer reviews, groups, challenges). Authors reuse the canonical SEED_USERS ids
 * from seed.ts so avatars/names resolve consistently.
 *
 * 2026-05-31 — flushed to a SINGLE real instance of each type (1 tutor, 1
 * feedback request, 1 group, 1 challenge). Real cover images, honest counts.
 * Mirrors the cloud seed (scripts/flush-seed.mjs) — same ids (g_business,
 * ch_streak30) and same images.
 */
import type { Challenge, FeedbackSubmission, Group, PeerReview, TutorProfile, TutorReview } from '@shared/types'
import { SEED_IMG } from './seed-images'

const t = (mins = 0): string => new Date(Date.now() - mins * 60_000).toISOString()

const WEEKDAY_EVENINGS = [
  { weekday: 1, times: ['18:00', '19:00', '20:00'] },
  { weekday: 2, times: ['18:00', '19:00', '20:00'] },
  { weekday: 3, times: ['18:00', '19:00', '20:00'] },
  { weekday: 4, times: ['18:00', '19:00'] }
]

export const SEED_TUTORS: TutorProfile[] = [
  {
    id: 'tut_emma',
    userId: 'u_emma',
    name: 'Emma Carter',
    flag: '🇬🇧',
    headline: 'Business English & interviews',
    bio: 'Senior English coach & IELTS examiner. I help professionals nail meetings, emails and job interviews. Conversational, practical, zero textbook drudgery.',
    teaches: ['English'],
    speaks: [{ language: 'English', level: 'Native' }, { language: 'Spanish', level: 'C1' }],
    kind: 'pro',
    hourlyRateUsd: 30,
    rating: 5,
    reviewCount: 1,
    lessonsGiven: 1,
    studentsCount: 1,
    trial: true,
    online: true,
    tags: ['Business', 'Interviews', 'Conversation'],
    cover: 'from-violet-500 to-purple-700',
    availability: WEEKDAY_EVENINGS,
    avatarEmoji: '👩‍🏫',
    createdAt: t(60 * 24 * 90)
  }
]

export const SEED_TUTOR_REVIEWS: TutorReview[] = [
  { id: 'trv_1', tutorId: 'tut_emma', studentId: 'u_priya', rating: 5, text: 'Clear, practical lessons — my work emails improved in a week.', createdAt: t(60 * 24 * 5) }
]

export const SEED_FEEDBACK: FeedbackSubmission[] = [
  {
    id: 'fb_1',
    authorId: 'u_priya',
    kind: 'writing',
    topic: 'Email — requesting a refund for a faulty product',
    content:
      'Dear Customer Service, I am writing to request a full refund for the wireless headphones I purchased on your website last week, order #48213, as they stopped working after only two days...',
    language: 'en',
    level: 'B1',
    reward: 10,
    status: 'open',
    reviewCount: 0,
    createdAt: t(60 * 24)
  }
]

export const SEED_PEER_REVIEWS: PeerReview[] = []

// ─── Groups / clubs + challenges ──────────────────────────────────────────────

export const SEED_GROUPS: Group[] = [
  { id: 'g_business', name: 'Business English Pros', description: 'Meetings, emails, negotiations, interviews. Level up your work English together.', language: 'en', ownerId: 'u_emma', cover: 'from-amber-500 to-orange-700', imageUrl: SEED_IMG.group, visibility: 'public', memberCount: 2, createdAt: t(60 * 24 * 20) }
]

/** Who is a member of which seed group (owner is added on seed). */
export const SEED_GROUP_MEMBERS: { groupId: string; userId: string }[] = [
  { groupId: 'g_business', userId: 'u_priya' }
]

const days = (n: number): string => new Date(Date.now() + n * 24 * 60 * 60_000).toISOString()

export const SEED_CHALLENGES: Challenge[] = [
  { id: 'ch_streak30', title: '30-Day Speaking Streak', description: 'Speak out loud for at least 5 minutes every day for 30 days.', kind: 'streak', goal: 30, language: 'en', createdBy: 'u_emma', startsAt: t(60 * 24 * 6), endsAt: days(24), cover: 'from-rose-500 to-orange-600', imageUrl: SEED_IMG.challenge, participantCount: 1, createdAt: t(60 * 24 * 7) }
]

/** Seed participant progress so leaderboards have a real row. */
export const SEED_CHALLENGE_PROGRESS: { challengeId: string; userId: string; progress: number }[] = [
  { challengeId: 'ch_streak30', userId: 'u_priya', progress: 5 }
]
