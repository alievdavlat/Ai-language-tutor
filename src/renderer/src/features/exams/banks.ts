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

/**
 * Question type taxonomy — drives the progress dashboard's "weak question types"
 * breakdown. Tagging is optional (older items default to `general`).
 */
export type QType =
  | 'main-idea'
  | 'detail'
  | 'inference'
  | 'vocabulary'
  | 'reference'
  | 'purpose'
  | 'grammar'
  | 'math'
  | 'general'

export const QTYPE_LABEL: Record<QType, string> = {
  'main-idea': 'Main idea',
  detail: 'Detail / fact',
  inference: 'Inference',
  vocabulary: 'Vocabulary in context',
  reference: 'Reference',
  purpose: "Author's purpose",
  grammar: 'Grammar & usage',
  math: 'Problem solving',
  general: 'General'
}

export interface MCQItem {
  id: string
  prompt: string
  options: string[]
  /** Index of the correct option. */
  correct: number
  /** Question type — powers the weak-question-type dashboard. */
  qtype?: QType
  /**
   * Where the answer is found — a short quote/locator from the passage or
   * transcript. Shown in the "Locate & Explain" review.
   */
  locate?: string
  /** Why the correct option is right (and others wrong). Shown in review. */
  explain?: string
}

export type SectionKind = 'mcq' | 'writing' | 'speaking'

export interface MCQSection {
  id: string
  label: string
  kind: 'mcq'
  minutes: number
  /** Optional reading/listening stimulus shown above the questions. */
  passage?: string
  /** For listening sections — a transcript stands in for audio in this offline build. */
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

// ─── Shared passages ──────────────────────────────────────────────────────────

const INDUSTRIAL = `The Industrial Revolution marked a major turning point in history. Almost every aspect of daily life was influenced in some way. Average income and population began to exhibit unprecedented sustained growth. Economists argue that the most important effect was that the standard of living for the general population began to increase consistently for the first time in history, although others have said it did not begin to improve meaningfully until the late 19th and 20th centuries.`

const LIBRARY_DIALOGUE = `WOMAN: Hi, I'd like to know your opening hours. MAN: Sure. On weekdays we're open from nine in the morning until eight in the evening. WOMAN: And weekends? MAN: Saturdays ten to six, and we're closed on Sundays. To borrow books you'll need a membership card, which is free for students. You can keep most books for three weeks.`

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
        passage: INDUSTRIAL,
        items: [
          { id: 'r1', prompt: 'What is the main idea of the passage?', options: ['The Revolution changed daily life', 'Factories were dangerous', 'Trade declined', 'Population fell'], correct: 0 },
          { id: 'r2', prompt: 'According to the passage, income and population…', options: ['stayed flat', 'grew without precedent', 'shrank', 'were unrelated'], correct: 1 },
          { id: 'r3', prompt: 'The disagreement among scholars concerns…', options: ['when living standards rose', 'who invented the engine', 'where it started', 'why it ended'], correct: 0 },
          { id: 'r4', prompt: '"Sustained" most nearly means…', options: ['brief', 'continuous', 'damaged', 'reduced'], correct: 1 },
          { id: 'r5', prompt: 'The passage implies that before this period, living standards…', options: ['rose steadily', 'did not consistently improve', 'were the highest ever', 'fell every year'], correct: 1 },
          { id: 'r6', prompt: 'Which would best continue the passage?', options: ['Specific economic data', 'A poem', 'A recipe', 'A map legend'], correct: 0 }
        ]
      },
      {
        id: 'listening',
        label: 'Listening',
        kind: 'mcq',
        minutes: 41,
        audioTranscript: LIBRARY_DIALOGUE,
        items: [
          { id: 'l1', prompt: 'Why is the woman calling?', options: ['To complain', 'To ask about hours', 'To return a book', 'To get a job'], correct: 1 },
          { id: 'l2', prompt: 'Weekday closing time is…', options: ['6 pm', '8 pm', '9 pm', '10 pm'], correct: 1 },
          { id: 'l3', prompt: 'Student membership is…', options: ['$5', 'free', '$15', 'unavailable'], correct: 1 },
          { id: 'l4', prompt: 'Loan period for most books is…', options: ['1 week', '2 weeks', '3 weeks', '4 weeks'], correct: 2 },
          { id: 'l5', prompt: 'The library is closed on…', options: ['Mondays', 'Saturdays', 'Sundays', 'holidays only'], correct: 2 },
          { id: 'l6', prompt: 'The man\'s attitude is…', options: ['unhelpful', 'helpful', 'rude', 'confused'], correct: 1 }
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
        passage: INDUSTRIAL,
        items: [
          { id: 'rw1', prompt: 'Which choice best states the main idea of the passage?', options: ['The Revolution reshaped daily life', 'Factories caused pollution', 'Trade routes closed', 'Population declined'], correct: 0 },
          { id: 'rw2', prompt: 'As used in the passage, "exhibit" most nearly means…', options: ['display', 'hide', 'sell', 'paint'], correct: 0 },
          { id: 'rw3', prompt: 'Choose the option that makes the sentence grammatical: "Neither the workers nor the owner ___ satisfied."', options: ['were', 'was', 'be', 'being'], correct: 1 },
          { id: 'rw4', prompt: 'Select the best transition: "Income rose. ___, living standards lagged for decades."', options: ['Therefore', 'However', 'Likewise', 'For example'], correct: 1 },
          { id: 'rw5', prompt: 'Which is correctly punctuated?', options: ['Its a long history.', "It's a long history.", 'Its\' a long history.', 'Its; a long history.'], correct: 1 },
          { id: 'rw6', prompt: 'The author\'s primary purpose is to…', options: ['inform', 'persuade against industry', 'entertain', 'advertise'], correct: 0 },
          { id: 'rw7', prompt: 'Choose the most concise option: "due to the fact that"', options: ['because', 'owing to the fact that', 'in light of the reality', 'considering that the'], correct: 0 },
          { id: 'rw8', prompt: 'Subject–verb agreement: "The list of items ___ on the desk."', options: ['are', 'is', 'were', 'be'], correct: 1 }
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
  // gmat
  const total = sections.reduce((s, x) => s + x.numeric, 0)
  return { overall: String(total), overallNumeric: total, scaleLabel: 'Total score (200–800)', sections }
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
  // cefr
  return { id: section.id, label: section.label, correct, total, score: `${correct}/${total}`, numeric: Math.round((correct / total) * 100), pct: Math.round((correct / total) * 100) }
}
