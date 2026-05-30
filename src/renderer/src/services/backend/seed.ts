/**
 * Seed data for the local backend so the app feels populated on first launch.
 * Replaced wholesale when a real Supabase backend is plugged in.
 */
import type {
  Course,
  LiveAnnouncement,
  LiveStream,
  Notif,
  PlatformUser,
  Post
} from '@shared/types'

const t = (mins = 0): string => new Date(Date.now() - mins * 60_000).toISOString()

export const SEED_USERS: PlatformUser[] = [
  { id: 'u_emma', name: 'Emma Carter', email: 'emma@speakai.app', role: 'teacher', avatarEmoji: '👩‍🏫', bio: 'Senior IELTS coach · 8 yrs', nativeLanguage: 'en', targetLanguage: 'es', createdAt: t(60 * 24 * 200), country: 'US' },
  { id: 'u_james', name: 'James Lee', email: 'james@speakai.app', role: 'teacher', avatarEmoji: '🧑‍🏫', bio: 'IELTS specialist · 8 yrs', nativeLanguage: 'en', targetLanguage: 'fr', createdAt: t(60 * 24 * 180), country: 'GB' },
  { id: 'u_marco', name: 'Marco Bianchi', email: 'marco@speakai.app', role: 'teacher', avatarEmoji: '🎤', bio: 'Pronunciation coach', nativeLanguage: 'it', targetLanguage: 'en', createdAt: t(60 * 24 * 150), country: 'IT' },
  { id: 'u_priya', name: 'Priya Sharma', email: 'priya@speakai.app', role: 'student', avatarEmoji: '📖', nativeLanguage: 'hi', targetLanguage: 'en', level: 'B1', createdAt: t(60 * 24 * 30), country: 'IN' },
  { id: 'u_wei', name: 'Wei Lin', email: 'wei@speakai.app', role: 'student', avatarEmoji: '🎯', nativeLanguage: 'zh', targetLanguage: 'en', level: 'B2', createdAt: t(60 * 24 * 60), country: 'CN' },
  { id: 'u_yui', name: 'Yui Tanaka', email: 'yui@speakai.app', role: 'student', avatarEmoji: '🌸', nativeLanguage: 'ja', targetLanguage: 'en', level: 'A2', createdAt: t(60 * 24 * 20), country: 'JP' }
]

export const SEED_COURSES: Course[] = [
  {
    id: 'c_ielts7',
    teacherId: 'u_james',
    title: 'IELTS Speaking Bootcamp',
    description: 'Band 7+ in 4 weeks · 24 lessons · with mock exam',
    level: 'B1',
    targetLanguage: 'en',
    cover: 'from-rose-500 to-pink-700',
    pricing: { kind: 'one-off', usd: 29 },
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    hours: 12,
    publishedAt: t(60 * 24 * 30),
    capstone: 'Full IELTS mock with band-7 portfolio review'
  },
  {
    id: 'c_everyday',
    teacherId: 'u_emma',
    title: 'Everyday Conversation',
    description: 'Confidence for daily situations — shopping, travel, dining',
    level: 'A2',
    targetLanguage: 'en',
    cover: 'from-sky-500 to-blue-700',
    pricing: { kind: 'free' },
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    hours: 8,
    publishedAt: t(60 * 24 * 60)
  },
  {
    id: 'c_business',
    teacherId: 'u_emma',
    title: 'Business English 101',
    description: 'Email, meetings, negotiations — get hired internationally',
    level: 'B1',
    targetLanguage: 'en',
    cover: 'from-violet-500 to-purple-700',
    pricing: { kind: 'sub', usdPerMo: 15 },
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    hours: 14,
    publishedAt: t(60 * 24 * 14)
  },
  {
    id: 'c_pronun',
    teacherId: 'u_marco',
    title: 'Pronunciation Mastery',
    description: 'Sound natural · drills · phoneme heatmap · accent reduction',
    level: 'A2',
    targetLanguage: 'en',
    cover: 'from-amber-500 to-orange-700',
    pricing: { kind: 'one-off', usd: 19 },
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    hours: 6,
    publishedAt: t(60 * 24 * 7)
  },
  {
    id: 'c_egiu',
    teacherId: 'u_emma',
    title: 'English Grammar in Use (coursebook)',
    description: 'Study a classic grammar textbook unit by unit — rules then exercises',
    level: 'B1',
    targetLanguage: 'en',
    cover: 'from-blue-600 to-blue-800',
    pricing: { kind: 'free' },
    rating: 0,
    reviewCount: 0,
    enrollmentCount: 0,
    hours: 10,
    publishedAt: t(60 * 24 * 90)
  }
]

export const SEED_POSTS: Post[] = [
  {
    id: 'p_1',
    authorId: 'u_emma',
    kind: 'study-session',
    text: 'Open IELTS Speaking Part 2 group · cue cards + 2-min talks · everyone welcome.',
    studySession: {
      topic: 'IELTS Speaking Part 2 group',
      language: 'en',
      level: 'B1',
      whenISO: t(-60 * 6),
      durationMin: 60,
      capacity: 8,
      joinedIds: ['u_priya', 'u_wei']
    },
    createdAt: t(15),
    likeCount: 24,
    commentCount: 8,
    reactions: { '🔥': 12, '🎯': 6, '👍': 4 }
  },
  {
    id: 'p_2',
    authorId: 'u_wei',
    kind: 'resource',
    text: 'How I memorize 20 words a day — my exact routine 👇',
    resource: { kind: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ', title: 'My vocab routine' },
    createdAt: t(60),
    likeCount: 142,
    commentCount: 31,
    reactions: { '👍': 88, '🎯': 30, '🧠': 18 },
    shareCount: 24
  },
  {
    id: 'p_3',
    authorId: 'u_james',
    kind: 'poll',
    text: 'Which IELTS Writing prep style works best for you?',
    poll: {
      question: 'Which IELTS Writing prep style works best for you?',
      options: [
        { id: 'a', label: 'Daily one short essay (250w)', votes: 84 },
        { id: 'b', label: 'Weekly long essay + teacher review', votes: 142 },
        { id: 'c', label: 'Sample answers + sentence patterns', votes: 56 },
        { id: 'd', label: 'AI examiner band-feedback loop', votes: 198 }
      ]
    },
    createdAt: t(60 * 3),
    likeCount: 88,
    commentCount: 41,
    reactions: { '🤔': 22, '👍': 60 }
  },
  {
    id: 'p_4',
    authorId: 'u_priya',
    kind: 'achievement',
    text: 'Hit a 30-day streak! 🔥 Three months ago I couldn\'t order coffee in English.',
    achievement: { title: '30-day streak', emoji: '🔥', description: '30 consecutive days · 720 XP · 4 mastered words/day average' },
    createdAt: t(60 * 8),
    likeCount: 120,
    commentCount: 18,
    reactions: { '🔥': 88, '👏': 24, '❤️': 32 }
  },
  {
    id: 'p_5',
    authorId: 'u_marco',
    kind: 'question',
    text: "What's the difference between 'I have been' and 'I had been' in everyday speech? I always confuse them when telling stories.",
    createdAt: t(60 * 12),
    likeCount: 18,
    commentCount: 24,
    reactions: { '🤔': 12, '👍': 4 }
  },
  {
    id: 'p_6',
    authorId: 'u_yui',
    kind: 'voice',
    text: 'My first ever 2-minute Part 2 attempt — be gentle in the comments 🙏',
    voice: {
      durationSec: 124,
      transcript: 'Today I will describe a memorable trip I took with my family to Kyoto last spring. We visited several temples...'
    },
    createdAt: t(60 * 18),
    likeCount: 34,
    commentCount: 12,
    reactions: { '🎯': 14, '👏': 10, '❤️': 8 }
  }
]

export const SEED_LIVE: LiveStream[] = [
  { id: 's_1', hostId: 'u_marco', title: 'Coffee chat · free talk', category: 'Just chatting', language: 'en', viewerCount: 124, startedAt: t(20), cover: 'from-amber-500 to-rose-700' },
  { id: 's_2', hostId: 'u_james', title: 'IELTS Part 2 practice room', category: 'IELTS', language: 'en', viewerCount: 412, startedAt: t(45), cover: 'from-rose-500 to-pink-700' },
  { id: 's_3', hostId: 'u_emma', title: 'Past tenses live workshop', category: 'Grammar', language: 'en', viewerCount: 286, startedAt: t(8), cover: 'from-violet-500 to-purple-700' }
]

export const SEED_ANNOUNCEMENTS: LiveAnnouncement[] = [
  { id: 'a_1', teacherId: 'u_emma', title: 'Mastering Past Tenses', body: 'Open live lesson · free for everyone · 7 PM tonight', whenISO: t(-60 * 6), cover: 'from-rose-500 to-pink-700' },
  { id: 'a_2', teacherId: 'u_james', title: 'IELTS Speaking Q&A', body: 'Bring your questions — band-by-band breakdown · Sat 14:00', whenISO: t(-60 * 24 * 3), cover: 'from-violet-500 to-purple-700' }
]

export const SEED_NOTIFS: Notif[] = [
  { id: 'n_1', userId: 'u_priya', type: 'social', title: 'Emma liked your post', body: '"How I memorize 20 words/day"', createdAt: t(5), read: false, link: '/community' },
  { id: 'n_2', userId: 'u_priya', type: 'learning', title: 'New badge unlocked!', body: 'You earned the 7-day streak badge.', createdAt: t(60), read: false, link: '/achievements' }
]
