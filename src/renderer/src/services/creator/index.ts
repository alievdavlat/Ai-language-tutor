/**
 * Creator Studio service — the all-role content authoring layer.
 *
 * This is the piece the multi-session plan called "Creator Studio: all-role
 * content builder + seed/default content + bulk import". It does NOT introduce
 * a new store — it composes the existing seams:
 *   - `backend`  (courses / units / lessons / vocab)  — shared platform data
 *   - `studio`   (interactive TED-Ed lessons)         — teacher slice
 * so anything authored here shows up in Courses / Classroom / Vocabulary /
 * the lesson player immediately, and swaps to Supabase when the backend does.
 */
import type { Course, Lesson, TargetLanguage, Unit } from '@shared/types'
import { backend } from '../backend/useBackend'
import { studio } from '../studio/store'
import { newVocabItem } from '../study/fsrs'

const newId = (p: string): string => `${p}_${Math.random().toString(36).slice(2, 10)}`
const SEED_FLAG = 'speakai.creator.seeded.v1'

function me(): string {
  return backend.currentUserId() ?? 'u_emma'
}

// ─── Overview ────────────────────────────────────────────────────────────────

export interface CreatorOverview {
  courses: number
  publishedCourses: number
  lessons: number
  vocab: number
  drafts: number
}

export async function overview(): Promise<CreatorOverview> {
  const owner = me()
  const [courses, lessons, vocab] = await Promise.all([
    backend.myCourses(owner),
    studio.listLessons(owner),
    backend.listVocab(owner)
  ])
  return {
    courses: courses.length,
    publishedCourses: courses.filter((c) => !!c.publishedAt).length,
    lessons: lessons.length,
    vocab: vocab.length,
    drafts: courses.filter((c) => !c.publishedAt).length + lessons.filter((l) => l.status === 'draft').length
  }
}

// ─── Bulk import ─────────────────────────────────────────────────────────────

const COVERS = ['from-sky-500 to-blue-700', 'from-emerald-500 to-teal-700', 'from-violet-500 to-purple-700', 'from-amber-500 to-orange-700', 'from-rose-500 to-pink-700']
const pickCover = (seed: string): string => COVERS[Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0)) % COVERS.length]

interface ImportCourse {
  title: string
  description?: string
  level?: string
  targetLanguage?: TargetLanguage
  cover?: string
  thumbnailUrl?: string
  bannerUrl?: string
  pricing?: Course['pricing']
  hours?: number
  publish?: boolean
  units?: { title: string; about?: string; lessons?: { title: string; kind?: Lesson['kind']; videoUrl?: string; durationMin?: number }[] }[]
}
interface ImportVocab {
  term: string
  translation: string
  example?: string
  deck?: string
  language?: TargetLanguage
}
export interface BulkPayload {
  courses?: ImportCourse[]
  vocab?: ImportVocab[]
}

export interface ImportResult {
  courses: number
  units: number
  lessons: number
  vocab: number
  errors: string[]
}

/** Create courses (with units + lessons) and vocab items from a JSON payload. */
export async function bulkImport(payload: BulkPayload, language: TargetLanguage): Promise<ImportResult> {
  const owner = me()
  const res: ImportResult = { courses: 0, units: 0, lessons: 0, vocab: 0, errors: [] }
  const nowMs = Date.now()

  for (const [i, c] of (payload.courses ?? []).entries()) {
    try {
      if (!c.title?.trim()) throw new Error('missing title')
      const courseId = newId('course')
      const course: Course = {
        id: courseId,
        teacherId: owner,
        title: c.title.trim(),
        description: c.description?.trim() || '',
        level: c.level || 'A1–A2',
        targetLanguage: c.targetLanguage || language,
        cover: c.cover || pickCover(c.title),
        thumbnailUrl: c.thumbnailUrl,
        bannerUrl: c.bannerUrl,
        pricing: c.pricing || { kind: 'free' },
        rating: 0,
        reviewCount: 0,
        enrollmentCount: 0,
        hours: c.hours ?? Math.max(1, (c.units?.length ?? 1) * 2),
        publishedAt: c.publish ? new Date(nowMs).toISOString() : undefined
      }
      await backend.upsertCourse(course)
      res.courses += 1

      for (const [ui, u] of (c.units ?? []).entries()) {
        const unit: Unit = { id: newId('unit'), courseId, index: ui, title: u.title || `Unit ${ui + 1}`, about: u.about }
        await backend.upsertUnit(unit)
        res.units += 1
        for (const [li, l] of (u.lessons ?? []).entries()) {
          const lesson: Lesson = {
            id: newId('lesson'),
            unitId: unit.id,
            index: li,
            title: l.title || `Lesson ${li + 1}`,
            kind: l.kind || 'video',
            videoUrl: l.videoUrl,
            durationMin: l.durationMin
          }
          await backend.upsertLesson(lesson)
          res.lessons += 1
        }
      }
    } catch (e) {
      res.errors.push(`Course #${i + 1}: ${e instanceof Error ? e.message : 'failed'}`)
    }
  }

  for (const [i, v] of (payload.vocab ?? []).entries()) {
    try {
      if (!v.term?.trim() || !v.translation?.trim()) throw new Error('term & translation required')
      await backend.upsertVocab(newVocabItem({
        id: newId('vocab'),
        userId: owner,
        language: v.language || language,
        term: v.term.trim(),
        translation: v.translation.trim(),
        example: v.example,
        deck: v.deck,
        nowMs
      }))
      res.vocab += 1
    } catch (e) {
      res.errors.push(`Vocab #${i + 1}: ${e instanceof Error ? e.message : 'failed'}`)
    }
  }

  return res
}

/** Parse + validate a raw JSON string into a BulkPayload. Throws on bad JSON. */
export function parsePayload(raw: string): BulkPayload {
  const data = JSON.parse(raw) as unknown
  if (!data || typeof data !== 'object') throw new Error('Expected a JSON object')
  const obj = data as Record<string, unknown>
  const payload: BulkPayload = {}
  if (Array.isArray(obj.courses)) payload.courses = obj.courses as ImportCourse[]
  if (Array.isArray(obj.vocab)) payload.vocab = obj.vocab as ImportVocab[]
  if (!payload.courses && !payload.vocab) throw new Error('No "courses" or "vocab" array found')
  return payload
}

// ─── Default seed content ────────────────────────────────────────────────────

export function alreadySeeded(): boolean {
  try { return localStorage.getItem(SEED_FLAG) === '1' } catch { return false }
}

function defaultPayload(language: TargetLanguage): BulkPayload {
  return {
    courses: [
      {
        title: 'Everyday Conversation Starter',
        description: 'Greet, introduce yourself, order food and make small talk with confidence.',
        level: 'A1–A2',
        pricing: { kind: 'free' },
        publish: true,
        units: [
          { title: 'First words', lessons: [{ title: 'Greetings & introductions', kind: 'video' }, { title: 'Practice: say hello', kind: 'practice' }] },
          { title: 'Out and about', lessons: [{ title: 'Ordering food', kind: 'video' }, { title: 'Quiz: café phrases', kind: 'exam' }] }
        ]
      },
      {
        title: 'Grammar Foundations',
        description: 'The core tenses and sentence patterns every beginner needs.',
        level: 'A1–B1',
        pricing: { kind: 'free' },
        publish: true,
        units: [
          { title: 'Present tenses', lessons: [{ title: 'Present simple', kind: 'rule' }, { title: 'Present continuous', kind: 'rule' }, { title: 'Practice mix', kind: 'practice' }] }
        ]
      }
    ],
    vocab: [
      { term: 'hello', translation: 'salom', deck: 'Starter', example: 'Hello, how are you?' },
      { term: 'thank you', translation: 'rahmat', deck: 'Starter', example: 'Thank you very much.' },
      { term: 'please', translation: 'iltimos', deck: 'Starter' },
      { term: 'water', translation: 'suv', deck: 'Starter', example: 'Can I have some water?' },
      { term: 'friend', translation: 'do‘st', deck: 'Starter' },
      { term: 'today', translation: 'bugun', deck: 'Starter' },
      { term: 'tomorrow', translation: 'ertaga', deck: 'Starter' },
      { term: 'to learn', translation: 'o‘rganmoq', deck: 'Starter', example: 'I want to learn English.' }
    ].map((v) => ({ ...v, language }))
  }
}

/** Populate the app with starter content. Idempotent — guarded by a flag. */
export async function seedDefaultContent(language: TargetLanguage): Promise<ImportResult> {
  const res = await bulkImport(defaultPayload(language), language)
  try { localStorage.setItem(SEED_FLAG, '1') } catch { /* non-fatal */ }
  return res
}

/** A copy-paste example payload shown in the import panel. */
export const EXAMPLE_PAYLOAD = JSON.stringify({
  courses: [{
    title: 'Travel English',
    description: 'Survive at the airport, hotel and restaurant.',
    level: 'A2–B1',
    publish: true,
    units: [{ title: 'At the airport', lessons: [{ title: 'Check-in', kind: 'video' }] }]
  }],
  vocab: [{ term: 'passport', translation: 'pasport', deck: 'Travel' }]
}, null, 2)
