/**
 * Seed Supabase with the same demo content the local mock backend ships
 * with. Idempotent (uses upsert on the primary key).
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
globalThis.WebSocket = ws

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const eq = l.indexOf('=')
      return [l.slice(0, eq).trim(), l.slice(eq + 1).trim()]
    })
)

// service_role bypasses RLS — required for seeding.
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

const t = (mins = 0) => new Date(Date.now() - mins * 60_000).toISOString()

const users = [
  { id: 'u_emma', name: 'Emma Carter', email: 'emma@speakai.app', role: 'teacher', avatar_emoji: '👩‍🏫', bio: 'Senior IELTS coach · 8 yrs', native_language: 'en', target_language: 'es', country: 'US' },
  { id: 'u_james', name: 'James Lee', email: 'james@speakai.app', role: 'teacher', avatar_emoji: '🧑‍🏫', bio: 'IELTS specialist · 8 yrs', native_language: 'en', target_language: 'fr', country: 'GB' },
  { id: 'u_marco', name: 'Marco Bianchi', email: 'marco@speakai.app', role: 'teacher', avatar_emoji: '🎤', bio: 'Pronunciation coach', native_language: 'it', target_language: 'en', country: 'IT' },
  { id: 'u_priya', name: 'Priya Sharma', email: 'priya@speakai.app', role: 'student', avatar_emoji: '📖', native_language: 'hi', target_language: 'en', level: 'B1', country: 'IN' },
  { id: 'u_wei', name: 'Wei Lin', email: 'wei@speakai.app', role: 'student', avatar_emoji: '🎯', native_language: 'zh', target_language: 'en', level: 'B2', country: 'CN' },
  { id: 'u_yui', name: 'Yui Tanaka', email: 'yui@speakai.app', role: 'student', avatar_emoji: '🌸', native_language: 'ja', target_language: 'en', level: 'A2', country: 'JP' }
]

const courses = [
  { id: 'c_ielts7', teacher_id: 'u_james', title: 'IELTS Speaking Bootcamp', description: 'Band 7+ in 4 weeks · 24 lessons · with mock exam', level: 'B1', target_language: 'en', cover: 'from-rose-500 to-pink-700', pricing: { kind: 'one-off', usd: 29 }, rating: 4.9, review_count: 312, enrollment_count: 4120, hours: 12, published_at: t(60 * 24 * 30), capstone: 'Full IELTS mock with band-7 portfolio review' },
  { id: 'c_everyday', teacher_id: 'u_emma', title: 'Everyday Conversation', description: 'Confidence for daily situations — shopping, travel, dining', level: 'A2', target_language: 'en', cover: 'from-sky-500 to-blue-700', pricing: { kind: 'free' }, rating: 4.8, review_count: 198, enrollment_count: 8420, hours: 8, published_at: t(60 * 24 * 60) },
  { id: 'c_business', teacher_id: 'u_emma', title: 'Business English 101', description: 'Email, meetings, negotiations — get hired internationally', level: 'B1', target_language: 'en', cover: 'from-violet-500 to-purple-700', pricing: { kind: 'sub', usdPerMo: 15 }, rating: 4.7, review_count: 142, enrollment_count: 2480, hours: 14, published_at: t(60 * 24 * 14) },
  { id: 'c_pronun', teacher_id: 'u_marco', title: 'Pronunciation Mastery', description: 'Sound natural · drills · phoneme heatmap · accent reduction', level: 'A2', target_language: 'en', cover: 'from-amber-500 to-orange-700', pricing: { kind: 'one-off', usd: 19 }, rating: 4.9, review_count: 88, enrollment_count: 1640, hours: 6, published_at: t(60 * 24 * 7) }
]

const posts = [
  { id: 'p_1', author_id: 'u_emma', kind: 'study-session', text: 'Open IELTS Speaking Part 2 group · cue cards + 2-min talks · everyone welcome.', study_session: { topic: 'IELTS Speaking Part 2 group', language: 'en', level: 'B1', whenISO: t(-60 * 6), durationMin: 60, capacity: 8, joinedIds: ['u_priya', 'u_wei'] }, created_at: t(15), like_count: 24, comment_count: 8, share_count: 0, reactions: { '🔥': 12, '🎯': 6, '👍': 4 } },
  { id: 'p_2', author_id: 'u_wei', kind: 'resource', text: 'How I memorize 20 words a day — my exact routine 👇', resource: { kind: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ', title: 'My vocab routine' }, created_at: t(60), like_count: 142, comment_count: 31, share_count: 24, reactions: { '👍': 88, '🎯': 30, '🧠': 18 } },
  { id: 'p_3', author_id: 'u_james', kind: 'poll', text: 'Which IELTS Writing prep style works best for you?', poll: { question: 'Which IELTS Writing prep style works best for you?', options: [{ id: 'a', label: 'Daily one short essay (250w)', votes: 84 }, { id: 'b', label: 'Weekly long essay + teacher review', votes: 142 }, { id: 'c', label: 'Sample answers + sentence patterns', votes: 56 }, { id: 'd', label: 'AI examiner band-feedback loop', votes: 198 }] }, created_at: t(60 * 3), like_count: 88, comment_count: 41, share_count: 0, reactions: { '🤔': 22, '👍': 60 } },
  { id: 'p_4', author_id: 'u_priya', kind: 'achievement', text: "Hit a 30-day streak! 🔥 Three months ago I couldn't order coffee in English.", achievement: { title: '30-day streak', emoji: '🔥', description: '30 consecutive days · 720 XP · 4 mastered words/day average' }, created_at: t(60 * 8), like_count: 120, comment_count: 18, share_count: 0, reactions: { '🔥': 88, '👏': 24, '❤️': 32 } },
  { id: 'p_5', author_id: 'u_marco', kind: 'question', text: "What's the difference between 'I have been' and 'I had been' in everyday speech? I always confuse them when telling stories.", created_at: t(60 * 12), like_count: 18, comment_count: 24, share_count: 0, reactions: { '🤔': 12, '👍': 4 } },
  { id: 'p_6', author_id: 'u_yui', kind: 'voice', text: 'My first ever 2-minute Part 2 attempt — be gentle in the comments 🙏', voice: { durationSec: 124, transcript: 'Today I will describe a memorable trip I took with my family to Kyoto last spring. We visited several temples...' }, created_at: t(60 * 18), like_count: 34, comment_count: 12, share_count: 0, reactions: { '🎯': 14, '👏': 10, '❤️': 8 } }
]

const liveStreams = [
  { id: 's_1', host_id: 'u_marco', title: 'Coffee chat · free talk', category: 'Just chatting', language: 'en', viewer_count: 124, started_at: t(20), cover: 'from-amber-500 to-rose-700' },
  { id: 's_2', host_id: 'u_james', title: 'IELTS Part 2 practice room', category: 'IELTS', language: 'en', viewer_count: 412, started_at: t(45), cover: 'from-rose-500 to-pink-700' },
  { id: 's_3', host_id: 'u_emma', title: 'Past tenses live workshop', category: 'Grammar', language: 'en', viewer_count: 286, started_at: t(8), cover: 'from-violet-500 to-purple-700' }
]

const announcements = [
  { id: 'a_1', teacher_id: 'u_emma', title: 'Mastering Past Tenses', body: 'Open live lesson · free for everyone · 7 PM tonight', when_iso: t(-60 * 6), cover: 'from-rose-500 to-pink-700' },
  { id: 'a_2', teacher_id: 'u_james', title: 'IELTS Speaking Q&A', body: 'Bring your questions — band-by-band breakdown · Sat 14:00', when_iso: t(-60 * 24 * 3), cover: 'from-violet-500 to-purple-700' }
]

const notifs = [
  { id: 'n_1', user_id: 'u_priya', type: 'social', title: 'Emma liked your post', body: '"How I memorize 20 words/day"', created_at: t(5), read: false, link: '/community' },
  { id: 'n_2', user_id: 'u_priya', type: 'learning', title: 'New badge unlocked!', body: 'You earned the 7-day streak badge.', created_at: t(60), read: false, link: '/achievements' }
]

async function upsert(table, rows) {
  process.stdout.write(`  ↑  ${table} (${rows.length}) ... `)
  const { error } = await sb.from(table).upsert(rows, { onConflict: 'id' })
  if (error) { process.stdout.write(`✗ ${error.message}\n`); throw error }
  process.stdout.write(`✓\n`)
}

await upsert('users', users)
await upsert('courses', courses)
await upsert('posts', posts)
await upsert('live_streams', liveStreams)
await upsert('live_announcements', announcements)
await upsert('notifications', notifs)
process.stdout.write('seed done\n')
