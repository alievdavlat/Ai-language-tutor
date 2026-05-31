/**
 * Real exam question banks + scoring for the mock-test engine.
 *
 * Objective sections (listening/reading/grammar/math/verbal) carry answer keys
 * and are auto-scored. Writing is graded by the LLM (`writingScore.ts`).
 * Speaking is graded by the LLM against a band rubric on the spoken/typed
 * transcript (`speakingScore.ts`).
 *
 * Each exam family has a `score()` function that turns raw section results into
 * the family's reporting scale (IELTS band, TOEFL /120, SAT /1600, etc.).
 */
import type { ExamKind } from '@shared/types'
import type { SectionResult } from '@shared/types/study.types'

export interface MCQItem {
  id: string
  prompt: string
  options: string[]
  /** Index of the correct option. */
  correct: number
}

export type SectionKind = 'mcq' | 'writing' | 'speaking'

export interface MCQSection {
  id: string
  label: string
  kind: 'mcq'
  minutes: number
  /** Optional reading stimulus shown above the questions. */
  passage?: string
  /**
   * For listening sections — a real audio recording (uploaded file or recorded
   * clip): a public/Storage URL or a `data:` URL. When present the player
   * streams this; otherwise the player synthesizes the `audioTranscript` with
   * neural TTS so a listening section is never silent.
   */
  audioUrl?: string
  /**
   * Listening script. Drives TTS playback when there is no `audioUrl`, and is
   * the text revealed in the post-test review. It is HIDDEN during the attempt
   * so a listening section tests listening, not reading.
   */
  audioTranscript?: string
  items: MCQItem[]
}

export interface WritingSection {
  id: string
  label: string
  kind: 'writing'
  minutes: number
  prompt: string
  minWords: number
}

export interface SpeakingSection {
  id: string
  label: string
  kind: 'speaking'
  minutes: number
  prompts: { id: string; part: string; prompt: string }[]
}

export type ExamSection = MCQSection | WritingSection | SpeakingSection

export interface ExamBank {
  id: string
  kind: ExamKind
  title: string
  scaleLabel: string
  sections: ExamSection[]
}

// ─── Passages (distinct per family so Listening ≠ Reading and no two
//     families share a stimulus) ────────────────────────────────────────────

// IELTS reading.
const INDUSTRIAL = `The Industrial Revolution marked a major turning point in history. Almost every aspect of daily life was influenced in some way. Average income and population began to exhibit unprecedented sustained growth. Economists argue that the most important effect was that the standard of living for the general population began to increase consistently for the first time in history, although others have said it did not begin to improve meaningfully until the late 19th and 20th centuries.`

// IELTS listening — library enquiry.
const LIBRARY_DIALOGUE = `WOMAN: Hi, I'd like to know your opening hours. MAN: Sure. On weekdays we're open from nine in the morning until eight in the evening. WOMAN: And weekends? MAN: Saturdays ten to six, and we're closed on Sundays. To borrow books you'll need a membership card, which is free for students. You can keep most books for three weeks.`

// TOEFL reading — an academic science passage.
const BEE_DANCE = `Honeybees communicate the location of food through a behaviour known as the waggle dance. When a foraging bee returns to the hive after finding a rich source of nectar, it performs a figure-eight movement on the vertical surface of the comb. The angle of the straight "waggle" run relative to vertical encodes the direction of the food in relation to the sun, while the duration of the waggle signals the distance. Other bees follow the dancer in the dark, sensing its movements through touch and vibration, and then fly directly to the source. First decoded by Karl von Frisch, the dance showed that a non-human animal could convey abstract spatial information through a symbolic code.`

// TOEFL listening — a campus advising conversation.
const ADVISING_DIALOGUE = `STUDENT: Hi, Professor Lee, I wanted to ask about dropping the statistics course. ADVISOR: Of course. You should know the deadline to drop without a grade penalty is this Friday. STUDENT: Oh, I didn't realise it was so soon. If I drop it, will I still be a full-time student? ADVISOR: Good question. You're taking fifteen credits, and statistics is four, so dropping it leaves you at eleven. Full-time status needs twelve, so you'd fall just below. STUDENT: That could affect my scholarship. ADVISOR: Exactly. Speak with the financial aid office before you decide, and consider switching to the pass/fail option instead of dropping.`

// SAT reading & writing — a history passage.
const PRINTING_PRESS = `When Johannes Gutenberg introduced movable-type printing to Europe in the mid-fifteenth century, few could have predicted how thoroughly it would reshape society. Before the press, books were copied by hand, a process so slow and costly that literacy remained the privilege of a narrow elite. The new technology drove the price of a book down dramatically within a few decades, and as texts multiplied, so did readers. Ideas that once travelled at the pace of a walking scribe now spread across the continent in months. Some scholars argue that without this sudden abundance of printed material, neither the Reformation nor the scientific revolution would have unfolded as rapidly as they did.`

// ─── Banks ──────────────────────────────────────────────────────────────────

export const BANKS: Record<string, ExamBank> = {
  ielts: {
    id: 'ielts',
    kind: 'ielts',
    title: 'IELTS Academic',
    scaleLabel: 'Overall band',
    sections: [
      {
        id: 'listening',
        label: 'Listening',
        kind: 'mcq',
        minutes: 30,
        audioTranscript: LIBRARY_DIALOGUE,
        items: [
          { id: 'l1', prompt: 'What time does the library close on weekdays?', options: ['6 pm', '8 pm', '9 pm', '10 pm'], correct: 1 },
          { id: 'l2', prompt: 'When is the library closed?', options: ['Saturdays', 'Sundays', 'Weekdays', 'Never'], correct: 1 },
          { id: 'l3', prompt: 'How much does a student membership card cost?', options: ['$10', '$5', "It's free", '$20'], correct: 2 },
          { id: 'l4', prompt: 'How long can you keep most books?', options: ['One week', 'Two weeks', 'Three weeks', 'A month'], correct: 2 },
          { id: 'l5', prompt: 'What are Saturday opening hours?', options: ['9–8', '10–6', '10–8', '9–6'], correct: 1 },
          { id: 'l6', prompt: 'What do you need to borrow books?', options: ['A deposit', 'A membership card', 'A passport', 'Nothing'], correct: 1 }
        ]
      },
      {
        id: 'reading',
        label: 'Reading',
        kind: 'mcq',
        minutes: 60,
        passage: INDUSTRIAL,
        items: [
          { id: 'r1', prompt: 'According to the passage, what began to grow at an unprecedented rate?', options: ['Trade routes', 'Income and population', 'Factory size', 'Government power'], correct: 1 },
          { id: 'r2', prompt: 'What do economists say was the most important effect?', options: ['Rising standard of living', 'More factories', 'Faster travel', 'Bigger cities'], correct: 0 },
          { id: 'r3', prompt: 'Some historians argue living standards improved meaningfully only in the…', options: ['early 1700s', 'late 19th–20th centuries', 'Middle Ages', '21st century'], correct: 1 },
          { id: 'r4', prompt: 'The phrase "turning point" most nearly means…', options: ['a small change', 'a decisive moment', 'a mistake', 'a slow decline'], correct: 1 },
          { id: 'r5', prompt: 'The passage is mainly about the Revolution\'s…', options: ['causes', 'effects on daily life', 'key inventors', 'geography'], correct: 1 },
          { id: 'r6', prompt: 'The author\'s tone is best described as…', options: ['informative', 'angry', 'humorous', 'fearful'], correct: 0 }
        ]
      },
      {
        id: 'writing',
        label: 'Writing',
        kind: 'writing',
        minutes: 60,
        prompt: 'Some people think technology makes life more complex. To what extent do you agree or disagree? Write at least 250 words.',
        minWords: 250
      },
      {
        id: 'speaking',
        label: 'Speaking',
        kind: 'speaking',
        minutes: 14,
        prompts: [
          { id: 's1', part: 'Part 1', prompt: "Let's talk about your hometown. Where is it and what is it like?" },
          { id: 's2', part: 'Part 2', prompt: 'Describe a skill you would like to learn. You should say what it is, why you want to learn it, and how you would do it.' },
          { id: 's3', part: 'Part 3', prompt: 'Do you think it is better to learn new skills when you are young or older? Why?' }
        ]
      }
    ]
  },

  toefl: {
    id: 'toefl',
    kind: 'toefl',
    title: 'TOEFL iBT',
    scaleLabel: 'Total score',
    sections: [
      {
        id: 'reading',
        label: 'Reading',
        kind: 'mcq',
        minutes: 54,
        passage: BEE_DANCE,
        items: [
          { id: 'r1', prompt: 'What is the passage mainly about?', options: ['How bees make honey', 'How bees signal where food is', 'Why bees sting', 'How hives are built'], correct: 1 },
          { id: 'r2', prompt: 'The angle of the waggle run encodes the food\'s…', options: ['size', 'direction relative to the sun', 'colour', 'sweetness'], correct: 1 },
          { id: 'r3', prompt: 'The duration of the waggle signals the…', options: ['distance to the food', 'number of bees needed', 'time of day', 'wind speed'], correct: 0 },
          { id: 'r4', prompt: 'How do other bees perceive the dance in the dark hive?', options: ['By sight', 'Through touch and vibration', 'By smell only', 'Through sound alone'], correct: 1 },
          { id: 'r5', prompt: '"Abstract spatial information" suggests the dance works as a…', options: ['random movement', 'symbolic code', 'warning signal', 'mating display'], correct: 1 },
          { id: 'r6', prompt: 'Who first decoded the waggle dance?', options: ['Charles Darwin', 'Karl von Frisch', 'Gregor Mendel', 'Jane Goodall'], correct: 1 }
        ]
      },
      {
        id: 'listening',
        label: 'Listening',
        kind: 'mcq',
        minutes: 41,
        audioTranscript: ADVISING_DIALOGUE,
        items: [
          { id: 'l1', prompt: 'Why is the student speaking with the advisor?', options: ['To choose a major', 'To ask about dropping a course', 'To request a recommendation', 'To report a grade error'], correct: 1 },
          { id: 'l2', prompt: 'When is the deadline to drop without a grade penalty?', options: ['Today', 'This Friday', 'Next month', 'End of term'], correct: 1 },
          { id: 'l3', prompt: 'How many credits is the statistics course?', options: ['Two', 'Three', 'Four', 'Five'], correct: 2 },
          { id: 'l4', prompt: 'After dropping it, how many credits would the student have?', options: ['Nine', 'Eleven', 'Twelve', 'Fifteen'], correct: 1 },
          { id: 'l5', prompt: 'Why does dropping the course matter beyond academics?', options: ['It could affect the scholarship', 'It changes the dorm', 'It costs a fee', 'It delays graduation by a year'], correct: 0 },
          { id: 'l6', prompt: 'What alternative does the advisor suggest?', options: ['Taking an exam early', 'Switching to pass/fail', 'Hiring a tutor', 'Auditing the class'], correct: 1 }
        ]
      },
      {
        id: 'speaking',
        label: 'Speaking',
        kind: 'speaking',
        minutes: 17,
        prompts: [
          { id: 's1', part: 'Independent', prompt: 'Some students prefer to study alone; others prefer to study in groups. Which do you prefer and why? Speak for 45 seconds.' },
          { id: 's2', part: 'Integrated', prompt: 'Summarise the main reasons the reading and listening passages give about library access, and state your view.' }
        ]
      },
      {
        id: 'writing',
        label: 'Writing',
        kind: 'writing',
        minutes: 50,
        prompt: 'Do you agree or disagree: "Universities should require every student to take history courses." Use specific reasons and examples. Write at least 300 words.',
        minWords: 300
      }
    ]
  },

  cefr: {
    id: 'cefr',
    kind: 'cefr',
    title: 'CEFR placement test',
    scaleLabel: 'Your level',
    sections: [
      {
        id: 'usage',
        label: 'Grammar & vocabulary',
        kind: 'mcq',
        minutes: 25,
        items: [
          { id: 'c1', prompt: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], correct: 0 },
          { id: 'c2', prompt: 'She ___ coffee every morning.', options: ['drink', 'drinks', 'drinking', 'drank'], correct: 1 },
          { id: 'c3', prompt: 'We ___ to London last year.', options: ['go', 'gone', 'went', 'going'], correct: 2 },
          { id: 'c4', prompt: "There ___ any milk in the fridge.", options: ["isn't", "aren't", "wasn't", "hasn't"], correct: 0 },
          { id: 'c5', prompt: 'If it rains, we ___ at home.', options: ['stay', 'will stay', 'stayed', 'would stay'], correct: 1 },
          { id: 'c6', prompt: "I've lived here ___ 2019.", options: ['for', 'since', 'from', 'at'], correct: 1 },
          { id: 'c7', prompt: 'By the time we arrived, the film ___.', options: ['started', 'has started', 'had started', 'starts'], correct: 2 },
          { id: 'c8', prompt: 'She suggested ___ a taxi.', options: ['to take', 'taking', 'take', 'took'], correct: 1 },
          { id: 'c9', prompt: '___ harder, he would have passed.', options: ['If he studied', 'Had he studied', 'Did he study', 'He had studied'], correct: 1 },
          { id: 'c10', prompt: 'The proposal was turned ___ by the board.', options: ['off', 'up', 'down', 'over'], correct: 2 },
          { id: 'c11', prompt: 'Little ___ that he was being watched.', options: ['he knew', 'did he know', 'he did know', 'knew he'], correct: 1 },
          { id: 'c12', prompt: 'Her argument was ___ flawed.', options: ['fundamentally', 'fundamental', 'foundation', 'found'], correct: 0 }
        ]
      }
    ]
  },

  sat: {
    id: 'sat',
    kind: 'sat',
    title: 'SAT',
    scaleLabel: 'Total score',
    sections: [
      {
        id: 'reading',
        label: 'Reading & Writing',
        kind: 'mcq',
        minutes: 64,
        passage: PRINTING_PRESS,
        items: [
          { id: 'rw1', prompt: 'Which choice best states the main idea of the passage?', options: ['The printing press transformed European society', 'Gutenberg was a poor businessman', 'Scribes worked very quickly', 'Books were always cheap'], correct: 0 },
          { id: 'rw2', prompt: 'The phrase "privilege of a narrow elite" implies that literacy was…', options: ['limited to a few', 'common among all', 'illegal', 'declining'], correct: 0 },
          { id: 'rw3', prompt: 'According to the passage, the press caused the price of books to…', options: ['rise sharply', 'stay fixed', 'fall sharply', 'double'], correct: 2 },
          { id: 'rw4', prompt: 'The author suggests the press helped bring about the…', options: ['fall of Rome', 'Reformation and scientific revolution', 'discovery of fire', 'end of all handwriting'], correct: 1 },
          { id: 'rw5', prompt: 'Choose the grammatical option: "Neither the scribes nor the printer ___ able to keep up."', options: ['were', 'was', 'be', 'being'], correct: 1 },
          { id: 'rw6', prompt: 'Select the best transition: "Books were once rare. ___, they soon became common."', options: ['Therefore', 'However', 'Likewise', 'For example'], correct: 1 },
          { id: 'rw7', prompt: 'Choose the most concise option: "in spite of the fact that"', options: ['although', 'owing to the fact that', 'in light of the reality that', 'considering that the'], correct: 0 },
          { id: 'rw8', prompt: 'Which is correctly punctuated?', options: ['Its a remarkable story.', "It's a remarkable story.", 'Its\' a remarkable story.', 'Its; a remarkable story.'], correct: 1 }
        ]
      },
      {
        id: 'math',
        label: 'Math',
        kind: 'mcq',
        minutes: 70,
        items: [
          { id: 'm1', prompt: 'If 3x + 5 = 20, then x = ?', options: ['3', '5', '7', '15'], correct: 1 },
          { id: 'm2', prompt: 'What is 15% of 80?', options: ['8', '12', '15', '20'], correct: 1 },
          { id: 'm3', prompt: 'The average of 4, 8, and 12 is…', options: ['6', '8', '10', '12'], correct: 1 },
          { id: 'm4', prompt: 'If a square has area 49, its perimeter is…', options: ['14', '21', '28', '49'], correct: 2 },
          { id: 'm5', prompt: 'Solve: 2(x − 3) = 10. x = ?', options: ['5', '8', '2', '13'], correct: 1 },
          { id: 'm6', prompt: 'A line has slope 2 through (0, 1). y when x = 3?', options: ['5', '6', '7', '8'], correct: 2 },
          { id: 'm7', prompt: 'If 5 pens cost $3.75, one pen costs…', options: ['$0.60', '$0.75', '$0.85', '$1.25'], correct: 1 },
          { id: 'm8', prompt: 'What is √144 ?', options: ['11', '12', '13', '14'], correct: 1 }
        ]
      }
    ]
  },

  gmat: {
    id: 'gmat',
    kind: 'gmat',
    title: 'GMAT',
    scaleLabel: 'Total score',
    sections: [
      {
        id: 'verbal',
        label: 'Verbal',
        kind: 'mcq',
        minutes: 45,
        items: [
          { id: 'v1', prompt: 'Sentence correction: "The data ___ conclusive." Choose the best option.', options: ['is', 'are', 'be', 'been'], correct: 1 },
          { id: 'v2', prompt: 'Critical reasoning: A sales rise followed an ad campaign. The claim that the ad caused it assumes…', options: ['no other factor changed', 'sales always rise', 'ads are cheap', 'customers dislike ads'], correct: 0 },
          { id: 'v3', prompt: 'Choose the grammatical option: "Each of the managers ___ a report."', options: ['submit', 'submits', 'submitting', 'have submitted'], correct: 1 },
          { id: 'v4', prompt: 'Which word is closest in meaning to "mitigate"?', options: ['worsen', 'lessen', 'ignore', 'measure'], correct: 1 },
          { id: 'v5', prompt: 'Reading inference: If profits fell while revenue rose, then…', options: ['costs rose', 'sales fell', 'taxes ended', 'prices rose'], correct: 0 },
          { id: 'v6', prompt: 'Parallelism: "She likes hiking, swimming, and ___."', options: ['to bike', 'biking', 'bikes', 'biked'], correct: 1 }
        ]
      },
      {
        id: 'quant',
        label: 'Quantitative',
        kind: 'mcq',
        minutes: 45,
        items: [
          { id: 'q1', prompt: 'If x/4 = 6, then x = ?', options: ['10', '18', '24', '2'], correct: 2 },
          { id: 'q2', prompt: 'A shirt costs $40 after a 20% discount. Original price?', options: ['$48', '$50', '$60', '$45'], correct: 1 },
          { id: 'q3', prompt: 'What is 7² − 3² ?', options: ['16', '40', '49', '58'], correct: 1 },
          { id: 'q4', prompt: 'If the ratio of a:b is 2:3 and a = 8, then b = ?', options: ['10', '12', '6', '16'], correct: 1 },
          { id: 'q5', prompt: 'A train travels 180 km in 3 hours. Speed?', options: ['50 km/h', '60 km/h', '70 km/h', '90 km/h'], correct: 1 },
          { id: 'q6', prompt: 'Probability of an even number on a fair die?', options: ['1/6', '1/3', '1/2', '2/3'], correct: 2 }
        ]
      }
    ]
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/** IELTS Listening/Reading raw (out of ~6 here) → band, scaled from the 40-q table. */
function ieltsBand(correct: number, total: number): number {
  const ratio = total ? correct / total : 0
  if (ratio >= 0.95) return 9
  if (ratio >= 0.87) return 8
  if (ratio >= 0.75) return 7
  if (ratio >= 0.6) return 6.5
  if (ratio >= 0.5) return 6
  if (ratio >= 0.4) return 5.5
  if (ratio >= 0.3) return 5
  if (ratio >= 0.2) return 4.5
  return 4
}

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2
}

function ratioToScaled(correct: number, total: number, lo: number, hi: number): number {
  const ratio = total ? correct / total : 0
  return Math.round((lo + ratio * (hi - lo)) / 10) * 10
}

export const CEFR_BY_RATIO: { min: number; level: string; ielts: string }[] = [
  { min: 0.9, level: 'C2', ielts: '8.0+' },
  { min: 0.75, level: 'C1', ielts: '7.0–7.5' },
  { min: 0.58, level: 'B2', ielts: '5.5–6.5' },
  { min: 0.42, level: 'B1', ielts: '4.5–5.0' },
  { min: 0.25, level: 'A2', ielts: '3.5–4.0' },
  { min: 0, level: 'A1', ielts: '3.0' }
]

export interface ExamScore {
  overall: string
  /** Numeric overall, persisted into ExamAttempt.overall. */
  overallNumeric: number
  scaleLabel: string
  sections: SectionResult[]
}

/**
 * Combine per-section results (already computed for mcq sections; writing /
 * speaking results passed in pre-graded) into the family's reporting scale.
 */
export function scoreExam(bank: ExamBank, sections: SectionResult[]): ExamScore {
  if (bank.kind === 'ielts') {
    // Each section already carries an IELTS band in `numeric`.
    const overall = roundHalf(sections.reduce((s, x) => s + x.numeric, 0) / sections.length)
    return { overall: overall.toFixed(1), overallNumeric: overall, scaleLabel: 'Overall band', sections }
  }
  if (bank.kind === 'toefl') {
    const total = sections.reduce((s, x) => s + x.numeric, 0)
    return { overall: String(Math.round(total)), overallNumeric: Math.round(total), scaleLabel: 'Total score (/120)', sections }
  }
  if (bank.kind === 'cefr') {
    const s = sections[0]
    const ratio = s.total ? (s.correct ?? 0) / s.total : 0
    const row = CEFR_BY_RATIO.find((r) => ratio >= r.min) ?? CEFR_BY_RATIO[CEFR_BY_RATIO.length - 1]
    return { overall: row.level, overallNumeric: Math.round(ratio * 100), scaleLabel: `Your level · IELTS ~${row.ielts}`, sections }
  }
  if (bank.kind === 'sat') {
    const total = sections.reduce((s, x) => s + x.numeric, 0)
    return { overall: String(total), overallNumeric: total, scaleLabel: 'Total score (/1600)', sections }
  }
  if (bank.kind === 'gmat') {
    const total = sections.reduce((s, x) => s + x.numeric, 0)
    return { overall: String(total), overallNumeric: total, scaleLabel: 'Total score (200–800)', sections }
  }
  // custom — average the per-section percentages into an overall /100.
  const avgPct = sections.length ? Math.round(sections.reduce((s, x) => s + x.pct, 0) / sections.length) : 0
  return { overall: `${avgPct}%`, overallNumeric: avgPct, scaleLabel: 'Overall score', sections }
}

/** Build the per-section `SectionResult` for an objective (mcq) section. */
export function scoreMcqSection(bank: ExamBank, section: MCQSection, correct: number): SectionResult {
  const total = section.items.length
  if (bank.kind === 'ielts') {
    const band = ieltsBand(correct, total)
    return { id: section.id, label: section.label, correct, total, score: band.toFixed(1), numeric: band, pct: Math.round((correct / total) * 100) }
  }
  if (bank.kind === 'toefl') {
    const scaled = Math.round((correct / total) * 30)
    return { id: section.id, label: section.label, correct, total, score: String(scaled), numeric: scaled, pct: Math.round((correct / total) * 100) }
  }
  if (bank.kind === 'sat') {
    const scaled = ratioToScaled(correct, total, 200, 800)
    return { id: section.id, label: section.label, correct, total, score: String(scaled), numeric: scaled, pct: Math.round((correct / total) * 100) }
  }
  if (bank.kind === 'gmat') {
    // Two sections each contribute up to ~300 above a 200 base → 200–800 total.
    const scaled = Math.round((correct / total) * 300)
    return { id: section.id, label: section.label, correct, total, score: `+${scaled}`, numeric: 100 + scaled, pct: Math.round((correct / total) * 100) }
  }
  // cefr / custom — raw correct out of total, percentage drives the band.
  return { id: section.id, label: section.label, correct, total, score: `${correct}/${total}`, numeric: Math.round((correct / total) * 100), pct: Math.round((correct / total) * 100) }
}
