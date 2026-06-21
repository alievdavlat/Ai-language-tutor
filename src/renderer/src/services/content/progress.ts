/**
 * Local persistence for learning-content state: lesson completion, unit
 * checkpoint + final-exam results, earned certificates, story resume points,
 * saved vocabulary words, and watch positions.
 *
 * Stored under its own localStorage key (`speakai.content.v1`) so it never
 * clobbers the platform backend store (`speakai.backend.v1`). When the cloud
 * Foundation lands, this becomes a thin adapter over Supabase rows — the shape
 * here is already row-friendly (flat maps keyed by id).
 */
import { useSyncExternalStore } from 'react'

const LS_KEY = 'speakai.content.v1'

export interface ExamResult {
  score: number // 0–100
  passed: boolean
  at: string // ISO
}

export interface Certificate {
  courseId: string
  courseTitle: string
  learnerName: string
  score: number
  issuedAt: string
}

export interface StoryProgress {
  /** Index of the part the learner is on (0-based). */
  part: number
  completed: boolean
  lastAt: string
}

export interface SavedWord {
  /** Stable id = `${lang}:${word.toLowerCase()}`. */
  id: string
  word: string
  lang: string
  pos?: string
  meaning?: string
  /** Where it was saved from, e.g. "Watch · TED" or "Story · A Day in Tokyo". */
  source?: string
  at: string
}

export interface WatchState {
  positionSec: number
  savedWordIds: string[]
}

export interface ContentState {
  /** lessonId -> completion timestamp */
  lessons: Record<string, string>
  /** exam-lesson id -> result (per-unit checkpoint) */
  checkpoints: Record<string, ExamResult>
  /** courseId -> final exam result */
  finalExams: Record<string, ExamResult>
  /** courseId -> certificate */
  certificates: Record<string, Certificate>
  /** storyId -> progress */
  stories: Record<string, StoryProgress>
  /** saved vocabulary */
  savedWords: SavedWord[]
  /** videoId -> watch state */
  watch: Record<string, WatchState>
}

function empty(): ContentState {
  return {
    lessons: {},
    checkpoints: {},
    finalExams: {},
    certificates: {},
    stories: {},
    savedWords: [],
    watch: {}
  }
}

// ─── Store internals ─────────────────────────────────────────────────────────

let cache: ContentState | null = null
const listeners = new Set<() => void>()

function load(): ContentState {
  if (cache) return cache
  if (typeof window === 'undefined' || !window.localStorage) {
    cache = empty()
    return cache
  }
  const raw = window.localStorage.getItem(LS_KEY)
  if (!raw) {
    cache = empty()
    return cache
  }
  try {
    cache = { ...empty(), ...(JSON.parse(raw) as Partial<ContentState>) }
  } catch {
    cache = empty()
  }
  return cache
}

function commit(next: ContentState): void {
  cache = next
  if (typeof window !== 'undefined' && window.localStorage) {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch { /* quota */ }
  }
  listeners.forEach((l) => l())
}

function update(fn: (s: ContentState) => ContentState): void {
  commit(fn(load()))
}

const now = (): string => new Date().toISOString()

// ─── Lessons ─────────────────────────────────────────────────────────────────

export function isLessonComplete(lessonId: string): boolean {
  return !!load().lessons[lessonId]
}

export function markLessonComplete(lessonId: string): void {
  update((s) => (s.lessons[lessonId] ? s : { ...s, lessons: { ...s.lessons, [lessonId]: now() } }))
}

export function unmarkLesson(lessonId: string): void {
  update((s) => {
    if (!s.lessons[lessonId]) return s
    const lessons = { ...s.lessons }
    delete lessons[lessonId]
    return { ...s, lessons }
  })
}

// ─── Exams / checkpoints ─────────────────────────────────────────────────────

export function recordCheckpoint(lessonId: string, score: number, passMark = 60): ExamResult {
  const result: ExamResult = { score, passed: score >= passMark, at: now() }
  update((s) => ({ ...s, checkpoints: { ...s.checkpoints, [lessonId]: result } }))
  // Passing a checkpoint also completes the lesson.
  if (result.passed) markLessonComplete(lessonId)
  return result
}

export function getCheckpoint(lessonId: string): ExamResult | undefined {
  return load().checkpoints[lessonId]
}

export function recordFinalExam(courseId: string, score: number, passMark = 65): ExamResult {
  const result: ExamResult = { score, passed: score >= passMark, at: now() }
  update((s) => ({ ...s, finalExams: { ...s.finalExams, [courseId]: result } }))
  return result
}

export function getFinalExam(courseId: string): ExamResult | undefined {
  return load().finalExams[courseId]
}

// ─── Certificates ────────────────────────────────────────────────────────────

export function issueCertificate(c: Omit<Certificate, 'issuedAt'>): Certificate {
  const already = load().certificates[c.courseId]
  const cert: Certificate = { ...c, issuedAt: now() }
  update((s) => ({ ...s, certificates: { ...s.certificates, [c.courseId]: cert } }))
  // #B25 — celebrate a newly-earned certificate (first issue only). Lazy imports
  // keep this foundational store free of a static backend/notify dependency.
  if (!already) {
    void import('../notifications/notify').then(({ notify }) =>
      import('../backend').then(({ backend }) => {
        const uid = backend.currentUserId()
        if (uid) void notify({ userId: uid, kind: 'certificate', title: 'Certificate earned 🎓', body: `You completed ${c.courseTitle}.`, link: '/profile' })
      })
    ).catch(() => undefined)
  }
  return cert
}

export function getCertificate(courseId: string): Certificate | undefined {
  return load().certificates[courseId]
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export function getStoryProgress(storyId: string): StoryProgress | undefined {
  return load().stories[storyId]
}

export function setStoryProgress(storyId: string, part: number, completed = false): void {
  update((s) => ({
    ...s,
    stories: { ...s.stories, [storyId]: { part, completed, lastAt: now() } }
  }))
}

// ─── Saved words (vocabulary) ────────────────────────────────────────────────

export function wordId(word: string, lang: string): string {
  return `${lang}:${word.trim().toLowerCase()}`
}

export function isWordSaved(word: string, lang: string): boolean {
  const id = wordId(word, lang)
  return load().savedWords.some((w) => w.id === id)
}

export function saveWord(input: Omit<SavedWord, 'id' | 'at'>): SavedWord {
  const id = wordId(input.word, input.lang)
  const existing = load().savedWords.find((w) => w.id === id)
  if (existing) return existing
  const w: SavedWord = { ...input, id, at: now() }
  update((s) => ({ ...s, savedWords: [w, ...s.savedWords] }))
  return w
}

export function removeWord(word: string, lang: string): void {
  const id = wordId(word, lang)
  update((s) => ({ ...s, savedWords: s.savedWords.filter((w) => w.id !== id) }))
}

export function toggleWord(input: Omit<SavedWord, 'id' | 'at'>): boolean {
  if (isWordSaved(input.word, input.lang)) {
    removeWord(input.word, input.lang)
    return false
  }
  saveWord(input)
  return true
}

export function listSavedWords(): SavedWord[] {
  return load().savedWords
}

// ─── Watch ───────────────────────────────────────────────────────────────────

export function getWatchState(videoId: string): WatchState {
  return load().watch[videoId] ?? { positionSec: 0, savedWordIds: [] }
}

export function setWatchPosition(videoId: string, positionSec: number): void {
  update((s) => ({
    ...s,
    watch: { ...s.watch, [videoId]: { ...getWatchState(videoId), positionSec } }
  }))
}

// ─── React binding ───────────────────────────────────────────────────────────

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/** Reactive snapshot of the whole content store. Re-renders on any change. */
export function useContentState(): ContentState {
  return useSyncExternalStore(subscribe, load, empty)
}
