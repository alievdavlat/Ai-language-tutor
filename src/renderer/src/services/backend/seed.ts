/**
 * Seed data for the local backend so the app feels populated on first launch.
 *
 * 2026-05-31 — flushed to a SINGLE, fully-detailed REAL instance of each type
 * (1 owner/admin · 1 teacher · 1 student · 1 course · 1 post · 1 live · 1
 * announcement · 1 notification). Real cover images (Supabase Storage, no
 * picsum). Mirrors the cloud seed written by scripts/flush-seed.mjs — same ids,
 * same images — so local and Supabase behave identically.
 */
import type {
  Course,
  LiveAnnouncement,
  LiveStream,
  Notif,
  PlatformUser,
  Post
} from '@shared/types'
import { SEED_IMG } from './seed-images'

const t = (mins = 0): string => new Date(Date.now() - mins * 60_000).toISOString()

export const SEED_USERS: PlatformUser[] = [
  { id: 'u_owner', name: 'Aziz Karimov', email: 'owner@speakai.app', role: 'admin', avatarEmoji: '👑', bio: 'Founder & platform administrator', nativeLanguage: 'uz', targetLanguage: 'en', createdAt: t(60 * 24 * 120), country: 'UZ' },
  { id: 'u_emma', name: 'Emma Carter', email: 'teacher@speakai.app', role: 'teacher', avatarEmoji: '👩‍🏫', bio: 'Senior English coach · IELTS examiner · 8 yrs', nativeLanguage: 'en', targetLanguage: 'en', level: 'C2', createdAt: t(60 * 24 * 90), country: 'GB' },
  { id: 'u_priya', name: 'Davron Aliyev', email: 'student@speakai.app', role: 'student', avatarEmoji: '🎯', bio: 'Learning English for university and work', nativeLanguage: 'uz', targetLanguage: 'en', level: 'B1', createdAt: t(60 * 24 * 14), country: 'UZ' }
]

export const SEED_COURSES: Course[] = [
  {
    id: 'c_business',
    teacherId: 'u_emma',
    title: 'Business English 101',
    description: 'Email, meetings, negotiations — communicate with confidence at work and get hired internationally.',
    level: 'B1',
    targetLanguage: 'en',
    cover: 'from-violet-500 to-purple-700',
    thumbnailUrl: SEED_IMG.courseThumb,
    bannerUrl: SEED_IMG.courseBanner,
    pricing: { kind: 'free' },
    rating: 5,
    reviewCount: 1,
    enrollmentCount: 1,
    hours: 14,
    publishedAt: t(60 * 24 * 14),
    capstone: 'Run a full mock client meeting and write the follow-up email.'
  }
]

export const SEED_POSTS: Post[] = [
  {
    id: 'p_1',
    authorId: 'u_emma',
    kind: 'study-session',
    text: 'Open Business English speaking room · meetings & negotiations · everyone welcome.',
    studySession: {
      topic: 'Business meetings practice',
      language: 'en',
      level: 'B1',
      whenISO: t(-60 * 3),
      durationMin: 45,
      capacity: 8,
      joinedIds: ['u_priya']
    },
    createdAt: t(30),
    likeCount: 3,
    commentCount: 0,
    reactions: { '🔥': 2, '👍': 1 }
  }
]

export const SEED_LIVE: LiveStream[] = [
  { id: 's_1', hostId: 'u_emma', title: 'Business meetings · live workshop', category: 'Business', language: 'en', viewerCount: 0, startedAt: t(10), cover: 'from-violet-500 to-purple-700', imageUrl: SEED_IMG.live }
]

export const SEED_ANNOUNCEMENTS: LiveAnnouncement[] = [
  { id: 'a_1', teacherId: 'u_emma', title: 'Business Email Masterclass', body: 'Free live class · write emails that get replies · this Saturday 18:00.', whenISO: new Date(Date.now() + 3 * 86_400_000).toISOString(), cover: 'from-rose-500 to-pink-700', imageUrl: SEED_IMG.announce }
]

export const SEED_NOTIFS: Notif[] = [
  { id: 'n_1', userId: 'u_priya', type: 'learning', kind: 'announcement', title: 'Welcome to SpeakAI', body: 'Start your first lesson in Business English 101.', createdAt: t(20), read: false, link: '/courses' }
]
