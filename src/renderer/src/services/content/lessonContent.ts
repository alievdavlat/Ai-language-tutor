/**
 * Rich per-lesson content: video title, "about" copy, downloadable materials,
 * a transcript, and (for coursebook `rule` lessons) structured book pages.
 *
 * Material URLs point at openly-hosted sample files so Download/Play work today;
 * when the Foundation Storage bucket lands these swap to signed Storage URLs.
 */
import type { Lesson } from '@shared/types'

export interface LessonMaterial {
  kind: 'pdf' | 'audio'
  name: string
  /** Human size for PDFs, duration for audio. */
  size: string
  url: string
}

export type BookBlock =
  | { kind: 'text'; text: string }
  | { kind: 'example'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'exercise'; title: string; items: string[] }

export interface BookPage {
  label: string
  blocks: BookBlock[]
}

export interface LessonContent {
  videoTitle: string
  about: string
  /** Teacher-authored rich article (markdown). Rendered above the tabs. */
  body?: string
  materials: LessonMaterial[]
  transcript: string
  /** Only for coursebook (`rule`) lessons. */
  bookPages?: BookPage[]
}

// Openly-hosted, hot-linkable sample assets (work without auth/CORS issues).
const SAMPLE_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
const SAMPLE_AUDIO = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

function worksheet(name: string): LessonMaterial {
  return { kind: 'pdf', name, size: '420 KB', url: SAMPLE_PDF }
}
function audio(name: string): LessonMaterial {
  return { kind: 'audio', name, size: '3:12', url: SAMPLE_AUDIO }
}

// ─── Explicit content (flagship lessons) ─────────────────────────────────────

const EXPLICIT: Record<string, LessonContent> = {
  l_everyday_1_1: {
    videoTitle: 'Saying hello — greetings that sound natural',
    about: 'Learn the greetings native speakers actually use, when to use formal vs casual hellos, and how to respond so a conversation keeps going instead of stalling.',
    materials: [worksheet('Greetings — worksheet.pdf'), worksheet('Useful phrases (handout).pdf'), audio('Listening: meeting someone new.mp3')],
    transcript:
      "Hi everyone, and welcome. Today we are looking at how to greet people in English. There are formal greetings, like \"good morning\" and \"how do you do\", and casual ones, like \"hey\" and \"what's up\". The key is to match the greeting to the situation and to always give a little extra — not just \"fine\", but \"I'm good, thanks — how about you?\"."
  },
  l_everyday_2_1: {
    videoTitle: 'At a café — ordering with confidence',
    about: 'Order drinks and food, ask about the menu, and handle the small back-and-forth at the counter.',
    materials: [worksheet('Café phrases — worksheet.pdf'), audio('Listening: at the counter.mp3')],
    transcript:
      "Hi, what can I get for you today? I'd like a medium latte, please. For here or to go? To go, thanks. Anything else? No, that's all. That'll be four fifty."
  },
  l_ielts_1_1: {
    videoTitle: 'IELTS Speaking Part 1 — how the interview works',
    about: 'Part 1 lasts four to five minutes. The examiner asks about familiar topics — your home, work, studies and interests. Answers should be natural, a couple of sentences long, with a reason or example.',
    materials: [worksheet('Part 1 question bank.pdf'), worksheet('Band descriptors (speaking).pdf'), audio('Model answers — Part 1.mp3')],
    transcript:
      "In Part 1, the examiner will introduce themselves and check your identity. Then they ask questions on two or three familiar topics. Don't give one-word answers — extend each answer with a reason, an example, or a contrast. Aim for two to three sentences."
  },
  l_pronun_1_1: {
    videoTitle: 'The /θ/ and /ð/ sounds — the English "th"',
    about: 'The two "th" sounds don\'t exist in many languages. Learn the tongue position for voiceless /θ/ (think) and voiced /ð/ (this), with minimal-pair drills.',
    materials: [worksheet('TH minimal pairs.pdf'), audio('Drill: think / this / three.mp3')],
    transcript:
      "Put the tip of your tongue lightly between your teeth. Now push air out without using your voice — that's the /θ/ in 'think', 'three', 'bath'. Now add your voice — that's the /ð/ in 'this', 'that', 'mother'. Feel the buzz in your throat for the voiced one."
  },
  l_business_1_1: {
    videoTitle: 'Professional email — tone and structure',
    about: 'A clear subject line, a purpose in the first sentence, short paragraphs, and a polite close. Learn the phrases that strike the right register — not too stiff, not too casual.',
    materials: [worksheet('Email templates.pdf'), worksheet('Polite phrase bank.pdf')],
    transcript:
      "Start with the purpose: 'I'm writing to confirm our meeting on Thursday.' Keep paragraphs short. Use polite, direct phrases like 'Could you please' and 'I'd appreciate it if'. Close with 'Best regards' for formal, 'Best' for semi-formal."
  }
}

// ─── Coursebook pages (rule lessons) ─────────────────────────────────────────

const BOOK_PAGES: Record<string, BookPage[]> = {
  l_egiu_1_1: [
    {
      label: 'A',
      blocks: [
        { kind: 'text', text: 'Study this example situation:' },
        { kind: 'example', text: 'Sarah is in her car. She is driving to work. → She is driving = she is driving now, at the time of speaking.' },
        { kind: 'text', text: 'The present continuous is: am / is / are + -ing.' },
        { kind: 'list', items: ['I am working (I\'m working)', 'she is driving (she\'s driving)', 'they are doing (they\'re doing)'] }
      ]
    },
    {
      label: 'B',
      blocks: [
        { kind: 'text', text: 'We use the present continuous for something that is happening now, at or around the moment of speaking:' },
        { kind: 'list', items: ['Please be quiet. I\'m working.', 'Listen to those people. What language are they speaking?', '"Where\'s Tom?" "He\'s having a shower."'] },
        { kind: 'text', text: 'The action is not necessarily happening at the exact moment — but around this period of time: I\'m reading a good book at the moment.' }
      ]
    },
    {
      label: '1.1',
      blocks: [
        { kind: 'exercise', title: 'Exercise 1.1 — Complete the sentences with the present continuous.', items: [
          'Please don\'t make so much noise. I ______ (try) to work.',
          'Let\'s go out now. It ______ (not / rain) any more.',
          'You ______ (work) hard today. Yes, I have a lot to do.',
          'Why ______ (you / look) at me like that? Stop it!'
        ] }
      ]
    }
  ],
  l_egiu_1_2: [
    {
      label: 'A',
      blocks: [
        { kind: 'text', text: 'We use the present simple for things in general, or things that happen repeatedly:' },
        { kind: 'list', items: ['Nurses look after patients in hospitals.', 'I usually go away at weekends.', 'The earth goes round the sun.'] },
        { kind: 'text', text: 'Remember: he / she / it takes an -s ending — works, lives, goes.' }
      ]
    },
    {
      label: 'B',
      blocks: [
        { kind: 'text', text: 'We use do / does to make questions and negatives:' },
        { kind: 'list', items: ['Do you play the piano?', 'Where does she live?', 'He doesn\'t drink coffee.'] }
      ]
    },
    {
      label: '2.1',
      blocks: [
        { kind: 'exercise', title: 'Exercise 2.1 — Put the verb into the correct form.', items: [
          'Water ______ (boil) at 100 degrees Celsius.',
          'The museum ______ (open) at nine every morning.',
          'She ______ (not / eat) meat.',
          '______ (you / speak) any other languages?'
        ] }
      ]
    }
  ],
  l_egiu_2_1: [
    {
      label: 'A',
      blocks: [
        { kind: 'text', text: 'We use the past simple for a completed action in the past:' },
        { kind: 'example', text: 'I played tennis yesterday. She went to the cinema last night.' },
        { kind: 'text', text: 'Regular verbs add -ed. Many common verbs are irregular: go → went, see → saw, have → had.' }
      ]
    },
    {
      label: '3.1',
      blocks: [
        { kind: 'exercise', title: 'Exercise 3.1 — Put the verb into the past simple.', items: [
          'We ______ (go) to a really nice restaurant last weekend.',
          'I ______ (see) Tom at the party but I ______ (not / speak) to him.',
          'What time ______ (you / get) up this morning?'
        ] }
      ]
    }
  ],
  l_egiu_2_2: [
    {
      label: 'A',
      blocks: [
        { kind: 'text', text: 'We use the past continuous (was / were + -ing) for an action in progress at a past moment:' },
        { kind: 'example', text: 'This time last year I was living in Brazil. What were you doing at 10 o\'clock last night?' },
        { kind: 'text', text: 'It often sets the scene for a past simple event: I was walking home when it started to rain.' }
      ]
    },
    {
      label: '4.1',
      blocks: [
        { kind: 'exercise', title: 'Exercise 4.1 — Past simple or past continuous?', items: [
          'I ______ (walk) home when I ______ (meet) Dan.',
          'While I ______ (cook) dinner, the phone ______ (ring).',
          'It ______ (rain) when we ______ (leave) the house.'
        ] }
      ]
    }
  ]
}

// ─── Lookup with sensible defaults ───────────────────────────────────────────

export function getLessonContent(lesson: Lesson): LessonContent {
  // Teacher-authored rich content (Creator Studio) takes precedence over any
  // built-in flagship content or generated fallback — render it faithfully.
  const c = lesson.content
  if (c && (c.body?.trim() || c.about?.trim() || c.transcript?.trim() || (c.materials && c.materials.length))) {
    const authored = c.materials?.map<LessonMaterial>((m) => ({ kind: m.kind, name: m.name, size: m.size ?? (m.kind === 'pdf' ? 'PDF' : 'Audio'), url: m.url })) ?? []
    return {
      videoTitle: lesson.title,
      about: c.about?.trim() || `In this lesson — "${lesson.title}" — you'll work through the key ideas, then practise what you've learned.`,
      body: c.body?.trim() || undefined,
      materials: authored,
      transcript: c.transcript?.trim() || 'No transcript for this lesson.',
      bookPages: BOOK_PAGES[lesson.id]
    }
  }

  const explicit = EXPLICIT[lesson.id]
  if (explicit) return explicit

  const bookPages = BOOK_PAGES[lesson.id]
  return {
    videoTitle: lesson.title,
    about: `In this lesson — "${lesson.title}" — you'll work through the key ideas with a short video, then practise what you've learned. Use the materials below to review afterwards.`,
    materials:
      lesson.kind === 'video'
        ? [worksheet(`${lesson.title} — worksheet.pdf`), audio(`${lesson.title} — listening.mp3`)]
        : [worksheet(`${lesson.title} — notes.pdf`)],
    transcript:
      lesson.kind === 'video'
        ? `Welcome back. In this lesson we focus on ${lesson.title.toLowerCase()}. Watch the video first, then try the practice that follows — repetition is what makes it stick.`
        : `Notes for ${lesson.title}.`,
    bookPages
  }
}

export function getBookPages(lessonId: string): BookPage[] | undefined {
  return BOOK_PAGES[lessonId]
}
