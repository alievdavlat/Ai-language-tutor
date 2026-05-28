/**
 * Run pending SQL migrations against the Supabase Postgres pooler.
 * Reads connection from .env.local. Idempotent (uses "create table if not exists").
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Load .env.local manually (no dotenv dep needed)
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'))
    .map((l) => {
      const eq = l.indexOf('=')
      return [l.slice(0, eq).trim(), l.slice(eq + 1).trim()]
    })
)

const { SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD, SUPABASE_REGION } = env
// Try direct connection first, fall back to pooler. Direct = port 5432 to db.<ref>.supabase.co.
const candidates = [
  `postgresql://postgres:${encodeURIComponent(SUPABASE_DB_PASSWORD)}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`,
  `postgresql://postgres.${SUPABASE_PROJECT_REF}:${encodeURIComponent(SUPABASE_DB_PASSWORD)}@aws-0-${SUPABASE_REGION}.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${SUPABASE_PROJECT_REF}:${encodeURIComponent(SUPABASE_DB_PASSWORD)}@aws-0-${SUPABASE_REGION}.pooler.supabase.com:6543/postgres`
]
let client = null
for (const conn of candidates) {
  try {
    const c = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
    await c.connect()
    client = c
    process.stdout.write(`▶  connected via ${conn.replace(/:[^:@]+@/, ':***@')}\n`)
    break
  } catch (err) {
    process.stdout.write(`   tried ${conn.replace(/:[^:@]+@/, ':***@')} — ${err.message}\n`)
  }
}
if (!client) throw new Error('Could not connect to Supabase')

const dir = join(ROOT, 'supabase', 'migrations')
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()

for (const f of files) {
  const sql = readFileSync(join(dir, f), 'utf8')
  process.stdout.write(`▶  ${f} ...\n`)
  try {
    await client.query(sql)
    process.stdout.write(`✓  ${f}\n`)
  } catch (err) {
    process.stdout.write(`✗  ${f}: ${err.message}\n`)
    throw err
  }
}

await client.end()
process.stdout.write('done\n')
