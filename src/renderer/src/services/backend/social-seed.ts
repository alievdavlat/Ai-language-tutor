/**
 * Seed data for the social slice (tutors, tutor reviews, feedback submissions,
 * peer reviews). Tutor + feedback authors reuse the canonical SEED_USERS ids
 * from seed.ts so avatars/names resolve consistently across the app.
 *
 * Replaced wholesale when the Supabase backend is plugged in (its own tables
 * seed independently).
 */
import type { Challenge, FeedbackSubmission, Group, PeerReview, TutorProfile, TutorReview } from '@shared/types'

const t = (mins = 0): string => new Date(Date.now() - mins * 60_000).toISOString()

// Common weekly availability templates (weekday: 0=Sun … 6=Sat).
const WEEKDAY_EVENINGS = [
  { weekday: 1, times: ['18:00', '19:00', '20:00'] },
  { weekday: 2, times: ['18:00', '19:00', '20:00'] },
  { weekday: 3, times: ['18:00', '19:00', '20:00'] },
  { weekday: 4, times: ['18:00', '19:00'] }
]
const WEEKEND_MORNINGS = [
  { weekday: 6, times: ['09:00', '10:00', '11:00', '14:00'] },
  { weekday: 0, times: ['10:00', '11:00', '15:00'] }
]
const FLEXIBLE = [
  { weekday: 1, times: ['08:00', '12:00', '17:00', '21:00'] },
  { weekday: 3, times: ['08:00', '12:00', '17:00', '21:00'] },
  { weekday: 5, times: ['08:00', '12:00', '17:00', '21:00'] }
]

export const SEED_TUTORS: TutorProfile[] = [
  {
    id: 'tut_james',
    userId: 'u_james',
    name: 'James Lee',
    flag: '🇬🇧',
    headline: 'IELTS specialist · band 7+ in weeks',
    bio: 'Cambridge-certified (CELTA + DELTA). 8 years preparing students for IELTS Academic & General. I run mock speaking tests with band-by-band feedback.',
    teaches: ['English'],
    speaks: [{ language: 'English', level: 'Native' }, { language: 'French', level: 'B2' }],
    kind: 'pro',
    hourlyRateUsd: 32,
    rating: 4.9,
    reviewCount: 248,
    lessonsGiven: 3120,
    studentsCount: 412,
    videoIntroUrl: 'https://youtu.be/dQw4w9WgXcQ',
    trial: true,
    online: true,
    tags: ['IELTS', 'Speaking', 'Exam prep'],
    cover: 'from-rose-500 to-pink-700',
    availability: WEEKDAY_EVENINGS,
    avatarEmoji: '🧑‍🏫',
    createdAt: t(60 * 24 * 180)
  },
  {
    id: 'tut_emma',
    userId: 'u_emma',
    name: 'Emma Carter',
    flag: '🇺🇸',
    headline: 'Business English & interviews',
    bio: 'Ex-recruiter turned coach. I help professionals nail meetings, emails and job interviews. Conversational, practical, zero textbook drudgery.',
    teaches: ['English'],
    speaks: [{ language: 'English', level: 'Native' }, { language: 'Spanish', level: 'C1' }],
    kind: 'pro',
    hourlyRateUsd: 38,
    rating: 4.95,
    reviewCount: 312,
    lessonsGiven: 4210,
    studentsCount: 530,
    videoIntroUrl: 'https://youtu.be/dQw4w9WgXcQ',
    trial: true,
    online: false,
    tags: ['Business', 'Interviews', 'Conversation'],
    cover: 'from-violet-500 to-purple-700',
    availability: WEEKDAY_EVENINGS,
    avatarEmoji: '👩‍🏫',
    createdAt: t(60 * 24 * 200)
  },
  {
    id: 'tut_marco',
    userId: 'u_marco',
    name: 'Marco Bianchi',
    flag: '🇮🇹',
    headline: 'Pronunciation & accent reduction',
    bio: 'Phonetics nerd. We drill the exact sounds that trip up your accent with a phoneme heatmap. Great for presenters and call-centre pros.',
    teaches: ['English', 'Italian'],
    speaks: [{ language: 'Italian', level: 'Native' }, { language: 'English', level: 'C2' }],
    kind: 'pro',
    hourlyRateUsd: 26,
    rating: 4.8,
    reviewCount: 96,
    lessonsGiven: 1480,
    studentsCount: 210,
    trial: false,
    online: true,
    tags: ['Pronunciation', 'Accent', 'Phonetics'],
    cover: 'from-amber-500 to-orange-700',
    availability: FLEXIBLE,
    avatarEmoji: '🎤',
    createdAt: t(60 * 24 * 150)
  },
  {
    id: 'tut_yui',
    userId: 'u_yui',
    name: 'Yui Tanaka',
    flag: '🇯🇵',
    headline: 'Friendly conversation partner',
    bio: 'Patient community tutor — perfect for beginners who feel shy. We just chat about daily life and I gently fix mistakes as we go.',
    teaches: ['English', 'Japanese'],
    speaks: [{ language: 'Japanese', level: 'Native' }, { language: 'English', level: 'B2' }],
    kind: 'community',
    hourlyRateUsd: 9,
    rating: 4.7,
    reviewCount: 54,
    lessonsGiven: 380,
    studentsCount: 120,
    trial: true,
    online: true,
    tags: ['Conversation', 'Beginners', 'Kids'],
    cover: 'from-sky-500 to-blue-700',
    availability: WEEKEND_MORNINGS,
    avatarEmoji: '🌸',
    createdAt: t(60 * 24 * 40)
  },
  {
    id: 'tut_wei',
    userId: 'u_wei',
    name: 'Wei Lin',
    flag: '🇨🇳',
    headline: 'Study-buddy & grammar drills',
    bio: 'I passed IELTS 7.5 last year and love helping others get there. Affordable practice, lots of homework if you want it!',
    teaches: ['English', 'Chinese'],
    speaks: [{ language: 'Chinese', level: 'Native' }, { language: 'English', level: 'C1' }],
    kind: 'community',
    hourlyRateUsd: 7,
    rating: 4.6,
    reviewCount: 38,
    lessonsGiven: 240,
    studentsCount: 88,
    trial: true,
    online: false,
    tags: ['Grammar', 'IELTS', 'Conversation'],
    cover: 'from-emerald-500 to-teal-700',
    availability: FLEXIBLE,
    avatarEmoji: '🎯',
    createdAt: t(60 * 24 * 30)
  },
  {
    id: 'tut_priya',
    userId: 'u_priya',
    name: 'Priya Sharma',
    flag: '🇮🇳',
    headline: 'Everyday English, super affordable',
    bio: 'Community tutor focused on confidence. We role-play real situations — ordering food, phone calls, small talk. No judgement, ever.',
    teaches: ['English', 'Hindi'],
    speaks: [{ language: 'Hindi', level: 'Native' }, { language: 'English', level: 'C1' }],
    kind: 'community',
    hourlyRateUsd: 6,
    rating: 4.8,
    reviewCount: 71,
    lessonsGiven: 510,
    studentsCount: 140,
    trial: false,
    online: true,
    tags: ['Conversation', 'Roleplay', 'Beginners'],
    cover: 'from-fuchsia-500 to-rose-700',
    availability: WEEKEND_MORNINGS,
    avatarEmoji: '📖',
    createdAt: t(60 * 24 * 25)
  }
]

export const SEED_TUTOR_REVIEWS: TutorReview[] = [
  { id: 'trv_1', tutorId: 'tut_james', studentId: 'u_priya', rating: 5, text: 'Went from band 6 to 7.5 in a month. His mock tests are gold.', createdAt: t(60 * 24 * 5) },
  { id: 'trv_2', tutorId: 'tut_james', studentId: 'u_wei', rating: 5, text: 'Very structured. Always knows exactly what to fix next.', createdAt: t(60 * 24 * 12) },
  { id: 'trv_3', tutorId: 'tut_emma', studentId: 'u_yui', rating: 5, text: 'Got the job! Her interview practice was spot on.', createdAt: t(60 * 24 * 3) },
  { id: 'trv_4', tutorId: 'tut_marco', studentId: 'u_priya', rating: 5, text: 'My /θ/ and /r/ finally sound right. The heatmap is brilliant.', createdAt: t(60 * 24 * 8) },
  { id: 'trv_5', tutorId: 'tut_yui', studentId: 'u_wei', rating: 5, text: 'So patient and kind — perfect for nervous beginners.', createdAt: t(60 * 24 * 2) }
]

export const SEED_FEEDBACK: FeedbackSubmission[] = [
  {
    id: 'fb_1',
    authorId: 'u_wei',
    kind: 'writing',
    topic: 'IELTS Task 2 — Do the advantages of remote work outweigh the disadvantages?',
    content:
      'In recent years, working from home has become increasingly common. While some argue it reduces productivity, I believe the advantages clearly outweigh the disadvantages. Firstly, remote work saves commuting time...',
    language: 'en',
    level: 'B2',
    reward: 15,
    status: 'open',
    reviewCount: 0,
    createdAt: t(60 * 3)
  },
  {
    id: 'fb_2',
    authorId: 'u_marco',
    kind: 'speaking',
    topic: 'Describe a city you would like to visit (Part 2)',
    content:
      "I would like to talk about Kyoto, a city in Japan that I've always wanted to visit. The main reason is its incredible blend of tradition and modern life...",
    audioUrl: '',
    language: 'en',
    level: 'B1',
    reward: 20,
    status: 'open',
    reviewCount: 0,
    createdAt: t(60 * 5)
  },
  {
    id: 'fb_3',
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
  },
  {
    id: 'fb_4',
    authorId: 'u_yui',
    kind: 'speaking',
    topic: 'Tell me about your hometown',
    content:
      'My hometown is a small town near Osaka. It is famous for its beautiful river and a very old temple that people visit every spring...',
    audioUrl: '',
    language: 'en',
    level: 'A2',
    reward: 20,
    status: 'open',
    reviewCount: 0,
    createdAt: t(60 * 48)
  }
]

export const SEED_PEER_REVIEWS: PeerReview[] = [
  {
    id: 'pr_seed_1',
    submissionId: 'fb_3',
    reviewerId: 'u_emma',
    rating: 5,
    text: 'Great structure and tone — very professional. Watch the article use in paragraph 2 ("a faulty product" vs "the product").',
    thanked: false,
    createdAt: t(60 * 20)
  }
]

// ─── Groups / clubs + challenges (seeded into the core backend on first run via
//     ensureCommunitySeed() — the local Db ships these empty). ─────────────────

export const SEED_GROUPS: Group[] = [
  { id: 'g_ielts', name: 'IELTS Warriors', description: 'Daily band-7 grind — share essays, swap mock partners, post your scores.', language: 'en', ownerId: 'u_james', cover: 'from-rose-500 to-pink-700', imageUrl: 'https://picsum.photos/seed/grp-ielts/480/270', visibility: 'public', memberCount: 0, createdAt: t(60 * 24 * 90) },
  { id: 'g_speak', name: 'Daily Speaking Club', description: 'A safe room to speak out loud every day. Voice notes welcome, zero judgement.', language: 'en', ownerId: 'u_emma', cover: 'from-sky-500 to-blue-700', imageUrl: 'https://picsum.photos/seed/grp-speak/480/270', visibility: 'public', memberCount: 0, createdAt: t(60 * 24 * 120) },
  { id: 'g_grammar', name: 'Grammar Nerds', description: 'For people who actually enjoy the subjunctive. Ask anything.', language: 'en', ownerId: 'u_marco', cover: 'from-violet-500 to-purple-700', imageUrl: 'https://picsum.photos/seed/grp-grammar/480/270', visibility: 'public', memberCount: 0, createdAt: t(60 * 24 * 60) },
  { id: 'g_business', name: 'Business English Pros', description: 'Meetings, emails, negotiations, interviews. Level up your work English.', language: 'en', ownerId: 'u_emma', cover: 'from-amber-500 to-orange-700', imageUrl: 'https://picsum.photos/seed/grp-biz/480/270', visibility: 'public', memberCount: 0, createdAt: t(60 * 24 * 30) },
  { id: 'g_jp', name: 'Japan ↔ English Exchange', description: 'Language exchange between English and Japanese learners. Tandem partners inside.', language: 'en', ownerId: 'u_yui', cover: 'from-emerald-500 to-teal-700', imageUrl: 'https://picsum.photos/seed/grp-jp/480/270', visibility: 'public', memberCount: 0, createdAt: t(60 * 24 * 45) }
]

/** Who is a member of which seed group (gives myGroups / members real data).
 *  The group owner auto-joins on upsert, so these are the *other* members. The
 *  real member count = these rows + the owner (never the old vanity number). */
export const SEED_GROUP_MEMBERS: { groupId: string; userId: string }[] = [
  { groupId: 'g_ielts', userId: 'u_wei' },
  { groupId: 'g_ielts', userId: 'u_priya' },
  { groupId: 'g_ielts', userId: 'u_yui' },
  { groupId: 'g_speak', userId: 'u_priya' },
  { groupId: 'g_speak', userId: 'u_yui' },
  { groupId: 'g_speak', userId: 'u_marco' },
  { groupId: 'g_grammar', userId: 'u_priya' },
  { groupId: 'g_grammar', userId: 'u_james' },
  { groupId: 'g_business', userId: 'u_wei' },
  { groupId: 'g_business', userId: 'u_james' },
  { groupId: 'g_jp', userId: 'u_yui' },
  { groupId: 'g_jp', userId: 'u_wei' }
]

/** A couple of opening posts per group so a fresh group feed isn't empty.
 *  Authored by real seed members; `kind`/`text` only (no rich payload). */
export const SEED_GROUP_POSTS: { groupId: string; authorId: string; kind: 'text' | 'question'; text: string }[] = [
  { groupId: 'g_ielts', authorId: 'u_james', kind: 'text', text: 'Welcome to IELTS Warriors! Drop your target band below and one thing you struggle with. Mine: Writing Task 2 coherence.' },
  { groupId: 'g_ielts', authorId: 'u_wei', kind: 'question', text: 'For Speaking Part 2, how long do you spend on the 1-minute prep? I keep running out of points.' },
  { groupId: 'g_speak', authorId: 'u_emma', kind: 'text', text: 'Reminder: post one 30-second voice note today. No editing, no shame — just speak. 🎙️' },
  { groupId: 'g_grammar', authorId: 'u_marco', kind: 'question', text: 'Quick poll in your head: "If I were you" vs "If I was you" — which do you use, and do you know why?' }
]

/** Seed chat so each group room has a little life on first open. */
export const SEED_GROUP_MESSAGES: { groupId: string; senderId: string; text: string }[] = [
  { groupId: 'g_ielts', senderId: 'u_priya', text: 'Anyone up for a mock speaking session this weekend?' },
  { groupId: 'g_ielts', senderId: 'u_wei', text: 'I am! Saturday morning works for me.' },
  { groupId: 'g_ielts', senderId: 'u_james', text: 'Count me in as the examiner 👍' },
  { groupId: 'g_speak', senderId: 'u_yui', text: 'Just posted my voice note — be gentle 😅' },
  { groupId: 'g_speak', senderId: 'u_marco', text: 'Sounded great! Your intonation is improving a lot.' }
]

const days = (n: number): string => new Date(Date.now() + n * 24 * 60 * 60_000).toISOString()

export const SEED_CHALLENGES: Challenge[] = [
  { id: 'ch_streak30', title: '30-Day Speaking Streak', description: 'Speak out loud for at least 5 minutes every day for 30 days.', kind: 'streak', goal: 30, language: 'en', createdBy: 'u_emma', startsAt: t(60 * 24 * 6), endsAt: days(24), cover: 'from-rose-500 to-orange-600', imageUrl: 'https://picsum.photos/seed/ch-streak/480/270', participantCount: 1240, createdAt: t(60 * 24 * 7) },
  { id: 'ch_words500', title: 'Learn 500 Words', description: 'Master 500 new words this month with spaced repetition.', kind: 'words', goal: 500, language: 'en', createdBy: 'u_james', startsAt: t(60 * 24 * 10), endsAt: days(20), cover: 'from-violet-500 to-fuchsia-600', imageUrl: 'https://picsum.photos/seed/ch-words/480/270', participantCount: 870, createdAt: t(60 * 24 * 10) },
  { id: 'ch_minutes600', title: '10-Hour Listening Sprint', description: 'Rack up 600 minutes of listening practice in two weeks.', kind: 'minutes', goal: 600, language: 'en', createdBy: 'u_marco', startsAt: t(60 * 24 * 3), endsAt: days(11), cover: 'from-sky-500 to-cyan-600', imageUrl: 'https://picsum.photos/seed/ch-listen/480/270', participantCount: 540, createdAt: t(60 * 24 * 4) }
]

/** Seed participant progress so leaderboards have real rows. */
export const SEED_CHALLENGE_PROGRESS: { challengeId: string; userId: string; progress: number }[] = [
  { challengeId: 'ch_streak30', userId: 'u_priya', progress: 22 },
  { challengeId: 'ch_streak30', userId: 'u_wei', progress: 30 },
  { challengeId: 'ch_streak30', userId: 'u_yui', progress: 14 },
  { challengeId: 'ch_streak30', userId: 'u_marco', progress: 9 },
  { challengeId: 'ch_words500', userId: 'u_wei', progress: 410 },
  { challengeId: 'ch_words500', userId: 'u_priya', progress: 260 },
  { challengeId: 'ch_words500', userId: 'u_yui', progress: 180 },
  { challengeId: 'ch_minutes600', userId: 'u_yui', progress: 520 },
  { challengeId: 'ch_minutes600', userId: 'u_wei', progress: 300 }
]
