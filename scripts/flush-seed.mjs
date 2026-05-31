/**
 * flush-seed.mjs — one-shot operational script (2026-05-31).
 *
 * Flushes the live Supabase project (all tables + storage objects) and seeds
 * exactly ONE fully-detailed, real instance of each core content type, with
 * REAL cover images (generated via Pollinations, uploaded to Supabase Storage —
 * no picsum, no placeholders).
 *
 * - DDL: adds image columns (thumbnail_url/banner_url/image_url) that the TS
 *   types already expect but migrations 0001/0002 never created.
 * - TRUNCATE every table.
 * - Empties storage buckets.
 * - Generates + uploads cover images, then inserts the single-real seed graph.
 *
 * Run:  node scripts/flush-seed.mjs
 * Reads credentials from .env.local (service role + DB password).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ── env ───────────────────────────────────────────────────────────────────
function loadEnv() {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
  const env = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2]
  }
  return env
}
const env = loadEnv()
const REF = env.SUPABASE_PROJECT_REF
const REGION = env.SUPABASE_REGION || 'ap-south-1'
const DB_PASSWORD = env.SUPABASE_DB_PASSWORD
const SUPABASE_URL = env.SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!REF || !DB_PASSWORD || !SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase credentials in .env.local'); process.exit(1)
}

const PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/uploads/seed`
const img = (name) => `${PUBLIC_BASE}/${name}.jpg`

// Canonical real cover images (filename → generation prompt + size).
const IMAGES = [
  { name: 'course-business', w: 800, h: 450, prompt: 'professional business english class, modern bright office, laptops and notebooks, warm natural light, cinematic, no text' },
  { name: 'course-business-banner', w: 1280, h: 420, prompt: 'wide banner of a modern business english training, people collaborating in a bright office, warm light, cinematic, no text' },
  { name: 'live-business', w: 640, h: 360, prompt: 'cozy online english livestream lesson, friendly teacher at desk with headset, warm lighting, no text' },
  { name: 'announce-masterclass', w: 1280, h: 420, prompt: 'english email writing masterclass announcement, laptop and coffee on a clean desk, warm soft light, no text' },
  { name: 'group-business', w: 480, h: 270, prompt: 'small friendly group of adult english learners studying together at a cafe table, warm, no text' },
  { name: 'challenge-streak', w: 480, h: 270, prompt: 'motivational 30 day streak calendar with a glowing flame, warm orange gradient, flat illustration, no text' },
  { name: 'lib-book', w: 800, h: 450, prompt: 'clean modern english grammar textbook cover, blue and white, minimal, no text' },
  { name: 'lib-audio', w: 600, h: 600, prompt: 'english learning podcast cover art, studio microphone, warm purple gradient, minimal, no text' }
]

// ── data (single real instance of each type) ────────────────────────────────
const NOW = Date.now()
const iso = (minsAgo = 0) => new Date(NOW - minsAgo * 60_000).toISOString()
const days = (d) => new Date(NOW + d * 86_400_000).toISOString()

const USERS = [
  { id: 'u_owner', name: 'Aziz Karimov', email: 'owner@speakai.app', role: 'admin', avatar_emoji: '👑', bio: 'Founder & platform administrator', native_language: 'uz', target_language: 'en', level: null, country: 'UZ', created_at: iso(60 * 24 * 120) },
  { id: 'u_emma', name: 'Emma Carter', email: 'teacher@speakai.app', role: 'teacher', avatar_emoji: '👩‍🏫', bio: 'Senior English coach · IELTS examiner · 8 yrs', native_language: 'en', target_language: 'en', level: 'C2', country: 'GB', created_at: iso(60 * 24 * 90) },
  { id: 'u_priya', name: 'Davron Aliyev', email: 'student@speakai.app', role: 'student', avatar_emoji: '🎯', bio: 'Learning English for university and work', native_language: 'uz', target_language: 'en', level: 'B1', country: 'UZ', created_at: iso(60 * 24 * 14) }
]

const COURSES = [
  { id: 'c_business', teacher_id: 'u_emma', title: 'Business English 101', description: 'Email, meetings, negotiations — communicate with confidence at work and get hired internationally.', level: 'B1', target_language: 'en', cover: 'from-violet-500 to-purple-700', thumbnail_url: img('course-business'), banner_url: img('course-business-banner'), pricing: { kind: 'free' }, rating: 5, review_count: 1, enrollment_count: 1, hours: 14, published_at: iso(60 * 24 * 14), capstone: 'Run a full mock client meeting and write the follow-up email.' }
]

const UNITS = [
  { id: 'u_business_1', course_id: 'c_business', index: 0, title: 'Unit 1 · Email & messaging', about: 'Professional tone in writing.' },
  { id: 'u_business_2', course_id: 'c_business', index: 1, title: 'Unit 2 · Meetings', about: 'Lead, interrupt politely and summarise.' }
]

// Lesson ids mirror src/renderer/src/services/content/curriculum.ts exactly so
// lessonContent.ts + the progress store resolve the same lessons in cloud mode.
const LESSONS = [
  { id: 'l_business_1_1', unit_id: 'u_business_1', index: 0, title: 'Email tone & structure', kind: 'video', video_url: 'https://www.youtube.com/watch?v=iCvmsMzlF7o', duration_min: 6, drip_days: 0 },
  { id: 'l_business_1_2', unit_id: 'u_business_1', index: 1, title: 'Practice: rewrite an email', kind: 'practice', video_url: null, duration_min: 6, drip_days: 0 },
  { id: 'l_business_1_3', unit_id: 'u_business_1', index: 2, title: 'Unit 1 checkpoint', kind: 'exam', video_url: null, duration_min: 5, drip_days: 0 },
  { id: 'l_business_2_1', unit_id: 'u_business_2', index: 0, title: 'Running a meeting', kind: 'video', video_url: 'https://www.youtube.com/watch?v=H14bBuluwB8', duration_min: 7, drip_days: 0 },
  { id: 'l_business_2_2', unit_id: 'u_business_2', index: 1, title: 'Unit 2 checkpoint', kind: 'exam', video_url: null, duration_min: 5, drip_days: 0 }
]

const ENROLLMENTS = [
  { user_id: 'u_priya', course_id: 'c_business', progress: 25, last_active_at: iso(60), enrolled_at: iso(60 * 24 * 10), completed_at: null }
]

const REVIEWS = [
  { id: 'rv_1', course_id: 'c_business', user_id: 'u_priya', rating: 5, text: 'Clear, practical lessons — my work emails improved in a week.', created_at: iso(60 * 24 * 5) }
]

const POSTS = [
  { id: 'p_1', author_id: 'u_emma', kind: 'study-session', text: 'Open Business English speaking room · meetings & negotiations · everyone welcome.', resource: null, poll: null, study_session: { topic: 'Business meetings practice', language: 'en', level: 'B1', whenISO: iso(-60 * 3), durationMin: 45, capacity: 8, joinedIds: ['u_priya'] }, achievement: null, voice: null, reactions: { '🔥': 2, '👍': 1 }, like_count: 3, comment_count: 0, share_count: 0, created_at: iso(30) }
]

const STREAMS = [
  { id: 's_1', host_id: 'u_emma', title: 'Business meetings · live workshop', category: 'Business', language: 'en', viewer_count: 0, started_at: iso(10), cover: 'from-violet-500 to-purple-700', image_url: img('live-business') }
]

const ANNOUNCEMENTS = [
  { id: 'a_1', teacher_id: 'u_emma', title: 'Business Email Masterclass', body: 'Free live class · write emails that get replies · this Saturday 18:00.', when_iso: days(3), cover: 'from-rose-500 to-pink-700', image_url: img('announce-masterclass') }
]

const NOTIFS = [
  { id: 'n_1', user_id: 'u_priya', type: 'learning', title: 'Welcome to SpeakAI', body: 'Start your first lesson in Business English 101.', link: '/courses', read: false, created_at: iso(20) }
]

const GROUPS = [
  { id: 'g_business', name: 'Business English Pros', description: 'Meetings, emails, negotiations, interviews. Level up your work English together.', language: 'en', owner_id: 'u_emma', cover: 'from-amber-500 to-orange-700', image_url: img('group-business'), visibility: 'public', member_count: 2, created_at: iso(60 * 24 * 20) }
]
const GROUP_MEMBERS = [
  { group_id: 'g_business', user_id: 'u_emma', role: 'owner', joined_at: iso(60 * 24 * 20) },
  { group_id: 'g_business', user_id: 'u_priya', role: 'member', joined_at: iso(60 * 24 * 8) }
]

const CHALLENGES = [
  { id: 'ch_streak30', title: '30-Day Speaking Streak', description: 'Speak out loud for at least 5 minutes every day for 30 days.', kind: 'streak', goal: 30, language: 'en', created_by: 'u_emma', starts_at: iso(60 * 24 * 6), ends_at: days(24), cover: 'from-rose-500 to-orange-600', image_url: img('challenge-streak'), participant_count: 1, created_at: iso(60 * 24 * 7) }
]
const CHALLENGE_PARTICIPANTS = [
  { challenge_id: 'ch_streak30', user_id: 'u_priya', progress: 5, completed_at: null, joined_at: iso(60 * 24 * 5) }
]

const VOCAB = [
  { id: 'v_1', user_id: 'u_priya', language: 'en', term: 'negotiate', translation: 'muzokara qilmoq', example: 'We need to negotiate the deadline.', deck: 'Business English', due: iso(0), state: 'new' },
  { id: 'v_2', user_id: 'u_priya', language: 'en', term: 'deadline', translation: 'muddat', example: 'The deadline is next Friday.', deck: 'Business English', due: iso(0), state: 'new' },
  { id: 'v_3', user_id: 'u_priya', language: 'en', term: 'invoice', translation: 'hisob-faktura', example: 'Please send the invoice by email.', deck: 'Business English', due: iso(0), state: 'new' }
]

const USER_STATS = [
  { user_id: 'u_priya', xp: 60, streak: 2, longest_streak: 2, last_active_day: new Date(NOW).toISOString().slice(0, 10), total_minutes: 45, words_learned: 3, lessons_completed: 1, daily_goal_min: 15, updated_at: iso(0) }
]

const JSONB = new Set(['pricing', 'resource', 'poll', 'study_session', 'achievement', 'voice', 'reactions', 'sections'])

// ── image generation + upload ───────────────────────────────────────────────
async function fetchPollination(prompt, w, h) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&model=flux&seed=42`
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const ctrl = new AbortController()
      const to = setTimeout(() => ctrl.abort(), 90_000)
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(to)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 1000) throw new Error('tiny image')
      return buf
    } catch (e) {
      console.log(`   · attempt ${attempt} failed: ${e.message}`)
      if (attempt === 3) return null
    }
  }
  return null
}

// ── Supabase Storage via REST (no supabase-js → avoids Node-20 WebSocket dep) ─
const SHEAD = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
async function storageList(bucket, prefix = '') {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
    method: 'POST', headers: { ...SHEAD, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, limit: 1000, sortBy: { column: 'name', order: 'asc' } })
  })
  if (!res.ok) throw new Error(`list ${bucket} HTTP ${res.status}`)
  return res.json()
}
async function storageRemove(bucket, prefixes) {
  if (!prefixes.length) return
  await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
    method: 'DELETE', headers: { ...SHEAD, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes })
  })
}
async function storageUpload(bucket, path, buf, contentType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST', headers: { ...SHEAD, 'Content-Type': contentType, 'x-upsert': 'true' }, body: buf
  })
  if (!res.ok) throw new Error(`upload HTTP ${res.status}: ${await res.text()}`)
}

async function flushAndUploadImages() {
  // Empty known buckets first (one level of folder recursion).
  for (const bucket of ['uploads', 'covers', 'avatars', 'clips', 'audio', 'pdfs']) {
    try {
      const list = await storageList(bucket)
      const paths = []
      for (const item of list ?? []) {
        if (item.id === null) {
          const sub = await storageList(bucket, item.name)
          for (const s of sub ?? []) paths.push(`${item.name}/${s.name}`)
        } else paths.push(item.name)
      }
      await storageRemove(bucket, paths)
      console.log(`   · flushed bucket ${bucket} (${paths.length} objects)`)
    } catch (e) { console.log(`   · bucket ${bucket}: ${e.message}`) }
  }
  // Generate + upload the real covers.
  for (const it of IMAGES) {
    process.stdout.write(`   · generating ${it.name} … `)
    const buf = await fetchPollination(it.prompt, it.w, it.h)
    if (!buf) { console.log('SKIPPED (gen failed)'); continue }
    try {
      await storageUpload('uploads', `seed/${it.name}.jpg`, buf, 'image/jpeg')
      console.log(`ok (${Math.round(buf.length / 1024)} KB)`)
    } catch (e) { console.log(`upload error: ${e.message}`) }
  }
}

// ── insert helper ─────────────────────────────────────────────────────────
function insertSQL(table, rows) {
  if (!rows.length) return []
  return rows.map((row) => {
    const cols = Object.keys(row)
    const vals = cols.map((c, i) => `$${i + 1}`)
    const params = cols.map((c) => (JSONB.has(c) && row[c] != null ? JSON.stringify(row[c]) : row[c]))
    return { text: `insert into public.${table} (${cols.map((c) => `"${c}"`).join(', ')}) values (${vals.join(', ')})`, params }
  })
}

const TABLES_IN_ORDER = [
  ['users', USERS], ['courses', COURSES], ['units', UNITS], ['lessons', LESSONS],
  ['enrollments', ENROLLMENTS], ['reviews', REVIEWS], ['posts', POSTS],
  ['live_streams', STREAMS], ['live_announcements', ANNOUNCEMENTS], ['notifications', NOTIFS],
  ['groups', GROUPS], ['group_members', GROUP_MEMBERS], ['challenges', CHALLENGES],
  ['challenge_participants', CHALLENGE_PARTICIPANTS], ['vocab_items', VOCAB], ['user_stats', USER_STATS]
]

const ALL_TABLES = [
  'users', 'courses', 'units', 'lessons', 'enrollments', 'posts', 'likes', 'saves', 'follows',
  'live_streams', 'live_announcements', 'notifications', 'reviews', 'groups', 'group_members',
  'challenges', 'challenge_participants', 'exam_attempts', 'vocab_items', 'dm_threads',
  'dm_messages', 'media_assets', 'activity_events', 'user_stats'
]

const DDL = `
alter table public.courses            add column if not exists thumbnail_url text;
alter table public.courses            add column if not exists banner_url    text;
alter table public.live_streams       add column if not exists image_url     text;
alter table public.live_announcements add column if not exists image_url     text;
alter table public.groups             add column if not exists image_url     text;
alter table public.challenges         add column if not exists image_url     text;
`

async function main() {
  // Direct connection (works here); pooler fallback would be
  // aws-1-${REGION}.pooler.supabase.com with user postgres.${REF}.
  const client = new pg.Client({
    host: `db.${REF}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  })

  console.log('▶ connecting to Postgres (direct)…')
  await client.connect()
  console.log('  connected.')

  console.log('▶ applying image-column DDL (migration 0003)…')
  await client.query(DDL)
  console.log('  columns ensured.')

  console.log('▶ TRUNCATE all tables…')
  await client.query(`truncate table ${ALL_TABLES.map((t) => `public.${t}`).join(', ')} restart identity cascade`)
  console.log('  all tables emptied.')

  if (process.argv.includes('--no-images')) {
    console.log('▶ skipping storage flush + image gen (--no-images)')
  } else {
    console.log('▶ flushing storage + generating real cover images…')
    await flushAndUploadImages()
  }

  console.log('▶ seeding single-real graph…')
  for (const [table, rows] of TABLES_IN_ORDER) {
    for (const q of insertSQL(table, rows)) await client.query(q.text, q.params)
    console.log(`  + ${table}: ${rows.length}`)
  }

  await client.end()
  console.log('\n✅ done — Supabase flushed and seeded with 1 real instance of each type.')
}

main().catch((e) => { console.error('\n❌ flush-seed failed:', e); process.exit(1) })
