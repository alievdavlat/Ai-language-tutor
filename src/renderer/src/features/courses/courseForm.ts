/**
 * Shared course-form core (#A68) — the SINGLE source of truth for course-level
 * authoring, consumed by BOTH surfaces:
 *
 *   • Teacher flow  — features/teacher/CourseAuthoringPage.tsx (rich multi-step
 *     builder; curriculum/units/lessons stay there, only course-level logic
 *     comes from here).
 *   • Admin CMS     — features/admin/resources.tsx 'courses' ResourceDef
 *     (schema-driven drawer rendered by SchemaForm).
 *
 * Field definitions, defaults, validation, toForm/fromForm mapping, duplicate
 * detection (#A65) and the save routine (create vs update via
 * backend.upsertCourse) all live here so the two forms can never drift apart.
 *
 * Pricing policy: pricing is the AUTHOR's choice — DEFAULT FREE, with optional
 * one-off or monthly subscription.
 */
import type { Course, TargetLanguage } from '@shared/types'
import { SUPPORTED_LANGUAGES } from '@shared/constants'
import type { FieldDef, FormValues } from '../../components/forms'
import { backend } from '../../services/backend/useBackend'
import { uploadUrl } from '../../services/backend'
import { createId } from '../../lib/ids'
import { checkDuplicate, contentKey } from '../../services/dedup'

export type CoursePricingKind = 'free' | 'one-off' | 'sub'

/** Unified defaults shared by both authoring surfaces. */
export const COURSE_DEFAULTS = {
  title: 'Untitled course',
  level: 'B1',
  targetLanguage: 'en' as TargetLanguage,
  /** Gradient fallback shown wherever no cover image is uploaded. */
  cover: 'from-violet-500 to-purple-700'
} as const

/** Max cover/banner upload size (bytes) — matches storage data-URL fallback. */
export const COURSE_IMAGE_MAX_BYTES = 4 * 1024 * 1024

export const courseLanguageOptions = (): { value: string; label: string }[] =>
  SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: `${l.flag} ${l.name}` }))

export const COURSE_PRICING_OPTIONS: { value: CoursePricingKind; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'one-off', label: 'One-off purchase' },
  { value: 'sub', label: 'Subscription / month' }
]

/**
 * Declarative course-level fields (rendered by SchemaForm in the Admin CMS;
 * the teacher page renders the same data with its richer bespoke UI).
 */
export const COURSE_FIELDS: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, full: true, placeholder: 'e.g. Business English 101' },
  { name: 'description', label: 'Short tagline', type: 'textarea', full: true, rows: 2, help: 'One line shown on the course card.' },
  { name: 'about', label: 'About this course', type: 'textarea', full: true, rows: 4, help: 'Full description shown on the course page (markdown renders).' },
  { name: 'level', label: 'Level', type: 'level', full: true, defaultValue: COURSE_DEFAULTS.level },
  { name: 'targetLanguage', label: 'Language', type: 'select', options: courseLanguageOptions, defaultValue: COURSE_DEFAULTS.targetLanguage },
  { name: 'pricingKind', label: 'Pricing model', type: 'select', options: COURSE_PRICING_OPTIONS, defaultValue: 'free', help: 'Free by default — charging is the author’s choice.' },
  { name: 'priceUsd', label: 'Price (USD)', type: 'number', min: 0, prefix: '$', when: (v) => v.pricingKind === 'one-off' || v.pricingKind === 'sub' },
  { name: 'hours', label: 'Length (hours)', type: 'number', min: 0, step: 0.5 },
  { name: 'capstone', label: 'Capstone project', type: 'text', full: true, placeholder: 'Final project learners complete' },
  { name: 'thumbnailUrl', label: 'Cover image', type: 'image', uploadPrefix: 'covers', full: true, help: 'Card image shown in the catalog.' },
  { name: 'bannerUrl', label: 'Banner image', type: 'image', uploadPrefix: 'covers', full: true, help: 'Wide hero shown on the course page header.' },
  { name: 'cover', label: 'Fallback gradient', type: 'gradient', full: true, defaultValue: COURSE_DEFAULTS.cover },
  { name: 'published', label: 'Published', type: 'toggle', help: 'Visible to learners in the catalog' }
]

// ─── pricing mapping ─────────────────────────────────────────────────────────

export function pricingToForm(p: Course['pricing'] | undefined): { pricingKind: CoursePricingKind; priceUsd: number } {
  if (!p || p.kind === 'free') return { pricingKind: 'free', priceUsd: 0 }
  if (p.kind === 'one-off') return { pricingKind: 'one-off', priceUsd: p.usd }
  return { pricingKind: 'sub', priceUsd: p.usdPerMo }
}

export function pricingFromForm(v: FormValues): Course['pricing'] {
  const kind = String(v.pricingKind || 'free')
  const usd = Math.max(0, Number(v.priceUsd) || 0)
  if (kind === 'one-off') return { kind: 'one-off', usd }
  if (kind === 'sub') return { kind: 'sub', usdPerMo: usd }
  return { kind: 'free' }
}

// ─── toForm / fromForm ───────────────────────────────────────────────────────

/** Course → flat form values (drives both the admin drawer and edit-load). */
export function courseToForm(c: Course): FormValues {
  return {
    title: c.title,
    description: c.description,
    about: c.about ?? '',
    level: c.level,
    targetLanguage: c.targetLanguage,
    ...pricingToForm(c.pricing),
    hours: c.hours,
    capstone: c.capstone ?? '',
    thumbnailUrl: c.thumbnailUrl ?? '',
    bannerUrl: c.bannerUrl ?? '',
    cover: c.cover,
    published: !!c.publishedAt
  }
}

/**
 * Flat form values → full Course. Fields the caller didn't include are
 * preserved from `existing` (so a narrower form can never wipe data), and
 * stats (rating/reviews/enrollment) always carry over on update.
 */
export function buildCourseFromForm(
  v: FormValues,
  existing: Course | null,
  opts?: { id?: string; authorId?: string }
): Course {
  const teacherId = existing?.teacherId ?? opts?.authorId ?? backend.currentUserId() ?? 'u_anon'
  const title = String(v.title ?? '').trim() || COURSE_DEFAULTS.title
  return {
    id: opts?.id ?? existing?.id ?? createId('course'),
    teacherId,
    title,
    description: String(v.description ?? ''),
    about: ('about' in v ? String(v.about ?? '') : (existing?.about ?? '')) || undefined,
    level: String(v.level || existing?.level || COURSE_DEFAULTS.level),
    targetLanguage: String(v.targetLanguage || existing?.targetLanguage || COURSE_DEFAULTS.targetLanguage) as TargetLanguage,
    cover: String(v.cover || existing?.cover || COURSE_DEFAULTS.cover),
    thumbnailUrl: ('thumbnailUrl' in v ? String(v.thumbnailUrl ?? '') : (existing?.thumbnailUrl ?? '')) || undefined,
    bannerUrl: ('bannerUrl' in v ? String(v.bannerUrl ?? '') : (existing?.bannerUrl ?? '')) || undefined,
    pricing: pricingFromForm(v),
    rating: existing?.rating ?? 0,
    reviewCount: existing?.reviewCount ?? 0,
    enrollmentCount: existing?.enrollmentCount ?? 0,
    hours: Math.max(0, Number(v.hours) || existing?.hours || 0),
    publishedAt: v.published ? (existing?.publishedAt ?? new Date().toISOString()) : undefined,
    capstone: ('capstone' in v ? String(v.capstone ?? '').trim() : (existing?.capstone ?? '')) || undefined,
    contentHash: contentKey.titleOwner(title, teacherId)
  }
}

// ─── validation ──────────────────────────────────────────────────────────────

/** Returns a human-readable problem, or null when the values are saveable. */
export function validateCourseForm(v: FormValues): string | null {
  if (!String(v.title ?? '').trim()) return 'Title is required.'
  if ((v.pricingKind === 'one-off' || v.pricingKind === 'sub') && (Number(v.priceUsd) || 0) < 0) {
    return 'Price must be 0 or more.'
  }
  return null
}

/**
 * Duplicate guard (#A65): does `ownerId` already have a course with this (or a
 * near-identical) title? Returns the clashing course, or null when safe.
 */
export async function findDuplicateCourse(
  title: string,
  ownerId: string,
  excludeId?: string
): Promise<Course | null> {
  const t = title.trim() || COURSE_DEFAULTS.title
  const mine = await backend.myCourses(ownerId)
  const dup = checkDuplicate(
    { contentHash: contentKey.titleOwner(t, ownerId), title: t, excludeId },
    mine,
    { getId: (c) => c.id, getKey: (c) => c.contentHash, getTitle: (c) => c.title }
  )
  return dup.exact ?? dup.near[0]?.item ?? null
}

// ─── save routine ────────────────────────────────────────────────────────────

/**
 * The ONE course save path: validate → build (create or update) → duplicate
 * check → persist via the shared backend. Throws Error with a user-readable
 * message on any problem; returns the persisted Course.
 */
export async function saveCourseForm(
  values: FormValues,
  existing: Course | null,
  opts?: { id?: string; authorId?: string }
): Promise<Course> {
  const problem = validateCourseForm(values)
  if (problem) throw new Error(problem)
  const course = buildCourseFromForm(values, existing, opts)
  const dup = await findDuplicateCourse(course.title, course.teacherId, course.id)
  if (dup) {
    throw new Error(`A course called “${dup.title}” already exists for this author. Rename it or edit the original instead.`)
  }
  return backend.upsertCourse(course)
}

// ─── cover upload ────────────────────────────────────────────────────────────

/**
 * Upload a course cover/banner through the shared storage wrapper (Supabase
 * Storage when configured, data: URL fallback). Validates type + size and
 * throws a user-readable Error on rejection.
 */
export async function uploadCourseCover(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  if (file.size > COURSE_IMAGE_MAX_BYTES) throw new Error('Image must be under 4 MB.')
  return uploadUrl(file, 'covers')
}
