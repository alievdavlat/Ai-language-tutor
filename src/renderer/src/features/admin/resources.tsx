/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Resource registry for the Admin CMS (#A56). Each entity the platform manages
 * is described once вЂ” how to load it, the table columns, the create/edit form
 * (schema-driven, or a reused bespoke editor for deeply-nested ones), delete,
 * and bulk JSON import. The generic ResourcePage renders any of these.
 *
 * Everything is wired to the REAL data layer вЂ” the shared Backend
 * (LocalBackend + supabaseBackend) for courses/groups/challenges, and the
 * dedicated localStorage stores for library/stories/exams/roleplays/clips/paths.
 * No inline mock arrays.
 */
import type { ReactNode } from 'react'
import type { Course, Group, Challenge, TargetLanguage, LibraryItem } from '@shared/types'
import { backend } from '../../services/backend/useBackend'
import { createId } from '../../lib/ids'
import { SUPPORTED_LANGUAGES, getLanguage } from '@shared/constants'
import { levels } from '../../services/levels/store'
import { library } from '../../services/library/store'
import { stories } from '../../services/stories/store'
import { exams } from '../../services/exams/store'
import { writing } from '../../services/writing/store'
import { roleplays } from '../../services/roleplay'
import { clips } from '../../services/clips/store'
import { paths } from '../../services/paths/store'
import { COURSE_FIELDS, courseToForm, saveCourseForm } from '../courses/courseForm'
import StoryEditor from '../stories/StoryEditor'
import ExamEditor from '../exams/ExamEditor'
import RoleplayEditor from '../speaking/sections/RoleplayEditor'
import {
  IconBook,
  IconLibrary,
  IconClipboard,
  IconMasks,
  IconUsers,
  IconTrophy,
  IconPlay,
  IconTarget,
  IconPencilEdit
} from '../../components/icons'
import type { FieldDef, FormValues } from '../../components/forms'

export type BadgeTone = 'emerald' | 'amber' | 'rose' | 'violet' | 'brand' | 'slate' | 'sky'

export interface ResourceColumn {
  key: string
  label: string
  render: (row: any) => ReactNode
  /** Tailwind width / alignment classes for the cell. */
  cls?: string
}

export interface ResourceDef {
  key: string
  /** Plural nav label, e.g. "Courses". */
  label: string
  singular: string
  group: 'Learning' | 'Practice' | 'Community'
  icon: ReactNode
  blurb: string
  load: () => Promise<any[]> | any[]
  rowId: (row: any) => string
  search: (row: any) => string
  columns: ResourceColumn[]
  badge?: (row: any) => { label: string; tone: BadgeTone } | null
  /** Reuse an existing bespoke modal editor (deeply-nested entities). */
  customEditor?: (props: { initial: any | null; onClose: () => void; onSaved: () => void }) => ReactNode
  /** OR a declarative form. */
  fields?: FieldDef[]
  toForm?: (row: any) => FormValues
  save?: (values: FormValues, existing: any | null) => Promise<void>
  remove?: (row: any) => Promise<void>
  /** Built-in seed rows that re-appear on reload вЂ” surfaced to the user. */
  isBuiltIn?: (row: any) => boolean
  bulkImport?: (rows: any[]) => Promise<number>
}

// в”Ђв”Ђв”Ђ Shared option getters в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

const langOptions = (): { value: string; label: string }[] =>
  SUPPORTED_LANGUAGES.map((l) => ({ value: l.code, label: `${l.flag} ${l.name}` }))
const levelOptions = (): { value: string; label: string }[] =>
  levels.list().map((l) => ({ value: l.code, label: l.name }))
const me = (): string => backend.currentUserId() ?? 'admin'
const nowIso = (): string => new Date().toISOString()

const langCell = (code: string): string => {
  const l = getLanguage(code)
  return `${l.flag} ${l.name}`
}

function Tag({ children, tone = 'slate' }: { children: ReactNode; tone?: BadgeTone }): JSX.Element {
  const tones: Record<BadgeTone, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-200',
    amber: 'bg-amber-500/15 text-amber-200',
    rose: 'bg-rose-500/15 text-rose-200',
    violet: 'bg-violet-500/15 text-violet-200',
    brand: 'bg-brand-500/15 text-brand-200',
    sky: 'bg-sky-500/15 text-sky-200',
    slate: 'bg-white/[0.06] text-slate-300'
  }
  return <span className={`inline-flex items-center rounded-md text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${tones[tone]}`}>{children}</span>
}

function Cover({ cover, img, emoji }: { cover?: string; img?: string; emoji?: string }): JSX.Element {
  if (img) return <img src={img} alt="" className="w-9 h-9 rounded-md object-cover ring-1 ring-white/10 shrink-0" />
  return (
    <div className={`w-9 h-9 rounded-md bg-gradient-to-br ${cover ?? 'from-slate-600 to-slate-800'} ring-1 ring-white/10 shrink-0 flex items-center justify-center text-sm`}>
      {emoji}
    </div>
  )
}

// в”Ђв”Ђв”Ђ Registry в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

export const RESOURCES: ResourceDef[] = [
  // в”Ђв”Ђ Courses в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  {
    key: 'courses',
    label: 'Courses',
    singular: 'course',
    group: 'Learning',
    icon: <IconBook className="w-4 h-4" />,
    blurb: 'Full video courses with curriculum, pricing and a cover.',
    load: () => backend.listCourses(),
    rowId: (c) => c.id,
    search: (c) => `${c.title} ${c.description} ${c.level}`,
    badge: (c) => (c.publishedAt ? { label: 'Live', tone: 'emerald' } : { label: 'Draft', tone: 'amber' }),
    columns: [
      { key: 'title', label: 'Title', render: (c) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Cover cover={c.cover} img={c.thumbnailUrl} />
          <span className="truncate font-semibold text-white">{c.title}</span>
        </div>
      ) },
      { key: 'level', label: 'Level', render: (c) => <Tag>{c.level}</Tag>, cls: 'w-24' },
      { key: 'lang', label: 'Language', render: (c) => <span className="text-slate-300">{langCell(c.targetLanguage)}</span>, cls: 'w-32' },
      { key: 'price', label: 'Pricing', render: (c) => (
        !c.pricing || c.pricing.kind === 'free' ? <Tag tone="sky">Free</Tag>
          : c.pricing.kind === 'one-off' ? <span className="text-slate-200 tabular-nums">${c.pricing.usd}</span>
          : <span className="text-slate-200 tabular-nums">${c.pricing.usdPerMo}/mo</span>
      ), cls: 'w-24' },
      { key: 'enroll', label: 'Enrolled', render: (c) => <span className="text-slate-400 tabular-nums">{(c.enrollmentCount ?? 0).toLocaleString()}</span>, cls: 'w-24 text-right' }
    ],
    // Course-level form logic is SHARED with the teacher Course builder (#A68)
    // — fields, defaults, validation, pricing (default FREE) and the save
    // routine all come from features/courses/courseForm.ts.
    fields: COURSE_FIELDS,
    toForm: (c: Course) => courseToForm(c),
    save: async (v, existing: Course | null) => {
      await saveCourseForm(v, existing)
    },
    remove: (c) => backend.deleteCourse(c.id),
    bulkImport: async (rows) => {
      let n = 0
      for (const r of rows) {
        await backend.upsertCourse({
          id: r.id ?? createId('course'), teacherId: r.teacherId ?? me(),
          title: r.title ?? 'Untitled course', description: r.description ?? '',
          level: r.level ?? 'A1', targetLanguage: r.targetLanguage ?? 'en',
          cover: r.cover ?? 'from-sky-500 to-blue-700', thumbnailUrl: r.thumbnailUrl,
          pricing: r.pricing ?? { kind: 'free' }, rating: r.rating ?? 0,
          reviewCount: r.reviewCount ?? 0, enrollmentCount: r.enrollmentCount ?? 0,
          hours: r.hours ?? 0, publishedAt: r.publishedAt, capstone: r.capstone
        })
        n++
      }
      return n
    }
  },

  // в”Ђв”Ђ Library в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  {
    key: 'library',
    label: 'Library',
    singular: 'item',
    group: 'Learning',
    icon: <IconLibrary className="w-4 h-4" />,
    blurb: 'Books (PDF), videos and audio learners can read, watch and listen to.',
    load: () => library.list(),
    rowId: (i) => i.id,
    search: (i) => `${i.title} ${i.author ?? ''}`,
    badge: (i) => ({ label: i.kind, tone: i.kind === 'book' ? 'violet' : i.kind === 'video' ? 'rose' : 'sky' }),
    columns: [
      { key: 'title', label: 'Title', render: (i) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Cover img={i.thumbnailUrl} cover="from-violet-500 to-purple-700" emoji={i.kind === 'book' ? 'рџ“' : i.kind === 'video' ? 'рџЋ¬' : 'рџЋ§'} />
          <div className="min-w-0">
            <span className="block truncate font-semibold text-white">{i.title}</span>
            {i.author && <span className="block truncate text-[11px] text-slate-500">{i.author}</span>}
          </div>
        </div>
      ) },
      { key: 'kind', label: 'Type', render: (i) => <Tag>{i.kind}</Tag>, cls: 'w-20' },
      { key: 'level', label: 'Level', render: (i) => <span className="text-slate-300">{i.level ?? 'вЂ”'}</span>, cls: 'w-20' },
      { key: 'lang', label: 'Language', render: (i) => <span className="text-slate-300">{langCell(i.language)}</span>, cls: 'w-32' }
    ],
    fields: [
      { name: 'kind', label: 'Type', type: 'select', options: [
        { value: 'book', label: 'рџ“ Book (PDF)' }, { value: 'video', label: 'рџЋ¬ Video' }, { value: 'audio', label: 'рџЋ§ Audio' }
      ] },
      { name: 'title', label: 'Title', type: 'text', required: true, full: true },
      { name: 'author', label: 'Author / source', type: 'text' },
      { name: 'level', label: 'Level', type: 'select', options: levelOptions },
      { name: 'language', label: 'Language', type: 'select', options: langOptions },
      { name: 'description', label: 'Description', type: 'textarea', full: true, rows: 2 },
      { name: 'thumbnailUrl', label: 'Thumbnail', type: 'image', uploadPrefix: 'library', full: true },
      { name: 'pdfUrl', label: 'PDF URL', type: 'text', full: true, when: (v) => v.kind === 'book', placeholder: 'https://вЂ¦ .pdf' },
      { name: 'youtubeId', label: 'YouTube ID or URL', type: 'text', full: true, when: (v) => v.kind === 'video' },
      { name: 'audioUrl', label: 'Audio URL', type: 'text', full: true, when: (v) => v.kind === 'audio', placeholder: 'https://вЂ¦ .mp3' },
      { name: 'durationLabel', label: 'Duration label', type: 'text', when: (v) => v.kind === 'audio', placeholder: '3:00' }
    ],
    toForm: (i: LibraryItem) => ({
      kind: i.kind, title: i.title, author: i.author ?? '', level: i.level ?? 'A2', language: i.language,
      description: i.description ?? '', thumbnailUrl: i.thumbnailUrl ?? '', pdfUrl: i.pdfUrl ?? '',
      youtubeId: i.youtubeId ?? '', audioUrl: i.audioUrl ?? '', durationLabel: i.durationLabel ?? ''
    }),
    save: async (v, existing: LibraryItem | null) => {
      await library.upsert({
        id: existing?.id,
        kind: (String(v.kind || 'book')) as LibraryItem['kind'],
        title: String(v.title || '').trim() || 'Untitled',
        author: (v.author as string) || undefined,
        level: (v.level as string) || undefined,
        language: (String(v.language || 'en')) as TargetLanguage,
        description: (v.description as string) || undefined,
        thumbnailUrl: (v.thumbnailUrl as string) || undefined,
        pdfUrl: (v.pdfUrl as string) || undefined,
        youtubeId: (v.youtubeId as string) || undefined,
        audioUrl: (v.audioUrl as string) || undefined,
        durationLabel: (v.durationLabel as string) || undefined
      })
    },
    remove: (i) => library.remove(i.id),
    bulkImport: async (rows) => {
      let n = 0
      for (const r of rows) { await library.upsert({ ...r, kind: r.kind ?? 'book', title: r.title ?? 'Untitled', language: r.language ?? 'en' }); n++ }
      return n
    }
  },

  // в”Ђв”Ђ Stories (bespoke editor) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  {
    key: 'stories',
    label: 'Stories',
    singular: 'story',
    group: 'Learning',
    icon: <IconBook className="w-4 h-4" />,
    blurb: 'Graded reading/listening stories with comprehension questions.',
    load: () => stories.list(),
    rowId: (s) => s.id,
    search: (s) => `${s.title} ${s.blurb ?? ''}`,
    isBuiltIn: (s) => !!s.builtIn,
    badge: (s) => ({ label: s.kind, tone: 'violet' }),
    columns: [
      { key: 'title', label: 'Title', render: (s) => (
        <div className="flex items-center gap-2.5 min-w-0"><Cover cover={s.cover} emoji={s.emoji} /><span className="truncate font-semibold text-white">{s.title}</span></div>
      ) },
      { key: 'level', label: 'Level', render: (s) => <Tag>{s.level}</Tag>, cls: 'w-20' },
      { key: 'parts', label: 'Parts', render: (s) => <span className="text-slate-400 tabular-nums">{s.parts?.length ?? 0}</span>, cls: 'w-16 text-right' },
      { key: 'qs', label: 'Questions', render: (s) => <span className="text-slate-400 tabular-nums">{s.questions?.length ?? 0}</span>, cls: 'w-20 text-right' }
    ],
    customEditor: ({ initial, onClose, onSaved }) => <StoryEditor initial={initial ?? undefined} authorId={me()} onClose={onClose} onSaved={() => onSaved()} />,
    remove: async (s) => { stories.remove(s.id) },
    bulkImport: async (rows) => { let n = 0; for (const r of rows) { stories.upsert(r); n++ } return n }
  },

  // в”Ђв”Ђ Exams (bespoke editor) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  {
    key: 'exams',
    label: 'Exams',
    singular: 'exam',
    group: 'Practice',
    icon: <IconClipboard className="w-4 h-4" />,
    blurb: 'Mock tests: MCQ sections with answer keys + writing tasks.',
    load: () => exams.list(),
    rowId: (e) => e.id,
    search: (e) => `${e.title} ${e.kind}`,
    isBuiltIn: (e) => !!e.builtIn,
    badge: (e) => ({ label: e.kind, tone: 'amber' }),
    columns: [
      { key: 'title', label: 'Title', render: (e) => <span className="font-semibold text-white truncate">{e.title}</span> },
      { key: 'kind', label: 'Family', render: (e) => <Tag tone="amber">{e.kind}</Tag>, cls: 'w-24' },
      { key: 'secs', label: 'Sections', render: (e) => <span className="text-slate-400 tabular-nums">{e.sections?.length ?? 0}</span>, cls: 'w-20 text-right' }
    ],
    customEditor: ({ initial, onClose, onSaved }) => <ExamEditor initial={initial ?? undefined} authorId={me()} onClose={onClose} onSaved={() => onSaved()} />,
    remove: async (e) => { exams.remove(e.id) },
    bulkImport: async (rows) => { let n = 0; for (const r of rows) { exams.upsert(r); n++ } return n }
  },

  // ── Writing tasks ────────────────────────────────────────────────────────
  {
    key: 'writing',
    label: 'Writing tasks',
    singular: 'writing task',
    group: 'Practice',
    icon: <IconPencilEdit className="w-4 h-4" />,
    blurb: 'Standalone writing prompts learners draft against in the Writing Coach.',
    load: () => writing.list(),
    rowId: (w) => w.id,
    search: (w) => `${w.title} ${w.prompt} ${w.type}`,
    isBuiltIn: (w) => !!w.builtIn,
    badge: (w) => ({ label: w.type, tone: 'emerald' }),
    columns: [
      { key: 'title', label: 'Title', render: (w) => <span className="font-semibold text-white truncate">{w.title}</span> },
      { key: 'type', label: 'Type', render: (w) => <Tag tone="emerald">{w.type}</Tag>, cls: 'w-24' },
      { key: 'level', label: 'Level', render: (w) => <Tag>{w.level}</Tag>, cls: 'w-20' },
      { key: 'words', label: 'Target', render: (w) => <span className="text-slate-400 tabular-nums">{w.targetWords ? `${w.targetWords}w` : '—'}</span>, cls: 'w-20 text-right' }
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, full: true },
      { name: 'type', label: 'Type', type: 'select', options: [
        { value: 'essay', label: 'Essay' }, { value: 'letter', label: 'Letter' }, { value: 'report', label: 'Report' },
        { value: 'review', label: 'Review' }, { value: 'story', label: 'Story' }, { value: 'email', label: 'Email' }, { value: 'other', label: 'Other' }
      ] },
      { name: 'level', label: 'Target level', type: 'select', options: levelOptions },
      { name: 'targetWords', label: 'Word-count target', type: 'number', min: 0 },
      { name: 'prompt', label: 'Prompt', type: 'textarea', full: true, rows: 3, required: true },
      { name: 'sampleAnswer', label: 'Sample answer (optional)', type: 'textarea', full: true, rows: 4 }
    ],
    toForm: (w) => ({ title: w.title, type: w.type, level: w.level, targetWords: w.targetWords ?? 0, prompt: w.prompt, sampleAnswer: w.sampleAnswer ?? '' }),
    save: async (v, existing) => {
      writing.upsert({
        id: existing?.id ?? createId('wt'),
        title: String(v.title || '').trim() || 'Untitled task',
        type: (String(v.type || 'essay')) as any,
        level: String(v.level || 'B1'),
        targetWords: Number(v.targetWords) > 0 ? Number(v.targetWords) : undefined,
        prompt: String(v.prompt || '').trim(),
        sampleAnswer: (v.sampleAnswer as string)?.trim() || undefined,
        builtIn: existing?.builtIn, authorId: existing?.authorId ?? me()
      })
    },
    remove: async (w) => { writing.remove(w.id) },
    bulkImport: async (rows) => { let n = 0; for (const r of rows) { writing.upsert({ id: r.id ?? createId('wt'), title: r.title ?? 'Untitled', type: r.type ?? 'essay', level: r.level ?? 'B1', prompt: r.prompt ?? '', ...r }); n++ } return n }
  },

  // в”Ђв”Ђ Roleplays (bespoke editor) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  {
    key: 'roleplays',
    label: 'Role-plays',
    singular: 'role-play',
    group: 'Practice',
    icon: <IconMasks className="w-4 h-4" />,
    blurb: 'Speaking scenarios the AI plays the other side of.',
    load: () => roleplays.list(),
    rowId: (r) => r.id,
    search: (r) => `${r.title} ${r.blurb}`,
    badge: (r) => ({ label: r.difficulty, tone: r.difficulty === 'easy' ? 'emerald' : r.difficulty === 'medium' ? 'amber' : 'rose' }),
    columns: [
      { key: 'title', label: 'Title', render: (r) => (
        <div className="flex items-center gap-2.5 min-w-0"><Cover cover={r.cover} img={r.thumbnailUrl} emoji={r.emoji} /><span className="truncate font-semibold text-white">{r.title}</span></div>
      ) },
      { key: 'section', label: 'Section', render: (r) => <span className="text-slate-300 capitalize">{r.section}</span>, cls: 'w-32' },
      { key: 'level', label: 'Level', render: (r) => <Tag>{r.level ?? 'вЂ”'}</Tag>, cls: 'w-20' }
    ],
    customEditor: ({ initial, onClose, onSaved }) => <RoleplayEditor initial={initial ?? undefined} authorId={me()} onClose={onClose} onSaved={() => onSaved()} />,
    remove: async (r) => { roleplays.remove(r.id) },
    bulkImport: async (rows) => { let n = 0; for (const r of rows) { roleplays.upsert(r); n++ } return n }
  },

  // в”Ђв”Ђ Clips в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  {
    key: 'clips',
    label: 'Clips',
    singular: 'clip',
    group: 'Practice',
    icon: <IconPlay className="w-4 h-4" />,
    blurb: 'Fill-in-the-blank music / movie / talk video clips.',
    load: () => clips.list(),
    rowId: (c) => c.id,
    search: (c) => `${c.title} ${c.artist}`,
    isBuiltIn: (c) => !!c.builtIn,
    badge: (c) => ({ label: c.kind, tone: 'sky' }),
    columns: [
      { key: 'title', label: 'Title', render: (c) => (
        <div className="flex items-center gap-2.5 min-w-0"><Cover cover={c.cover} /><div className="min-w-0"><span className="block truncate font-semibold text-white">{c.title}</span><span className="block truncate text-[11px] text-slate-500">{c.artist}</span></div></div>
      ) },
      { key: 'kind', label: 'Kind', render: (c) => <Tag tone="sky">{c.kind}</Tag>, cls: 'w-20' },
      { key: 'level', label: 'Level', render: (c) => <Tag>{c.level}</Tag>, cls: 'w-20' },
      { key: 'yt', label: 'YouTube', render: (c) => <span className="text-[11px] font-mono text-slate-500">{c.youtubeId || 'вЂ”'}</span>, cls: 'w-28' }
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, full: true },
      { name: 'artist', label: 'Artist / source', type: 'text', full: true },
      { name: 'kind', label: 'Kind', type: 'select', options: [
        { value: 'song', label: 'Music' }, { value: 'movie', label: 'Movie' }, { value: 'tv', label: 'TV' }, { value: 'talk', label: 'Talk' }
      ] },
      { name: 'youtubeId', label: 'YouTube ID', type: 'text', placeholder: 'e.g. kffacxfA7G4' },
      { name: 'level', label: 'Level', type: 'select', options: levelOptions },
      { name: 'duration', label: 'Duration', type: 'text', placeholder: '3:35' },
      { name: 'genre', label: 'Genre', type: 'text' },
      { name: 'accent', label: 'Accent flag', type: 'emoji' },
      { name: 'cover', label: 'Cover gradient', type: 'gradient', full: true }
    ],
    toForm: (c) => ({ title: c.title, artist: c.artist, kind: c.kind, youtubeId: c.youtubeId, level: c.level, duration: c.duration, genre: c.genre ?? '', accent: c.accent ?? 'рџ‡єрџ‡ё', cover: c.cover }),
    save: async (v, existing) => {
      clips.upsert({
        id: existing?.id ?? createId('clip'),
        title: String(v.title || '').trim() || 'Untitled clip',
        artist: String(v.artist || ''), kind: (String(v.kind || 'song')) as any,
        cover: String(v.cover || 'from-sky-500 to-blue-700'),
        youtubeId: String(v.youtubeId || ''), level: String(v.level || 'A2'),
        duration: String(v.duration || ''), genre: (v.genre as string) || undefined,
        accent: String(v.accent || 'рџ‡єрџ‡ё'),
        plays: existing?.plays ?? '0', ago: existing?.ago ?? 'just now',
        lines: existing?.lines, builtIn: existing?.builtIn, authorId: existing?.authorId ?? me()
      })
    },
    remove: async (c) => { clips.remove(c.id) },
    bulkImport: async (rows) => { let n = 0; for (const r of rows) { clips.upsert({ id: r.id ?? createId('clip'), plays: '0', ago: 'just now', accent: 'рџ‡єрџ‡ё', cover: 'from-sky-500 to-blue-700', kind: 'song', level: 'A2', duration: '', ...r }); n++ } return n }
  },

  // в”Ђв”Ђ Learning paths в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  {
    key: 'paths',
    label: 'Learning paths',
    singular: 'path',
    group: 'Learning',
    icon: <IconTarget className="w-4 h-4" />,
    blurb: 'Multi-course specializations that end with a capstone.',
    load: () => paths.list(),
    rowId: (p) => p.id,
    search: (p) => `${p.title} ${p.subtitle}`,
    isBuiltIn: (p) => !!p.builtIn,
    columns: [
      { key: 'title', label: 'Title', render: (p) => (
        <div className="flex items-center gap-2.5 min-w-0"><Cover cover={p.cover} /><span className="truncate font-semibold text-white">{p.title}</span></div>
      ) },
      { key: 'level', label: 'Level', render: (p) => <Tag>{p.level}</Tag>, cls: 'w-28' },
      { key: 'courses', label: 'Courses', render: (p) => <span className="text-slate-400 tabular-nums">{p.courseIds?.length ?? 0}</span>, cls: 'w-24 text-right' }
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, full: true },
      { name: 'subtitle', label: 'Subtitle', type: 'text', full: true },
      { name: 'level', label: 'Level range', type: 'text', placeholder: 'B1 в†’ C1' },
      { name: 'capstone', label: 'Capstone', type: 'textarea', full: true, rows: 2 },
      { name: 'cover', label: 'Cover gradient', type: 'gradient', full: true }
    ],
    toForm: (p) => ({ title: p.title, subtitle: p.subtitle, level: p.level, capstone: p.capstone, cover: p.cover }),
    save: async (v, existing) => {
      paths.upsert({
        id: existing?.id ?? createId('path'),
        title: String(v.title || '').trim() || 'Untitled path',
        subtitle: String(v.subtitle || ''), level: String(v.level || 'A1 в†’ B1'),
        cover: String(v.cover || 'from-rose-500 to-pink-700'),
        capstone: String(v.capstone || ''),
        courseIds: existing?.courseIds ?? [],
        goal: existing?.goal ?? 'foundations',
        builtIn: existing?.builtIn, authorId: existing?.authorId ?? me()
      })
    },
    remove: async (p) => { paths.remove(p.id) },
    bulkImport: async (rows) => { let n = 0; for (const r of rows) { paths.upsert({ id: r.id ?? createId('path'), subtitle: '', level: 'A1', capstone: '', cover: 'from-rose-500 to-pink-700', courseIds: [], goal: 'foundations', ...r }); n++ } return n }
  },

  // в”Ђв”Ђ Groups / clubs в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  {
    key: 'groups',
    label: 'Groups & clubs',
    singular: 'group',
    group: 'Community',
    icon: <IconUsers className="w-4 h-4" />,
    blurb: 'Community groups learners can join and post in.',
    load: () => backend.listGroups(),
    rowId: (g) => g.id,
    search: (g) => `${g.name} ${g.description}`,
    badge: (g) => ({ label: g.visibility, tone: g.visibility === 'public' ? 'emerald' : 'slate' }),
    columns: [
      { key: 'name', label: 'Name', render: (g) => (
        <div className="flex items-center gap-2.5 min-w-0"><Cover cover={g.cover} img={g.imageUrl} /><span className="truncate font-semibold text-white">{g.name}</span></div>
      ) },
      { key: 'lang', label: 'Language', render: (g) => <span className="text-slate-300">{langCell(g.language)}</span>, cls: 'w-32' },
      { key: 'members', label: 'Members', render: (g) => <span className="text-slate-400 tabular-nums">{(g.memberCount ?? 0).toLocaleString()}</span>, cls: 'w-24 text-right' }
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, full: true },
      { name: 'description', label: 'Description', type: 'textarea', full: true, rows: 2 },
      { name: 'language', label: 'Language', type: 'select', options: langOptions },
      { name: 'visibility', label: 'Visibility', type: 'select', options: [{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }] },
      { name: 'imageUrl', label: 'Cover image', type: 'image', uploadPrefix: 'covers', full: true },
      { name: 'cover', label: 'Fallback gradient', type: 'gradient' }
    ],
    toForm: (g: Group) => ({ name: g.name, description: g.description, language: g.language, visibility: g.visibility, imageUrl: g.imageUrl ?? '', cover: g.cover }),
    save: async (v, existing: Group | null) => {
      const group: Group = {
        id: existing?.id ?? createId('grp'),
        name: String(v.name || '').trim() || 'Untitled group',
        description: String(v.description || ''),
        language: (String(v.language || 'en')) as TargetLanguage,
        ownerId: existing?.ownerId ?? me(),
        cover: String(v.cover || 'from-violet-500 to-purple-700'),
        imageUrl: (v.imageUrl as string) || undefined,
        visibility: (String(v.visibility || 'public')) as 'public' | 'private',
        memberCount: existing?.memberCount ?? 0,
        createdAt: existing?.createdAt ?? nowIso()
      }
      await backend.upsertGroup(group)
    },
    remove: (g) => backend.deleteGroup(g.id),
    bulkImport: async (rows) => {
      let n = 0
      for (const r of rows) {
        await backend.upsertGroup({ id: r.id ?? createId('grp'), name: r.name ?? 'Group', description: r.description ?? '', language: r.language ?? 'en', ownerId: r.ownerId ?? me(), cover: r.cover ?? 'from-violet-500 to-purple-700', imageUrl: r.imageUrl, visibility: r.visibility ?? 'public', memberCount: r.memberCount ?? 0, createdAt: r.createdAt ?? nowIso() })
        n++
      }
      return n
    }
  },

  // в”Ђв”Ђ Challenges в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  {
    key: 'challenges',
    label: 'Challenges',
    singular: 'challenge',
    group: 'Community',
    icon: <IconTrophy className="w-4 h-4" />,
    blurb: 'Timed goals (streak / words / minutes) learners join.',
    load: () => backend.listChallenges(),
    rowId: (c) => c.id,
    search: (c) => `${c.title} ${c.description}`,
    badge: (c) => ({ label: c.kind, tone: 'brand' }),
    columns: [
      { key: 'title', label: 'Title', render: (c) => (
        <div className="flex items-center gap-2.5 min-w-0"><Cover cover={c.cover} img={c.imageUrl} /><span className="truncate font-semibold text-white">{c.title}</span></div>
      ) },
      { key: 'goal', label: 'Goal', render: (c) => <span className="text-slate-300 tabular-nums">{c.goal} <span className="text-slate-500">{c.kind}</span></span>, cls: 'w-28' },
      { key: 'lang', label: 'Language', render: (c) => <span className="text-slate-300">{langCell(c.language)}</span>, cls: 'w-28' },
      { key: 'parts', label: 'Joined', render: (c) => <span className="text-slate-400 tabular-nums">{(c.participantCount ?? 0).toLocaleString()}</span>, cls: 'w-20 text-right' }
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, full: true },
      { name: 'description', label: 'Description', type: 'textarea', full: true, rows: 2 },
      { name: 'kind', label: 'Metric', type: 'select', options: [
        { value: 'streak', label: 'Day streak' }, { value: 'words', label: 'Words learned' }, { value: 'minutes', label: 'Minutes practised' }, { value: 'lessons', label: 'Lessons done' }, { value: 'custom', label: 'Custom' }
      ] },
      { name: 'goal', label: 'Goal value', type: 'number', min: 1 },
      { name: 'language', label: 'Language', type: 'select', options: langOptions },
      { name: 'startsAt', label: 'Starts (ISO date)', type: 'text', placeholder: '2026-06-01' },
      { name: 'endsAt', label: 'Ends (ISO date)', type: 'text', placeholder: '2026-06-30' },
      { name: 'imageUrl', label: 'Cover image', type: 'image', uploadPrefix: 'covers', full: true },
      { name: 'cover', label: 'Fallback gradient', type: 'gradient' }
    ],
    toForm: (c: Challenge) => ({ title: c.title, description: c.description, kind: c.kind, goal: c.goal, language: c.language, startsAt: c.startsAt?.slice(0, 10) ?? '', endsAt: c.endsAt?.slice(0, 10) ?? '', imageUrl: c.imageUrl ?? '', cover: c.cover }),
    save: async (v, existing: Challenge | null) => {
      const challenge: Challenge = {
        id: existing?.id ?? createId('ch'),
        title: String(v.title || '').trim() || 'Untitled challenge',
        description: String(v.description || ''),
        kind: (String(v.kind || 'streak')) as Challenge['kind'],
        goal: Number(v.goal) || 1,
        language: (String(v.language || 'en')) as TargetLanguage,
        createdBy: existing?.createdBy ?? me(),
        startsAt: String(v.startsAt || nowIso().slice(0, 10)),
        endsAt: String(v.endsAt || nowIso().slice(0, 10)),
        cover: String(v.cover || 'from-amber-500 to-orange-700'),
        imageUrl: (v.imageUrl as string) || undefined,
        participantCount: existing?.participantCount ?? 0,
        createdAt: existing?.createdAt ?? nowIso()
      }
      await backend.upsertChallenge(challenge)
    },
    remove: (c) => backend.deleteChallenge(c.id),
    bulkImport: async (rows) => {
      let n = 0
      for (const r of rows) {
        await backend.upsertChallenge({ id: r.id ?? createId('ch'), title: r.title ?? 'Challenge', description: r.description ?? '', kind: r.kind ?? 'streak', goal: r.goal ?? 30, language: r.language ?? 'en', createdBy: r.createdBy ?? me(), startsAt: r.startsAt ?? nowIso().slice(0, 10), endsAt: r.endsAt ?? nowIso().slice(0, 10), cover: r.cover ?? 'from-amber-500 to-orange-700', imageUrl: r.imageUrl, participantCount: r.participantCount ?? 0, createdAt: r.createdAt ?? nowIso() })
        n++
      }
      return n
    }
  }
]

export function getResource(key: string): ResourceDef | undefined {
  return RESOURCES.find((r) => r.key === key)
}
