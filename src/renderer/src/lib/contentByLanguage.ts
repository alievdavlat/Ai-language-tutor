import type { TargetLanguage } from '@shared/types'

/**
 * Per-language catalog data used by Exams, Courses, Library, and Vocabulary
 * pages. The shells stay the same — only the listed items swap. When the
 * backend lands these will all become Supabase queries filtered by language.
 */

// ─── Exams ─────────────────────────────────────────────────────────────────

export interface ExamCard {
  id: string
  name: string
  flag: string
  description: string
  tint: string
  available: boolean
}

const EXAMS_EN: ExamCard[] = [
  { id: 'ielts', name: 'IELTS Academic', flag: '🇬🇧', description: 'Band 0–9 · 4 sections', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'toefl', name: 'TOEFL iBT', flag: '🇺🇸', description: 'Score 0–120 · 4 sections', tint: 'from-sky-500 to-blue-700', available: true },
  { id: 'cefr', name: 'CEFR Test', flag: '🇪🇺', description: 'A1–C2 placement', tint: 'from-violet-500 to-purple-700', available: true },
  { id: 'cambridge', name: 'Cambridge B2 First / C1', flag: '🇬🇧', description: 'FCE & CAE', tint: 'from-emerald-500 to-teal-700', available: true },
  { id: 'sat', name: 'SAT', flag: '🇺🇸', description: 'Reading + Writing + Math', tint: 'from-amber-500 to-orange-700', available: true }
]

const EXAMS_ES: ExamCard[] = [
  { id: 'dele', name: 'DELE', flag: '🇪🇸', description: 'Instituto Cervantes · A1–C2', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'siele', name: 'SIELE', flag: '🇪🇸', description: 'Modular Spanish test', tint: 'from-sky-500 to-blue-700', available: true },
  { id: 'cefr', name: 'CEFR Test', flag: '🇪🇺', description: 'A1–C2 placement', tint: 'from-violet-500 to-purple-700', available: true }
]

const EXAMS_FR: ExamCard[] = [
  { id: 'delf', name: 'DELF', flag: '🇫🇷', description: 'France Éducation · A1–B2', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'dalf', name: 'DALF', flag: '🇫🇷', description: 'Advanced · C1–C2', tint: 'from-sky-500 to-blue-700', available: true },
  { id: 'tcf', name: 'TCF', flag: '🇫🇷', description: 'Test de connaissance du français', tint: 'from-emerald-500 to-teal-700', available: true },
  { id: 'cefr', name: 'CEFR Test', flag: '🇪🇺', description: 'A1–C2 placement', tint: 'from-violet-500 to-purple-700', available: true }
]

const EXAMS_DE: ExamCard[] = [
  { id: 'goethe', name: 'Goethe-Zertifikat', flag: '🇩🇪', description: 'A1–C2 · Goethe-Institut', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'testdaf', name: 'TestDaF', flag: '🇩🇪', description: 'University admission', tint: 'from-sky-500 to-blue-700', available: true },
  { id: 'telc', name: 'telc Deutsch', flag: '🇩🇪', description: 'A1–C2', tint: 'from-emerald-500 to-teal-700', available: true },
  { id: 'cefr', name: 'CEFR Test', flag: '🇪🇺', description: 'A1–C2 placement', tint: 'from-violet-500 to-purple-700', available: true }
]

const EXAMS_JA: ExamCard[] = [
  { id: 'jlpt', name: 'JLPT', flag: '🇯🇵', description: 'N5 → N1 · 4 levels', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'jft', name: 'JFT-Basic', flag: '🇯🇵', description: 'A2 · Japan Foundation', tint: 'from-emerald-500 to-teal-700', available: true }
]

const EXAMS_KO: ExamCard[] = [
  { id: 'topik', name: 'TOPIK', flag: '🇰🇷', description: 'I (1-2) and II (3-6)', tint: 'from-rose-500 to-pink-700', available: true }
]

const EXAMS_ZH: ExamCard[] = [
  { id: 'hsk', name: 'HSK', flag: '🇨🇳', description: 'HSK 1 → HSK 9', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'hskk', name: 'HSKK', flag: '🇨🇳', description: 'Spoken Chinese test', tint: 'from-sky-500 to-blue-700', available: true }
]

const EXAMS_RU: ExamCard[] = [
  { id: 'torfl', name: 'ТРКИ / TORFL', flag: '🇷🇺', description: 'Russian as a foreign language · A1–C2', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'cefr', name: 'CEFR Test', flag: '🇪🇺', description: 'A1–C2 placement', tint: 'from-violet-500 to-purple-700', available: true }
]

const EXAMS_AR: ExamCard[] = [
  { id: 'alpt', name: 'ALPT', flag: '🇸🇦', description: 'Arabic Language Proficiency Test', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'cima', name: 'CIMA', flag: '🇫🇷', description: 'Certification arabe', tint: 'from-emerald-500 to-teal-700', available: true }
]

const EXAMS_IT: ExamCard[] = [
  { id: 'cils', name: 'CILS', flag: '🇮🇹', description: 'Università per Stranieri · A1–C2', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'celi', name: 'CELI', flag: '🇮🇹', description: 'Perugia · A1–C2', tint: 'from-sky-500 to-blue-700', available: true },
  { id: 'cefr', name: 'CEFR Test', flag: '🇪🇺', description: 'A1–C2 placement', tint: 'from-violet-500 to-purple-700', available: true }
]

const EXAMS_PT: ExamCard[] = [
  { id: 'caple', name: 'CAPLE', flag: '🇵🇹', description: 'Portuguese · A1–C2', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'celpe', name: 'CELPE-Bras', flag: '🇧🇷', description: 'Brazilian Portuguese', tint: 'from-emerald-500 to-teal-700', available: true }
]

const EXAMS_TR: ExamCard[] = [
  { id: 'tyt', name: 'TYS', flag: '🇹🇷', description: 'Turkish as foreign language · YEE', tint: 'from-rose-500 to-pink-700', available: true },
  { id: 'cefr', name: 'CEFR Test', flag: '🇪🇺', description: 'A1–C2 placement', tint: 'from-violet-500 to-purple-700', available: true }
]

const EXAMS_BY_LANG: Record<TargetLanguage, ExamCard[]> = {
  en: EXAMS_EN,
  es: EXAMS_ES,
  fr: EXAMS_FR,
  de: EXAMS_DE,
  ja: EXAMS_JA,
  ko: EXAMS_KO,
  zh: EXAMS_ZH,
  ru: EXAMS_RU,
  ar: EXAMS_AR,
  it: EXAMS_IT,
  pt: EXAMS_PT,
  tr: EXAMS_TR
}

export function getExamsForLanguage(lang: TargetLanguage): ExamCard[] {
  return EXAMS_BY_LANG[lang] ?? EXAMS_EN
}

// ─── Courses (level + skill tracks) ────────────────────────────────────────

export interface CourseCardData {
  id: string
  title: string
  level: string
  hours: number
  cover: string
}

const COURSE_THEMES: Record<TargetLanguage, { topic: string; cover: string }[]> = {
  en: [
    { topic: 'Everyday English', cover: 'from-sky-500 to-blue-700' },
    { topic: 'Business English', cover: 'from-violet-500 to-purple-700' },
    { topic: 'IELTS Speaking', cover: 'from-rose-500 to-pink-700' },
    { topic: 'American slang', cover: 'from-amber-500 to-orange-700' }
  ],
  es: [
    { topic: 'Español cotidiano', cover: 'from-amber-500 to-orange-700' },
    { topic: 'Español de negocios', cover: 'from-rose-500 to-pink-700' },
    { topic: 'DELE B1 prep', cover: 'from-sky-500 to-blue-700' },
    { topic: 'Latin American Spanish', cover: 'from-emerald-500 to-teal-700' }
  ],
  fr: [
    { topic: 'Français quotidien', cover: 'from-rose-500 to-pink-700' },
    { topic: 'Français des affaires', cover: 'from-sky-500 to-blue-700' },
    { topic: 'DELF B2 prep', cover: 'from-violet-500 to-purple-700' },
    { topic: 'French cinema dialogue', cover: 'from-amber-500 to-orange-700' }
  ],
  de: [
    { topic: 'Alltagsdeutsch', cover: 'from-orange-500 to-red-700' },
    { topic: 'Business Deutsch', cover: 'from-sky-500 to-blue-700' },
    { topic: 'Goethe B1 prep', cover: 'from-rose-500 to-pink-700' },
    { topic: 'Akademisches Deutsch', cover: 'from-emerald-500 to-teal-700' }
  ],
  ja: [
    { topic: '日常会話 · Daily conversation', cover: 'from-pink-500 to-rose-700' },
    { topic: 'Hiragana & Katakana', cover: 'from-rose-500 to-orange-700' },
    { topic: 'JLPT N4 prep', cover: 'from-violet-500 to-purple-700' },
    { topic: 'Anime listening', cover: 'from-amber-500 to-pink-700' }
  ],
  ko: [
    { topic: '한국어 회화 · Daily Korean', cover: 'from-violet-500 to-purple-700' },
    { topic: 'Hangul mastery', cover: 'from-rose-500 to-pink-700' },
    { topic: 'TOPIK 2 prep', cover: 'from-sky-500 to-blue-700' },
    { topic: 'K-drama Korean', cover: 'from-amber-500 to-rose-700' }
  ],
  zh: [
    { topic: '日常汉语 · Daily Chinese', cover: 'from-red-500 to-rose-700' },
    { topic: 'Pinyin & tones', cover: 'from-amber-500 to-red-700' },
    { topic: 'HSK 3 prep', cover: 'from-violet-500 to-purple-700' },
    { topic: 'Business Mandarin', cover: 'from-sky-500 to-blue-700' }
  ],
  ru: [
    { topic: 'Повседневный русский', cover: 'from-red-500 to-orange-700' },
    { topic: 'Cyrillic mastery', cover: 'from-sky-500 to-blue-700' },
    { topic: 'ТРКИ B1 prep', cover: 'from-violet-500 to-purple-700' },
    { topic: 'Russian literature reading', cover: 'from-amber-500 to-orange-700' }
  ],
  ar: [
    { topic: 'العربية اليومية', cover: 'from-emerald-500 to-teal-700' },
    { topic: 'MSA fundamentals', cover: 'from-sky-500 to-blue-700' },
    { topic: 'Egyptian dialect', cover: 'from-amber-500 to-orange-700' },
    { topic: 'Quranic Arabic', cover: 'from-violet-500 to-purple-700' }
  ],
  it: [
    { topic: 'Italiano quotidiano', cover: 'from-green-500 to-emerald-700' },
    { topic: 'Italian for travelers', cover: 'from-rose-500 to-pink-700' },
    { topic: 'CILS B1 prep', cover: 'from-sky-500 to-blue-700' },
    { topic: 'Italian cinema dialogue', cover: 'from-amber-500 to-orange-700' }
  ],
  pt: [
    { topic: 'Português brasileiro', cover: 'from-cyan-500 to-teal-700' },
    { topic: 'Português europeu', cover: 'from-emerald-500 to-green-700' },
    { topic: 'CELPE-Bras prep', cover: 'from-rose-500 to-pink-700' },
    { topic: 'Bossa nova listening', cover: 'from-amber-500 to-orange-700' }
  ],
  tr: [
    { topic: 'Günlük Türkçe', cover: 'from-sky-500 to-blue-700' },
    { topic: 'Survival Turkish', cover: 'from-rose-500 to-pink-700' },
    { topic: 'TYS prep', cover: 'from-violet-500 to-purple-700' },
    { topic: 'Turkish drama listening', cover: 'from-amber-500 to-orange-700' }
  ]
}

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const

export function getCoursesForLanguage(lang: TargetLanguage): CourseCardData[] {
  const themes = COURSE_THEMES[lang] ?? COURSE_THEMES.en
  return themes.map((t, i) => ({
    id: `${lang}-${i}`,
    title: t.topic,
    level: LEVELS[i % LEVELS.length],
    hours: 14 + i * 6,
    cover: t.cover
  }))
}

// ─── Vocabulary trending decks ─────────────────────────────────────────────

export interface DeckMeta {
  title: string
  count: number
  emoji: string
  cover: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

const TRENDING_DECKS: Record<TargetLanguage, DeckMeta[]> = {
  en: [
    { title: 'Restaurant essentials', count: 24, emoji: '🍝', cover: 'from-rose-500 to-orange-500', difficulty: 'EASY' },
    { title: 'Job interviews', count: 38, emoji: '💼', cover: 'from-violet-500 to-purple-700', difficulty: 'MEDIUM' },
    { title: 'Phrasal verbs', count: 62, emoji: '🔤', cover: 'from-amber-500 to-rose-500', difficulty: 'HARD' },
    { title: 'Daily small talk', count: 28, emoji: '☕', cover: 'from-emerald-500 to-teal-700', difficulty: 'EASY' }
  ],
  es: [
    { title: 'Comida y restaurantes', count: 26, emoji: '🥘', cover: 'from-amber-500 to-orange-700', difficulty: 'EASY' },
    { title: 'Pretérito vs. imperfecto', count: 30, emoji: '⏳', cover: 'from-violet-500 to-purple-700', difficulty: 'HARD' },
    { title: 'Saludos y presentaciones', count: 22, emoji: '👋', cover: 'from-rose-500 to-pink-700', difficulty: 'EASY' },
    { title: 'Modismos cotidianos', count: 40, emoji: '🗯️', cover: 'from-sky-500 to-blue-700', difficulty: 'MEDIUM' }
  ],
  fr: [
    { title: 'Au restaurant', count: 24, emoji: '🥐', cover: 'from-rose-500 to-pink-700', difficulty: 'EASY' },
    { title: 'Faux amis', count: 36, emoji: '⚠️', cover: 'from-amber-500 to-orange-700', difficulty: 'HARD' },
    { title: 'Argot français', count: 30, emoji: '🗯️', cover: 'from-violet-500 to-purple-700', difficulty: 'MEDIUM' },
    { title: 'Conversation polie', count: 22, emoji: '☕', cover: 'from-sky-500 to-blue-700', difficulty: 'EASY' }
  ],
  de: [
    { title: 'Im Restaurant', count: 24, emoji: '🥨', cover: 'from-orange-500 to-red-700', difficulty: 'EASY' },
    { title: 'Trennbare Verben', count: 42, emoji: '🔗', cover: 'from-sky-500 to-blue-700', difficulty: 'HARD' },
    { title: 'Modalpartikeln', count: 18, emoji: '✨', cover: 'from-violet-500 to-purple-700', difficulty: 'HARD' },
    { title: 'Alltagswortschatz', count: 32, emoji: '🏠', cover: 'from-emerald-500 to-teal-700', difficulty: 'EASY' }
  ],
  ja: [
    { title: '日常 · Daily Japanese', count: 30, emoji: '🍱', cover: 'from-pink-500 to-rose-700', difficulty: 'EASY' },
    { title: 'Hiragana drills', count: 46, emoji: 'あ', cover: 'from-amber-500 to-orange-700', difficulty: 'MEDIUM' },
    { title: 'JLPT N5 vocab', count: 100, emoji: '📚', cover: 'from-violet-500 to-purple-700', difficulty: 'HARD' },
    { title: 'Polite Japanese', count: 24, emoji: '🙇', cover: 'from-sky-500 to-blue-700', difficulty: 'MEDIUM' }
  ],
  ko: [
    { title: '한식 어휘 · Food', count: 28, emoji: '🍜', cover: 'from-rose-500 to-pink-700', difficulty: 'EASY' },
    { title: 'Hangul mastery', count: 40, emoji: '한', cover: 'from-violet-500 to-purple-700', difficulty: 'MEDIUM' },
    { title: 'TOPIK I vocab', count: 80, emoji: '📚', cover: 'from-sky-500 to-blue-700', difficulty: 'HARD' },
    { title: 'K-drama phrases', count: 32, emoji: '🎬', cover: 'from-amber-500 to-rose-700', difficulty: 'MEDIUM' }
  ],
  zh: [
    { title: '点菜 · Ordering food', count: 24, emoji: '🥟', cover: 'from-red-500 to-rose-700', difficulty: 'EASY' },
    { title: 'Pinyin tones', count: 36, emoji: '声', cover: 'from-amber-500 to-orange-700', difficulty: 'MEDIUM' },
    { title: 'HSK 2 vocabulary', count: 150, emoji: '📚', cover: 'from-violet-500 to-purple-700', difficulty: 'HARD' },
    { title: 'Chinese idioms', count: 40, emoji: '🐉', cover: 'from-sky-500 to-blue-700', difficulty: 'HARD' }
  ],
  ru: [
    { title: 'Еда и рестораны', count: 26, emoji: '🥟', cover: 'from-red-500 to-orange-700', difficulty: 'EASY' },
    { title: 'Кириллица drills', count: 33, emoji: 'Я', cover: 'from-sky-500 to-blue-700', difficulty: 'MEDIUM' },
    { title: 'Падежи · Cases', count: 60, emoji: '🧩', cover: 'from-violet-500 to-purple-700', difficulty: 'HARD' },
    { title: 'Daily Russian phrases', count: 28, emoji: '☕', cover: 'from-amber-500 to-orange-700', difficulty: 'EASY' }
  ],
  ar: [
    { title: 'مطعم · Restaurant', count: 24, emoji: '🥙', cover: 'from-emerald-500 to-teal-700', difficulty: 'EASY' },
    { title: 'Arabic script drills', count: 30, emoji: 'ا', cover: 'from-amber-500 to-orange-700', difficulty: 'MEDIUM' },
    { title: 'MSA essentials', count: 50, emoji: '📚', cover: 'from-violet-500 to-purple-700', difficulty: 'HARD' },
    { title: 'Greetings', count: 18, emoji: '🤝', cover: 'from-sky-500 to-blue-700', difficulty: 'EASY' }
  ],
  it: [
    { title: 'Al ristorante', count: 24, emoji: '🍕', cover: 'from-green-500 to-emerald-700', difficulty: 'EASY' },
    { title: 'Pronomi complemento', count: 30, emoji: '🧩', cover: 'from-violet-500 to-purple-700', difficulty: 'HARD' },
    { title: 'Italian idioms', count: 36, emoji: '🗯️', cover: 'from-amber-500 to-orange-700', difficulty: 'MEDIUM' },
    { title: 'Daily Italian', count: 28, emoji: '☕', cover: 'from-rose-500 to-pink-700', difficulty: 'EASY' }
  ],
  pt: [
    { title: 'Restaurante', count: 24, emoji: '🍤', cover: 'from-cyan-500 to-teal-700', difficulty: 'EASY' },
    { title: 'Pretérito vs. imperfeito', count: 30, emoji: '⏳', cover: 'from-violet-500 to-purple-700', difficulty: 'HARD' },
    { title: 'Brazilian slang', count: 32, emoji: '🗯️', cover: 'from-amber-500 to-orange-700', difficulty: 'MEDIUM' },
    { title: 'Saudações', count: 20, emoji: '👋', cover: 'from-emerald-500 to-green-700', difficulty: 'EASY' }
  ],
  tr: [
    { title: 'Restoranda', count: 24, emoji: '🥙', cover: 'from-sky-500 to-blue-700', difficulty: 'EASY' },
    { title: 'Türkçe ekler', count: 38, emoji: '🔗', cover: 'from-violet-500 to-purple-700', difficulty: 'HARD' },
    { title: 'Günlük Türkçe', count: 28, emoji: '☕', cover: 'from-rose-500 to-pink-700', difficulty: 'EASY' },
    { title: 'Turkish idioms', count: 30, emoji: '🗯️', cover: 'from-amber-500 to-orange-700', difficulty: 'MEDIUM' }
  ]
}

export function getTrendingDecksForLanguage(lang: TargetLanguage): DeckMeta[] {
  return TRENDING_DECKS[lang] ?? TRENDING_DECKS.en
}

// ─── Library shelves (videos / books / podcasts) ───────────────────────────

export interface LibraryItem {
  title: string
  author: string
  duration?: string
  pages?: number
  cover: string
}

const LIBRARY_BY_LANG: Record<TargetLanguage, { videos: LibraryItem[]; books: LibraryItem[]; podcasts: LibraryItem[] }> = {
  en: {
    videos: [
      { title: 'Master the present perfect', author: 'GrammarLab', duration: '12:04', cover: 'from-rose-500 to-pink-700' },
      { title: 'How natives actually speak', author: 'EnglishWithEmma', duration: '08:33', cover: 'from-sky-500 to-blue-700' }
    ],
    books: [
      { title: 'English Grammar in Use', author: 'Raymond Murphy', pages: 380, cover: 'from-blue-600 to-blue-800' },
      { title: 'Word Power Made Easy', author: 'Norman Lewis', pages: 690, cover: 'from-emerald-500 to-teal-700' }
    ],
    podcasts: [
      { title: 'The English We Speak', author: 'BBC', duration: '03–05 min', cover: 'from-violet-500 to-purple-700' }
    ]
  },
  es: {
    videos: [
      { title: 'Subjuntivo en 10 min', author: 'Español con Juan', duration: '10:24', cover: 'from-amber-500 to-orange-700' },
      { title: 'Pronunciación clara', author: 'Lingoda', duration: '07:55', cover: 'from-rose-500 to-pink-700' }
    ],
    books: [
      { title: 'Gramática de uso del español', author: 'Aragonés & Palencia', pages: 320, cover: 'from-rose-500 to-pink-700' },
      { title: 'Aula Internacional', author: 'Difusión', pages: 220, cover: 'from-violet-500 to-purple-700' }
    ],
    podcasts: [
      { title: 'News in Slow Spanish', author: 'NISS', duration: '15 min', cover: 'from-emerald-500 to-teal-700' }
    ]
  },
  fr: {
    videos: [
      { title: 'Comprendre le subjonctif', author: 'Français Authentique', duration: '11:20', cover: 'from-rose-500 to-pink-700' }
    ],
    books: [
      { title: 'Grammaire progressive du français', author: 'CLE International', pages: 250, cover: 'from-sky-500 to-blue-700' }
    ],
    podcasts: [
      { title: 'InnerFrench', author: 'Hugo Cotton', duration: '20 min', cover: 'from-violet-500 to-purple-700' }
    ]
  },
  de: {
    videos: [
      { title: 'Trennbare Verben erklärt', author: 'Easy German', duration: '09:14', cover: 'from-orange-500 to-red-700' }
    ],
    books: [
      { title: 'Hammer\'s German Grammar', author: 'Martin Durrell', pages: 540, cover: 'from-sky-500 to-blue-700' }
    ],
    podcasts: [
      { title: 'Slow German', author: 'Annik Rubens', duration: '06 min', cover: 'from-emerald-500 to-teal-700' }
    ]
  },
  ja: {
    videos: [
      { title: 'Hiragana in 1 hour', author: 'JapanesePod101', duration: '58:00', cover: 'from-pink-500 to-rose-700' }
    ],
    books: [
      { title: 'Genki I', author: 'Banno et al.', pages: 380, cover: 'from-amber-500 to-orange-700' }
    ],
    podcasts: [
      { title: 'NHK World Easy Japanese', author: 'NHK', duration: '10 min', cover: 'from-rose-500 to-pink-700' }
    ]
  },
  ko: {
    videos: [
      { title: 'Hangul in 15 min', author: 'Talk To Me In Korean', duration: '15:30', cover: 'from-violet-500 to-purple-700' }
    ],
    books: [
      { title: 'Korean Grammar in Use', author: 'Min Jin-young', pages: 380, cover: 'from-rose-500 to-pink-700' }
    ],
    podcasts: [
      { title: 'Iyagi · TTMIK', author: 'TTMIK', duration: '12 min', cover: 'from-sky-500 to-blue-700' }
    ]
  },
  zh: {
    videos: [
      { title: 'Mastering 4 tones', author: 'Mandarin Corner', duration: '10:10', cover: 'from-red-500 to-rose-700' }
    ],
    books: [
      { title: 'New Practical Chinese Reader', author: 'Liu Xun', pages: 320, cover: 'from-amber-500 to-orange-700' }
    ],
    podcasts: [
      { title: 'Slow Chinese', author: 'maayot', duration: '08 min', cover: 'from-violet-500 to-purple-700' }
    ]
  },
  ru: {
    videos: [
      { title: 'Cyrillic alphabet — 30 min', author: 'RussianPod101', duration: '30:00', cover: 'from-red-500 to-orange-700' }
    ],
    books: [
      { title: 'Russian Grammar by Pulkina', author: 'I.M. Pulkina', pages: 420, cover: 'from-sky-500 to-blue-700' }
    ],
    podcasts: [
      { title: 'Slow Russian', author: 'Daria Molchanova', duration: '10 min', cover: 'from-violet-500 to-purple-700' }
    ]
  },
  ar: {
    videos: [
      { title: 'Arabic alphabet — full guide', author: 'ArabicPod101', duration: '45:00', cover: 'from-emerald-500 to-teal-700' }
    ],
    books: [
      { title: 'Al-Kitaab', author: 'Kristen Brustad', pages: 480, cover: 'from-amber-500 to-orange-700' }
    ],
    podcasts: [
      { title: 'ArabicPod101', author: 'Innovative', duration: '12 min', cover: 'from-violet-500 to-purple-700' }
    ]
  },
  it: {
    videos: [
      { title: 'Italian congiuntivo explained', author: 'Learn Italian with Lucrezia', duration: '14:20', cover: 'from-green-500 to-emerald-700' }
    ],
    books: [
      { title: 'Nuovo Espresso 1', author: 'Alma Edizioni', pages: 200, cover: 'from-rose-500 to-pink-700' }
    ],
    podcasts: [
      { title: 'News in Slow Italian', author: 'NISI', duration: '15 min', cover: 'from-violet-500 to-purple-700' }
    ]
  },
  pt: {
    videos: [
      { title: 'Brazilian vs. European Portuguese', author: 'PortuguesePod101', duration: '11:00', cover: 'from-cyan-500 to-teal-700' }
    ],
    books: [
      { title: 'Ponto de Encontro', author: 'Klobucka et al.', pages: 480, cover: 'from-amber-500 to-orange-700' }
    ],
    podcasts: [
      { title: 'Carioca Connection', author: 'Foster & Alexia', duration: '15 min', cover: 'from-emerald-500 to-green-700' }
    ]
  },
  tr: {
    videos: [
      { title: 'Türkçe ekler tek videoda', author: 'Turkish Tea Time', duration: '13:15', cover: 'from-sky-500 to-blue-700' }
    ],
    books: [
      { title: 'Yeni Hitit', author: 'Ankara Üniversitesi', pages: 220, cover: 'from-rose-500 to-pink-700' }
    ],
    podcasts: [
      { title: 'Turkish Tea Time', author: 'Yiğit & Christine', duration: '12 min', cover: 'from-violet-500 to-purple-700' }
    ]
  }
}

export function getLibraryForLanguage(lang: TargetLanguage): { videos: LibraryItem[]; books: LibraryItem[]; podcasts: LibraryItem[] } {
  return LIBRARY_BY_LANG[lang] ?? LIBRARY_BY_LANG.en
}
