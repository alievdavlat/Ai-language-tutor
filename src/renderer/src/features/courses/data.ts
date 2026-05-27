// Hardcoded preview data for the merged Courses feature (level video-courses +
// coursebooks). Real lessons/units come from the content registry later.

export type NodeState = 'done' | 'current' | 'locked'
export type NodeKind = 'video' | 'lesson' | 'practice' | 'checkpoint'

export interface PathNode {
  kind: NodeKind
  state: NodeState
  label: string
}

export interface Unit {
  title: string
  topic: string
  tint: string // tailwind gradient classes for the unit banner
  nodes: PathNode[]
}

export interface Course {
  id: string
  type: 'level' | 'book'
  title: string
  subtitle: string
  level: string
  lessons: number
  progress: number
  cover: string // tailwind gradient
}

export const LEVEL_COURSES: Course[] = [
  { id: 'a1', type: 'level', title: 'Beginner', subtitle: 'Start from zero', level: 'A1', lessons: 40, progress: 100, cover: 'from-sky-500 to-blue-700' },
  { id: 'a2', type: 'level', title: 'Elementary', subtitle: 'Everyday basics', level: 'A2', lessons: 48, progress: 72, cover: 'from-emerald-500 to-teal-700' },
  { id: 'b1', type: 'level', title: 'Intermediate', subtitle: 'Hold a conversation', level: 'B1', lessons: 52, progress: 34, cover: 'from-blue-500 to-indigo-700' },
  { id: 'b2', type: 'level', title: 'Upper-Intermediate', subtitle: 'Speak with nuance', level: 'B2', lessons: 56, progress: 0, cover: 'from-violet-500 to-purple-700' }
]

export const BOOK_COURSES: Course[] = [
  { id: 'egiu', type: 'book', title: 'English Grammar in Use', subtitle: 'Raymond Murphy', level: 'B1–B2', lessons: 145, progress: 18, cover: 'from-blue-600 to-blue-800' },
  { id: 'essential', type: 'book', title: 'Essential Grammar in Use', subtitle: 'Raymond Murphy', level: 'A1–A2', lessons: 115, progress: 64, cover: 'from-rose-600 to-rose-800' },
  { id: 'wordskills', type: 'book', title: 'Oxford Word Skills', subtitle: 'Gairns & Redman', level: 'B1', lessons: 80, progress: 35, cover: 'from-emerald-600 to-emerald-800' },
  { id: 'vocabinuse', type: 'book', title: 'Vocabulary in Use', subtitle: 'Cambridge', level: 'B2', lessons: 100, progress: 8, cover: 'from-amber-500 to-amber-700' }
]

// Teacher-made courses (appear on their channel + here).
export const TEACHER_COURSES: Course[] = [
  { id: 'tc1', type: 'level', title: 'IELTS Speaking Bootcamp', subtitle: 'James Lee', level: 'B1–B2', lessons: 24, progress: 0, cover: 'from-rose-500 to-pink-700' },
  { id: 'tc2', type: 'level', title: 'Everyday Conversation', subtitle: 'Emma Carter', level: 'A2–B1', lessons: 30, progress: 12, cover: 'from-sky-500 to-blue-700' },
  { id: 'tc3', type: 'level', title: 'Business English Pro', subtitle: 'Sara Kim', level: 'B2', lessons: 28, progress: 0, cover: 'from-violet-500 to-purple-700' }
]

// Student-shared / community courses.
export const STUDENT_COURSES: Course[] = [
  { id: 'sc1', type: 'level', title: 'My A2 → B1 roadmap', subtitle: 'shared by Bekzod', level: 'A2–B1', lessons: 18, progress: 0, cover: 'from-emerald-500 to-teal-700' },
  { id: 'sc2', type: 'level', title: 'Movies for listening', subtitle: 'shared by Dilnoza', level: 'B1', lessons: 14, progress: 0, cover: 'from-amber-500 to-orange-700' }
]

// A representative learning path reused for any selected course (visual shell).
export const SAMPLE_UNITS: Unit[] = [
  {
    title: 'Unit 1',
    topic: 'Present & past',
    tint: 'from-brand-600/40 to-brand-500/10',
    nodes: [
      { kind: 'video', state: 'done', label: 'Intro: daily routines' },
      { kind: 'lesson', state: 'done', label: 'Present simple' },
      { kind: 'practice', state: 'done', label: 'Practice: present simple' },
      { kind: 'video', state: 'current', label: 'Present continuous' },
      { kind: 'lesson', state: 'locked', label: 'Present vs continuous' },
      { kind: 'checkpoint', state: 'locked', label: 'Unit 1 review' }
    ]
  },
  {
    title: 'Unit 2',
    topic: 'Future & plans',
    tint: 'from-emerald-600/40 to-emerald-500/10',
    nodes: [
      { kind: 'video', state: 'locked', label: 'Talking about plans' },
      { kind: 'lesson', state: 'locked', label: 'going to vs will' },
      { kind: 'practice', state: 'locked', label: 'Practice: the future' },
      { kind: 'checkpoint', state: 'locked', label: 'Unit 2 review' }
    ]
  }
]
