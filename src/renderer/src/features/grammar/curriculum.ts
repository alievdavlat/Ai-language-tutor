/**
 * Grammar curriculum — real lesson + exercise content for the skill tree and
 * the `/learn/exercise` player. Exercises come in three formats:
 *
 *   • mcq   — multiple choice (pick the right option)
 *   • fill  — fill-in-the-blank (type the missing word/phrase)
 *   • write — open writing transformation (rewrite the sentence)
 *
 * Practice lessons follow the classic drill progression
 * positive → negative → questions → mixed, encoded by the `phase` field so the
 * player can group/label them.
 */
import type { CEFRLevel } from '@shared/types'

export type ExerciseKind = 'mcq' | 'fill' | 'write'
export type DrillPhase = 'positive' | 'negative' | 'question' | 'mixed'

export interface Exercise {
  kind: ExerciseKind
  /** For fill/write the blank is written as `___`. */
  prompt: string
  hint?: string
  /** Drill phase, for the positive→negative→question→mixed progression. */
  phase?: DrillPhase
  // mcq
  options?: string[]
  correct?: number
  /** Accepted answers for fill/write (compared case-/punctuation-insensitively). */
  answers?: string[]
  /** Shown after answering. */
  explanation?: string
}

export interface GrammarLesson {
  id: string
  title: string
  kind: 'rule' | 'practice' | 'quiz'
  duration: string
  /** Plain-language rule bullets, shown for `rule` lessons. */
  rule?: string[]
  exercises: Exercise[]
}

export interface GrammarUnit {
  id: string
  number: number
  title: string
  about: string
  level: CEFRLevel
  /** Deep-dive guide id this unit links to, when one exists. */
  guideId?: GuideId
  lessons: GrammarLesson[]
}

// ─── Units ───────────────────────────────────────────────────────────────────

export const UNITS: GrammarUnit[] = [
  {
    id: 'articles',
    number: 1,
    title: 'Articles · a / an / the',
    about: 'When to use a, an, the — or nothing at all.',
    level: 'A1',
    guideId: 'articles',
    lessons: [
      {
        id: 'articles-rule',
        title: 'A, an, the — the basics',
        kind: 'rule',
        duration: '4 min',
        rule: [
          'Use **a** before a consonant sound (a book) and **an** before a vowel sound (an apple, an hour).',
          'Use **the** when both speaker and listener know which thing is meant.',
          'Use **no article** with plural or uncountable nouns spoken about in general (I like music).'
        ],
        exercises: [
          { kind: 'mcq', prompt: 'I bought ___ umbrella yesterday.', options: ['a', 'an', 'the', '—'], correct: 1, phase: 'positive', explanation: '“Umbrella” starts with a vowel sound → an.' },
          { kind: 'mcq', prompt: 'She is ___ honest person.', options: ['a', 'an', 'the', '—'], correct: 1, phase: 'positive', explanation: 'The h in “honest” is silent → vowel sound → an.' },
          { kind: 'fill', prompt: 'Can you pass me ___ salt, please?', answers: ['the'], phase: 'positive', explanation: 'Both people know which salt → the.' },
          { kind: 'mcq', prompt: 'I love ___ music.', options: ['a', 'an', 'the', '— (no article)'], correct: 3, phase: 'positive', explanation: 'Uncountable noun in general → no article.' }
        ]
      },
      {
        id: 'articles-practice',
        title: 'Practice — choose the article',
        kind: 'practice',
        duration: '5 min',
        exercises: [
          { kind: 'fill', prompt: 'There is ___ cat on the roof.', answers: ['a'], phase: 'positive' },
          { kind: 'fill', prompt: "It isn't ___ easy question.", answers: ['an'], phase: 'negative' },
          { kind: 'mcq', prompt: 'Is this ___ book you wanted?', options: ['a', 'an', 'the', '—'], correct: 2, phase: 'question', explanation: 'A specific, known book → the.' },
          { kind: 'fill', prompt: '___ sun rises in the east.', answers: ['the'], phase: 'mixed', explanation: 'Unique thing → the.' }
        ]
      }
    ]
  },
  {
    id: 'present-tenses',
    number: 2,
    title: 'Present tenses',
    about: 'Present simple vs present continuous.',
    level: 'A2',
    guideId: 'tenses',
    lessons: [
      {
        id: 'present-rule',
        title: 'Simple vs continuous',
        kind: 'rule',
        duration: '6 min',
        rule: [
          'Present **simple** = habits and facts: *She works in a bank.*',
          'Present **continuous** = happening now / temporary: *She is working from home this week.*',
          'Add **-s/-es** in the third person of the simple (he goes, she watches).'
        ],
        exercises: [
          { kind: 'mcq', prompt: 'She ___ to work every morning.', options: ['go', 'goes', 'going', 'is go'], correct: 1, phase: 'positive', explanation: 'Habit → present simple, third person → goes.' },
          { kind: 'fill', prompt: "Don't call now — I ___ (have) dinner.", answers: ['am having', "'m having"], phase: 'positive', explanation: 'Happening now → present continuous.' },
          { kind: 'write', prompt: 'Make negative: He plays tennis.', answers: ["he doesn't play tennis", 'he does not play tennis'], phase: 'negative', explanation: "Present simple negative → doesn't + base verb." },
          { kind: 'write', prompt: 'Make a question: They live in Madrid.', answers: ['do they live in madrid', 'do they live in madrid?'], phase: 'question', explanation: 'Present simple question → Do + subject + base verb.' },
          { kind: 'mcq', prompt: 'Look! It ___.', options: ['rains', 'is raining', 'rain', 'raining'], correct: 1, phase: 'mixed', explanation: 'Happening now → continuous.' }
        ]
      }
    ]
  },
  {
    id: 'questions',
    number: 3,
    title: 'Question formation',
    about: 'Yes/no questions, wh- questions, and word order.',
    level: 'A2',
    lessons: [
      {
        id: 'questions-practice',
        title: 'Build the question',
        kind: 'practice',
        duration: '5 min',
        exercises: [
          { kind: 'write', prompt: 'Make a question: She is from Italy.', answers: ['is she from italy', 'is she from italy?'], phase: 'question', explanation: 'With be, invert: Is she…?' },
          { kind: 'write', prompt: 'Make a question: You saw the film. (did)', answers: ['did you see the film', 'did you see the film?'], phase: 'question', explanation: 'Past simple question → Did + base verb.' },
          { kind: 'mcq', prompt: '___ do you live?', options: ['What', 'Where', 'Who', 'When'], correct: 1, phase: 'question', explanation: 'Asking about place → Where.' },
          { kind: 'fill', prompt: '___ many people came to the party?', answers: ['how'], phase: 'question', explanation: 'How many … for countable quantity.' }
        ]
      }
    ]
  },
  {
    id: 'past-tenses',
    number: 4,
    title: 'Past tenses',
    about: 'Past simple, past continuous, and past perfect.',
    level: 'B1',
    guideId: 'tenses',
    lessons: [
      {
        id: 'past-simple-rule',
        title: 'Past simple — regular & irregular',
        kind: 'rule',
        duration: '4 min',
        rule: [
          'Regular verbs add **-ed**: work → worked, play → played.',
          'Many common verbs are **irregular**: go → went, see → saw, have → had.',
          'Negatives and questions use **did(n’t)** + base verb: *I didn’t go. Did you go?*'
        ],
        exercises: [
          { kind: 'mcq', prompt: 'We ___ to London last year.', options: ['go', 'gone', 'went', 'going'], correct: 2, phase: 'positive', explanation: 'go is irregular → went.' },
          { kind: 'fill', prompt: 'She ___ (study) all night.', answers: ['studied'], phase: 'positive' },
          { kind: 'write', prompt: 'Make negative: They arrived early.', answers: ["they didn't arrive early", 'they did not arrive early'], phase: 'negative', explanation: 'Past negative → didn’t + base verb.' },
          { kind: 'write', prompt: 'Make a question: He finished the work.', answers: ['did he finish the work', 'did he finish the work?'], phase: 'question' }
        ]
      },
      {
        id: 'past-continuous-rule',
        title: 'Past continuous vs past simple',
        kind: 'rule',
        duration: '6 min',
        rule: [
          'Past **continuous** (was/were + -ing) sets the background: *I was cooking when…*',
          'Past **simple** is the shorter, completed action that interrupts: *…the phone rang.*'
        ],
        exercises: [
          { kind: 'mcq', prompt: 'While I ___ TV, the lights went out.', options: ['watched', 'was watching', 'watch', 'am watching'], correct: 1, phase: 'positive', explanation: 'Background action → past continuous.' },
          { kind: 'fill', prompt: 'When she called, I ___ (sleep).', answers: ['was sleeping'], phase: 'mixed' },
          { kind: 'mcq', prompt: 'They ___ dinner when we arrived.', options: ['had', 'were having', 'have', 'are having'], correct: 1, phase: 'mixed' }
        ]
      },
      {
        id: 'past-quiz',
        title: 'Unit quiz',
        kind: 'quiz',
        duration: '10 min',
        exercises: [
          { kind: 'mcq', prompt: 'By the time we arrived, the film ___.', options: ['started', 'has started', 'had started', 'starts'], correct: 2, phase: 'mixed', explanation: 'Earlier past action → past perfect.' },
          { kind: 'write', prompt: 'Make negative: I had seen that before.', answers: ["i hadn't seen that before", 'i had not seen that before'], phase: 'negative' },
          { kind: 'fill', prompt: 'We ___ (live) there for years before we moved.', answers: ['had lived', 'had been living'], phase: 'mixed' },
          { kind: 'write', prompt: 'Make a question: She had left already.', answers: ['had she left already', 'had she already left', 'had she left already?'], phase: 'question' }
        ]
      }
    ]
  },
  {
    id: 'conditionals',
    number: 5,
    title: 'Conditionals 0–3',
    about: 'Zero, first, second and third conditionals.',
    level: 'B1',
    guideId: 'conditionals',
    lessons: [
      {
        id: 'conditionals-rule',
        title: 'The four conditionals',
        kind: 'rule',
        duration: '7 min',
        rule: [
          '**Zero** (general truths): If you heat ice, it melts.',
          '**First** (real future): If it rains, we will stay home.',
          '**Second** (unreal present): If I had money, I would travel.',
          '**Third** (unreal past): If I had studied, I would have passed.'
        ],
        exercises: [
          { kind: 'mcq', prompt: 'If it rains, we ___ at home.', options: ['stay', 'will stay', 'stayed', 'would stay'], correct: 1, phase: 'positive', explanation: 'First conditional → will + base.' },
          { kind: 'fill', prompt: 'If I ___ (be) you, I would apologise.', answers: ['were', 'was'], phase: 'positive', explanation: 'Second conditional → past form (were).' },
          { kind: 'mcq', prompt: 'If she had studied, she ___ the exam.', options: ['would pass', 'will pass', 'would have passed', 'passed'], correct: 2, phase: 'mixed', explanation: 'Third conditional → would have + past participle.' },
          { kind: 'write', prompt: 'Make a question (first conditional): you / come / if I invite you', answers: ['will you come if i invite you', 'will you come if i invite you?'], phase: 'question' }
        ]
      }
    ]
  },
  {
    id: 'modals',
    number: 6,
    title: 'Modal verbs',
    about: 'can, could, must, should, might and more.',
    level: 'B1',
    guideId: 'modals',
    lessons: [
      {
        id: 'modals-rule',
        title: 'Ability, obligation, advice',
        kind: 'rule',
        duration: '6 min',
        rule: [
          '**can/could** = ability or permission.',
          '**must / have to** = strong obligation; **mustn’t** = prohibition.',
          '**should / ought to** = advice; **might / may / could** = possibility.'
        ],
        exercises: [
          { kind: 'mcq', prompt: 'You ___ smoke here — it is forbidden.', options: ["don't have to", "mustn't", 'should', 'could'], correct: 1, phase: 'negative', explanation: 'Prohibition → mustn’t.' },
          { kind: 'mcq', prompt: 'You look tired. You ___ get some rest.', options: ['must', 'should', 'can', 'might'], correct: 1, phase: 'positive', explanation: 'Advice → should.' },
          { kind: 'fill', prompt: 'When I was young, I ___ run very fast.', answers: ['could'], phase: 'positive', explanation: 'Past ability → could.' },
          { kind: 'write', prompt: 'Make a question: She can drive.', answers: ['can she drive', 'can she drive?'], phase: 'question' }
        ]
      }
    ]
  },
  {
    id: 'passive',
    number: 7,
    title: 'Passive voice',
    about: 'Forming and using the passive across tenses.',
    level: 'B2',
    lessons: [
      {
        id: 'passive-rule',
        title: 'Be + past participle',
        kind: 'rule',
        duration: '6 min',
        rule: [
          'Passive = **be** (in the right tense) + **past participle**.',
          'Use it when the doer is unknown or unimportant: *The window was broken.*',
          'Add the doer with **by** only if it matters: *…broken by the storm.*'
        ],
        exercises: [
          { kind: 'mcq', prompt: 'The bridge ___ in 1990.', options: ['built', 'was built', 'is building', 'has build'], correct: 1, phase: 'positive', explanation: 'Past passive → was + built.' },
          { kind: 'write', prompt: 'Make passive: They clean the office every day.', answers: ['the office is cleaned every day'], phase: 'positive', explanation: 'Present passive → is cleaned.' },
          { kind: 'fill', prompt: 'English ___ (speak) all over the world.', answers: ['is spoken'], phase: 'positive' },
          { kind: 'write', prompt: 'Make passive (question): Did someone send the letter?', answers: ['was the letter sent', 'was the letter sent?'], phase: 'question' }
        ]
      }
    ]
  },
  {
    id: 'reported-speech',
    number: 8,
    title: 'Reported speech',
    about: 'Telling people what others said.',
    level: 'B2',
    lessons: [
      {
        id: 'reported-rule',
        title: 'Backshift and pronouns',
        kind: 'rule',
        duration: '7 min',
        rule: [
          'Tenses usually shift back one step: present → past, will → would.',
          'Change pronouns and time words (now → then, tomorrow → the next day).',
          'Questions become statements: *“Where is it?” → She asked where it was.*'
        ],
        exercises: [
          { kind: 'mcq', prompt: '“I am tired.” → He said he ___ tired.', options: ['is', 'was', 'has been', 'will be'], correct: 1, phase: 'positive', explanation: 'Present → past on backshift.' },
          { kind: 'write', prompt: 'Report: “I will call you.” (She said …)', answers: ['she said she would call me', 'she said that she would call me'], phase: 'positive', explanation: 'will → would, you → me.' },
          { kind: 'write', prompt: 'Report the question: “Where do you live?” (He asked …)', answers: ['he asked where i lived', 'he asked where i live'], phase: 'question', explanation: 'Question → statement word order, backshift.' }
        ]
      }
    ]
  }
]

/** Normalise a free-text answer for forgiving comparison. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’`]/g, "'")
    .replace(/[.?!,]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** True if a typed answer matches any accepted answer (fill/write). */
export function checkAnswer(exercise: Exercise, typed: string): boolean {
  if (exercise.kind === 'mcq') return false
  const want = (exercise.answers ?? []).map(normalize)
  return want.includes(normalize(typed))
}

export function getUnit(unitId: string): GrammarUnit | undefined {
  return UNITS.find((u) => u.id === unitId)
}

export function getLesson(unitId: string, lessonId: string): { unit: GrammarUnit; lesson: GrammarLesson } | undefined {
  const unit = getUnit(unitId)
  const lesson = unit?.lessons.find((l) => l.id === lessonId)
  if (!unit || !lesson) return undefined
  return { unit, lesson }
}

// ─── Deep-dive guides + cheatsheets ───────────────────────────────────────────

export type GuideId = 'conditionals' | 'modals' | 'tenses' | 'articles'

export interface GuideSection {
  heading: string
  body: string[]
  examples?: string[]
}

export interface Guide {
  id: GuideId
  title: string
  level: string
  summary: string
  /** Quick-reference rows for the printable cheatsheet. */
  cheatRows: { form: string; use: string; example: string }[]
  sections: GuideSection[]
}

export const GUIDES: Record<GuideId, Guide> = {
  conditionals: {
    id: 'conditionals',
    title: 'Conditionals',
    level: 'A2–C1',
    summary: 'A complete walkthrough of the zero, first, second, third and mixed conditionals — when to use each and how to build them.',
    cheatRows: [
      { form: 'Zero: If + present, present', use: 'general truths', example: 'If you heat ice, it melts.' },
      { form: 'First: If + present, will + base', use: 'real future', example: 'If it rains, we will stay home.' },
      { form: 'Second: If + past, would + base', use: 'unreal present', example: 'If I had money, I would travel.' },
      { form: 'Third: If + past perfect, would have + pp', use: 'unreal past', example: 'If I had studied, I would have passed.' },
      { form: 'Mixed: If + past perfect, would + base', use: 'past condition → present result', example: 'If I had saved, I would be rich now.' }
    ],
    sections: [
      { heading: 'Zero conditional', body: ['Used for facts and things that are always true.', 'Both clauses use the present simple.'], examples: ['If you mix blue and yellow, you get green.', 'Water boils if you heat it to 100°C.'] },
      { heading: 'First conditional', body: ['Used for real, likely future situations.', 'The if-clause is present simple; the result uses will (or can/may/should).'], examples: ['If we leave now, we will catch the train.', 'If you study, you can pass.'] },
      { heading: 'Second conditional', body: ['Used for unreal or unlikely present/future situations.', 'If-clause: past simple. Result: would + base verb.', 'With “be”, use “were” for all subjects in careful English.'], examples: ['If I were you, I would apologise.', 'If she had time, she would help.'] },
      { heading: 'Third conditional', body: ['Used for unreal situations in the past — regrets and hypotheticals.', 'If-clause: past perfect. Result: would have + past participle.'], examples: ['If I had known, I would have called.', 'They would have won if they had trained harder.'] },
      { heading: 'Common mistakes', body: ['Don’t use “will” in the if-clause of the first conditional (✗ If it will rain…).', 'Don’t mix would into the if-clause (✗ If I would have…).'] }
    ]
  },
  modals: {
    id: 'modals',
    title: 'Modal verbs',
    level: 'A2–C1',
    summary: 'Ability, permission, obligation, advice, possibility and deduction — the full modal system with their past forms.',
    cheatRows: [
      { form: 'can / could', use: 'ability, permission', example: 'I can swim. Could I leave early?' },
      { form: 'must / have to', use: 'strong obligation', example: 'You must wear a helmet.' },
      { form: "mustn't", use: 'prohibition', example: "You mustn't park here." },
      { form: "don't have to", use: 'no obligation', example: "You don't have to come." },
      { form: 'should / ought to', use: 'advice', example: 'You should rest.' },
      { form: 'may / might / could', use: 'possibility', example: 'It might rain later.' },
      { form: 'must / can’t (deduction)', use: 'certainty', example: "He must be tired. She can't be serious." }
    ],
    sections: [
      { heading: 'Ability & permission', body: ['can/could express ability; could is the past of can.', 'Use can/could/may to ask for and give permission (may is more formal).'], examples: ['She can speak three languages.', 'Could you open the window?'] },
      { heading: 'Obligation & prohibition', body: ['must and have to both express obligation; must is often personal, have to external.', "mustn't = it is forbidden; don't have to = it is not necessary (very different!)."], examples: ["I must finish this tonight.", "Visitors mustn't feed the animals.", "You don't have to pay — it's free."] },
      { heading: 'Advice', body: ['should and ought to give advice or recommendations.', 'shouldn’t warns against something.'], examples: ['You should see a doctor.', "You shouldn't drive so fast."] },
      { heading: 'Possibility & deduction', body: ['may/might/could = something is possible.', 'must = the only logical conclusion; can’t = impossible.'], examples: ['They may be at home.', "She can't be 40 — she looks 25!"] }
    ]
  },
  tenses: {
    id: 'tenses',
    title: 'English tenses',
    level: 'A1–C1',
    summary: 'A map of the twelve tenses: how each is formed and the time it describes, from present simple to future perfect continuous.',
    cheatRows: [
      { form: 'Present simple', use: 'habits, facts', example: 'She works in a bank.' },
      { form: 'Present continuous', use: 'now, temporary', example: 'She is working from home.' },
      { form: 'Present perfect', use: 'past with present link', example: 'She has worked here for years.' },
      { form: 'Past simple', use: 'finished past', example: 'She worked there in 2019.' },
      { form: 'Past continuous', use: 'background action', example: 'She was working when I called.' },
      { form: 'Past perfect', use: 'earlier past', example: 'She had worked there before.' },
      { form: 'Future (will)', use: 'predictions, decisions', example: 'She will work tomorrow.' },
      { form: 'Future (going to)', use: 'plans, intentions', example: 'She is going to work abroad.' }
    ],
    sections: [
      { heading: 'Present tenses', body: ['Simple = habits/facts; continuous = happening now or temporary.', 'Perfect connects the past to now; perfect continuous emphasises duration.'], examples: ['I live in Tashkent.', 'I am living with friends this month.', 'I have lived here for ten years.'] },
      { heading: 'Past tenses', body: ['Simple = completed actions; continuous = the background.', 'Past perfect marks the earlier of two past events.'], examples: ['I watched a film.', 'I was watching a film when she arrived.', 'The film had started before we sat down.'] },
      { heading: 'Future forms', body: ['will = predictions, instant decisions, promises.', 'going to = plans and intentions, or evidence-based predictions.', 'Present continuous = fixed arrangements.'], examples: ["I'll help you.", "I'm going to start a business.", "I'm meeting Sara at 6."] }
    ]
  },
  articles: {
    id: 'articles',
    title: 'Articles',
    level: 'A1–B1',
    summary: 'a, an, the and the “zero article” — the rules that decide which one (if any) goes before a noun.',
    cheatRows: [
      { form: 'a', use: 'singular, consonant sound, not specific', example: 'a car, a university' },
      { form: 'an', use: 'singular, vowel sound, not specific', example: 'an egg, an hour' },
      { form: 'the', use: 'specific / known / unique', example: 'the sun, the book I read' },
      { form: '— (zero)', use: 'general plural/uncountable, most names', example: 'I like music. Cats are cute.' }
    ],
    sections: [
      { heading: 'A vs an', body: ['Choose by sound, not spelling: an hour (silent h), a university (you-niversity).'], examples: ['a European country', 'an honest answer'] },
      { heading: 'When to use the', body: ['Use the when there is only one, or when the listener knows which one.', 'Use the with superlatives, rivers, seas, and groups of islands.'], examples: ['the best day', 'the Atlantic', 'the Philippines'] },
      { heading: 'The zero article', body: ['No article with general plurals/uncountables, most countries, meals, and languages.'], examples: ['I love coffee.', 'She lives in Japan.', 'We had lunch.'] }
    ]
  }
}

// ─── 30-day challenge ──────────────────────────────────────────────────────────

export interface ChallengeDay {
  day: number
  focus: string
  exercises: Exercise[]
}

const PHASE_ORDER: DrillPhase[] = ['positive', 'negative', 'question', 'mixed']

/**
 * Build a deterministic 30-day challenge for a unit by cycling its exercise
 * pool through the positive→negative→question→mixed progression. Each day gets
 * a small, focused set so the streak is achievable in a few minutes.
 */
export function buildChallenge(unitId: string): { unit: GrammarUnit; days: ChallengeDay[] } | undefined {
  const unit = getUnit(unitId)
  if (!unit) return undefined
  const pool = unit.lessons.flatMap((l) => l.exercises)
  const days: ChallengeDay[] = []
  for (let day = 1; day <= 30; day++) {
    const phase = PHASE_ORDER[(day - 1) % PHASE_ORDER.length]
    // Prefer exercises matching the day's phase; fall back to the whole pool.
    const matching = pool.filter((e) => e.phase === phase)
    const source = matching.length >= 3 ? matching : pool
    const start = ((day - 1) * 2) % source.length
    const exercises = [0, 1, 2].map((i) => source[(start + i) % source.length])
    const focusLabel: Record<DrillPhase, string> = {
      positive: 'Affirmative sentences',
      negative: 'Negative sentences',
      question: 'Questions',
      mixed: 'Mixed review'
    }
    days.push({ day, focus: `${unit.title}: ${focusLabel[phase]}`, exercises })
  }
  return { unit, days }
}
