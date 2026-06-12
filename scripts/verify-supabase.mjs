/**
 * verify-supabase.mjs — READ-ONLY health check for the live Supabase project.
 * Confirms #11 (cloud DB) without mutating anything: connects, lists expected
 * tables, prints row counts, and shows the seeded courses. Run:
 *   node scripts/verify-supabase.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const env = {}
for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
  if (m && !line.trim().startsWith('#')) env[m[1]] = m[2]
}
const REF = env.SUPABASE_PROJECT_REF
const DB_PASSWORD = env.SUPABASE_DB_PASSWORD
if (!REF || !DB_PASSWORD) { console.error('Missing SUPABASE_PROJECT_REF / DB_PASSWORD'); process.exit(1) }

const EXPECTED = [
  'users', 'courses', 'units', 'lessons', 'enrollments', 'posts', 'likes', 'saves',
  'follows', 'reviews', 'groups', 'group_members', 'challenges', 'challenge_participants',
  'exam_attempts', 'vocab_items', 'dm_threads', 'dm_messages', 'media_assets',
  'activity_events', 'user_stats', 'notifications'
]

const REGION = env.SUPABASE_REGION || 'ap-south-1'
const CANDIDATES = [
  { label: 'direct', host: `db.${REF}.supabase.co`, port: 5432, user: 'postgres' },
  { label: 'pooler aws-1 (session)', host: `aws-1-${REGION}.pooler.supabase.com`, port: 5432, user: `postgres.${REF}` },
  { label: 'pooler aws-1 (txn)', host: `aws-1-${REGION}.pooler.supabase.com`, port: 6543, user: `postgres.${REF}` },
  { label: 'pooler aws-0 (session)', host: `aws-0-${REGION}.pooler.supabase.com`, port: 5432, user: `postgres.${REF}` }
]

async function connectAny() {
  for (const c of CANDIDATES) {
    const client = new pg.Client({
      host: c.host, port: c.port, user: c.user, password: DB_PASSWORD,
      database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 12000
    })
    try {
      process.stdout.write(`▶ trying ${c.label} (${c.host}:${c.port})… `)
      await client.connect()
      console.log('✓')
      return client
    } catch (e) {
      console.log(`✗ ${e.code || e.message}`)
      await client.end().catch(() => {})
    }
  }
  throw new Error('all connection candidates failed')
}

let client
try {
  client = await connectAny()
  console.log('✓ connected\n')

  const { rows: tbls } = await client.query(
    `select table_name from information_schema.tables where table_schema='public' order by table_name`
  )
  const present = new Set(tbls.map((r) => r.table_name))
  console.log(`Tables in public schema: ${present.size}`)
  const missing = EXPECTED.filter((t) => !present.has(t))
  console.log(missing.length ? `⚠ MISSING expected: ${missing.join(', ')}` : '✓ all expected platform tables present')

  console.log('\nRow counts:')
  for (const t of EXPECTED.filter((t) => present.has(t))) {
    const { rows } = await client.query(`select count(*)::int as n from public.${t}`)
    console.log(`  ${t.padEnd(24)} ${rows[0].n}`)
  }

  if (present.has('courses')) {
    const { rows } = await client.query(`select id, title, level, pricing from public.courses order by id`)
    console.log('\nCourses in cloud:')
    for (const c of rows) console.log(`  ${c.id.padEnd(14)} ${c.title}`)
  }
  console.log('\n✓ verify complete (read-only, nothing modified)')
} catch (e) {
  console.error('✗ Supabase verify FAILED:', e.message)
  process.exitCode = 1
} finally {
  if (client) await client.end().catch(() => {})
}
