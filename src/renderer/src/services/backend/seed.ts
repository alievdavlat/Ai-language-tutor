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

/** Real themed cover image (Pollinations Flux, keyless, deterministic by seed). */
const POLLI = (prompt: string, seed: number): string =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=450&seed=${seed}&nologo=true&model=flux`

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
  },
  {
    id: 'c_ielts7',
    teacherId: 'u_emma',
    title: 'IELTS Band 7 Intensive',
    description: 'Strategy + practice for all four IELTS skills, built around full mock exams and examiner-style feedback.',
    level: 'B2',
    targetLanguage: 'en',
    cover: 'from-rose-500 to-pink-700',
    thumbnailUrl: POLLI('IELTS exam preparation study desk, books and headphones', 11),
    pricing: { kind: 'free' },
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    hours: 24,
    publishedAt: t(60 * 24 * 7),
    capstone: 'Sit a full timed IELTS mock and review your band breakdown.'
  },
  {
    id: 'c_pronun',
    teacherId: 'u_emma',
    title: 'Pronunciation & Accent',
    description: 'Master English sounds, word stress and intonation with shadowing drills and minimal-pair practice.',
    level: 'A2',
    targetLanguage: 'en',
    cover: 'from-amber-500 to-orange-700',
    thumbnailUrl: POLLI('person speaking into microphone sound waves, clean studio', 12),
    pricing: { kind: 'free' },
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    hours: 10,
    publishedAt: t(60 * 24 * 5),
    capstone: 'Record a 2-minute monologue and score your pronunciation.'
  },
  {
    id: 'c_egiu',
    teacherId: 'u_emma',
    title: 'English Grammar in Use',
    description: 'A structured tour of core English grammar — tenses, articles, conditionals — with exercises after every unit.',
    level: 'A2',
    targetLanguage: 'en',
    cover: 'from-emerald-500 to-teal-700',
    thumbnailUrl: POLLI('open english grammar notebook with pen, warm light', 13),
    pricing: { kind: 'free' },
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    hours: 18,
    publishedAt: t(60 * 24 * 6),
    capstone: 'Pass the grammar mastery check covering every unit.'
  },
  {
    id: 'c_everyday',
    teacherId: 'u_emma',
    title: 'Everyday English Conversation',
    description: 'The phrases and confidence for daily life — shopping, travel, small talk and making friends.',
    level: 'A1',
    targetLanguage: 'en',
    cover: 'from-sky-500 to-blue-700',
    thumbnailUrl: POLLI('friends chatting at a cafe table, bright and friendly', 14),
    pricing: { kind: 'free' },
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    hours: 12,
    publishedAt: t(60 * 24 * 4),
    capstone: 'Hold a 5-minute everyday conversation with the AI tutor.'
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
