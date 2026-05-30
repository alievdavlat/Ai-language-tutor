/**
 * Question bank for the live multiplayer quiz (#14). Grammar/vocab MCQs across
 * a few packs. Real content so the synced game is actually playable; a teacher
 * authoring flow can replace this with course-derived questions later.
 */
export interface QuizQuestion {
  prompt: string
  /** Short title shown small above the prompt. */
  topic: string
  options: string[]
  /** Index into `options`. */
  correct: number
}

export interface QuizPack {
  id: string
  title: string
  subtitle: string
  questions: QuizQuestion[]
}

export const QUIZ_PACKS: QuizPack[] = [
  {
    id: 'past-tenses',
    title: 'Grammar Showdown · Past Tenses',
    subtitle: 'Conditionals, perfect & continuous',
    questions: [
      {
        topic: 'Third conditional',
        prompt: 'Choose the correct sentence',
        options: [
          'If I would have known, I would have come.',
          'If I had known, I would have come.',
          'If I knew, I would have come.',
          'If I have known, I would come.'
        ],
        correct: 1
      },
      {
        topic: 'Past perfect',
        prompt: 'By the time we arrived, the film ___ already.',
        options: ['started', 'has started', 'had started', 'was starting'],
        correct: 2
      },
      {
        topic: 'Past continuous',
        prompt: 'While she ___ dinner, the phone rang.',
        options: ['cooked', 'was cooking', 'had cooked', 'cooks'],
        correct: 1
      },
      {
        topic: 'Used to',
        prompt: 'I ___ play tennis every weekend, but I stopped years ago.',
        options: ['use to', 'used to', 'was used to', 'am used to'],
        correct: 1
      },
      {
        topic: 'Reported speech',
        prompt: 'She said she ___ tired.',
        options: ['is', 'was', 'has been', 'will be'],
        correct: 1
      }
    ]
  },
  {
    id: 'prepositions',
    title: 'Quick Fire · Prepositions',
    subtitle: 'in / on / at and friends',
    questions: [
      {
        topic: 'Time',
        prompt: 'The meeting is ___ Monday morning.',
        options: ['in', 'on', 'at', 'by'],
        correct: 1
      },
      {
        topic: 'Place',
        prompt: 'She is waiting ___ the bus stop.',
        options: ['in', 'on', 'at', 'to'],
        correct: 2
      },
      {
        topic: 'Phrasal',
        prompt: 'Please fill ___ this form.',
        options: ['in', 'on', 'of', 'up'],
        correct: 0
      },
      {
        topic: 'Dependent',
        prompt: 'He is really good ___ maths.',
        options: ['in', 'on', 'at', 'with'],
        correct: 2
      },
      {
        topic: 'Movement',
        prompt: 'They walked ___ the bridge to the old town.',
        options: ['across', 'through', 'into', 'among'],
        correct: 0
      }
    ]
  },
  {
    id: 'vocab-b1',
    title: 'Vocabulary Race · B1',
    subtitle: 'Everyday words & collocations',
    questions: [
      {
        topic: 'Synonym',
        prompt: 'Which word means almost the same as "huge"?',
        options: ['tiny', 'enormous', 'narrow', 'plain'],
        correct: 1
      },
      {
        topic: 'Collocation',
        prompt: 'You ___ a decision.',
        options: ['do', 'make', 'take', 'have'],
        correct: 1
      },
      {
        topic: 'Word form',
        prompt: 'The opposite of "generous" is ___.',
        options: ['mean', 'kind', 'rich', 'calm'],
        correct: 0
      },
      {
        topic: 'Idiom',
        prompt: '"To break the ice" means to ___.',
        options: [
          'cause an accident',
          'make people relax and talk',
          'cancel a plan',
          'spend money'
        ],
        correct: 1
      },
      {
        topic: 'Phrase',
        prompt: 'I can\'t ___ up my mind which one to buy.',
        options: ['make', 'do', 'take', 'get'],
        correct: 0
      }
    ]
  }
]

export function getPack(id: string): QuizPack {
  return QUIZ_PACKS.find((p) => p.id === id) ?? QUIZ_PACKS[0]
}

/** Seconds allowed per question. */
export const QUESTION_SECONDS = 20

/**
 * Kahoot-style scoring: full base for correct, plus a speed bonus that decays
 * linearly across the answer window. Wrong / no answer scores 0.
 */
export function scoreAnswer(correct: boolean, msTaken: number): number {
  if (!correct) return 0
  const base = 600
  const windowMs = QUESTION_SECONDS * 1000
  const speedFactor = Math.max(0, 1 - msTaken / windowMs)
  return Math.round(base + 400 * speedFactor)
}
